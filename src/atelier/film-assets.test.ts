import { afterEach, describe, expect, it } from 'vitest'
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, unlink, utimes, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { build, createServer } from 'vite'
import { filmAssets, generateFilmVariants } from '../../scripts/film-assets'
import { collect, filmImage } from './film'
import { heroFrame } from './grounds'

const temporary: string[] = []
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'film-assets-'))
  temporary.push(root)
  const roll = path.join(root, 'src/assets/film/new-roll')
  await mkdir(roll, { recursive: true })
  const file = path.join(roll, '01.JPG')
  await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#4592bd' } })
    .withMetadata({ orientation: 6 }).jpeg().toFile(file)
  const entry = path.join(root, 'entry.js')
  await writeFile(entry, `globalThis.films = import.meta.glob('./src/assets/film/*/*.{jpg,JPG,png}', {
    query: '?film-asset', eager: true, import: 'default'
  });`)
  return { root, file, entry, cache: path.join(root, 'node_modules/.cache/film-assets') }
}

describe('font stylesheet delivery', () => {
  it('keeps every external font stylesheet non-blocking with an equivalent no-JS fallback', async () => {
    const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8')
    const fallback = html.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? ''
    const active = html.replace(/<noscript>[\s\S]*?<\/noscript>/g, '')
    const stylesheets = (source: string) => (source.match(/<link\b[^>]*>/g) ?? [])
      .filter((tag) => tag.includes('rel="stylesheet"') && /href="https:\/\//.test(tag))
    const links = stylesheets(active)
    expect(links).toHaveLength(3)
    for (const link of links) {
      expect(link).toContain('media="print"')
      expect(link).toContain('onload="this.media=\'all\';this.onload=null"')
    }
    const urls = (links: string[]) => links.map((link) => link.match(/href="([^"]+)"/)?.[1]).sort()
    expect(urls(stylesheets(fallback))).toEqual(urls(links))
    expect(stylesheets(fallback).every((link) => !link.includes('media='))).toBe(true)
  })
})

describe('film asset boundary', () => {
  it('selects variants without changing frame identity, original quality, focus or captions', () => {
    const asset = {
      src: '/original.jpg', width: 2000, height: 1500,
      thumbnail: { src: '/thumb.webp', width: 320, height: 240 },
      preview: { src: '/preview.webp', width: 640, height: 480 },
    }
    const [roll] = collect({ '/film/new-roll/01.jpg': asset }, {
      '/film/new-roll/roll.json': { frames: { '01': { focus: '60% 40%', alt: { zh: '河流', en: 'River' } } } },
    })
    const [frame] = roll.frames
    expect(frame).toMatchObject({ id: 'new-roll/01', roll: 'new-roll', name: '01', src: '/original.jpg', focus: '60% 40%', alt: { en: 'River' } })
    expect(filmImage(frame, 'thumbnail')).toEqual(asset.thumbnail)
    expect(filmImage(frame, 'preview')).toEqual(asset.preview)
    expect(frame.src).toBe('/original.jpg')
  })

  it('falls back to the original for legacy/ground assets and individually absent variants', () => {
    const [roll] = collect({ '/film/roll/01.jpg': '/original.jpg' }, {})
    expect(filmImage(roll.frames[0], 'thumbnail').src).toBe('/original.jpg')
    expect(filmImage(heroFrame, 'preview').src).toBe(heroFrame.src)
    expect(filmImage({ src: '/full.jpg', thumbnail: { src: '/thumb.webp' } }, 'preview').src).toBe('/full.jpg')
  })
})

describe('persistent film generation', () => {
  it('auto-orients, preserves the whole frame and leaves original bytes untouched', async () => {
    const { file, cache } = await fixture()
    const original = await readFile(file)
    const generated = await generateFilmVariants(file, cache)
    expect(generated).toMatchObject({ width: 800, height: 1200, thumbnail: { width: 320, height: 480 }, preview: { width: 640, height: 960 } })
    const metadata = await sharp(path.join(cache, generated.thumbnail.file)).metadata()
    expect(metadata).toMatchObject({ format: 'webp', width: 320, height: 480 })
    expect(await readFile(file)).toEqual(original)
  })

  it('reuses identical content across names, invalidates changed bytes and repairs a missing derivative', async () => {
    const { root, file, cache } = await fixture()
    const first = await generateFilmVariants(file, cache)
    const thumb = path.join(cache, first.thumbnail.file)
    await utimes(thumb, 10, 10)
    const renamed = path.join(root, 'renamed.jpg')
    await copyFile(file, renamed)
    expect(await generateFilmVariants(renamed, cache)).toEqual(first)
    expect((await stat(thumb)).mtimeMs).toBe(10000)
    await unlink(thumb)
    expect(await generateFilmVariants(file, cache)).toEqual(first)
    expect((await stat(thumb)).size).toBeGreaterThan(0)
    await sharp({ create: { width: 80, height: 120, channels: 3, background: '#bd6045' } }).jpeg().toFile(file)
    const changed = await generateFilmVariants(file, cache)
    expect(changed.thumbnail.file).not.toBe(first.thumbnail.file)
    expect(changed.thumbnail).toMatchObject({ width: 80, height: 120 }) // never upscale
  })

  it('surfaces corrupt originals instead of silently shipping full-size fallbacks', async () => {
    const { file, cache } = await fixture()
    await writeFile(file, 'not an image')
    await expect(generateFilmVariants(file, cache)).rejects.toThrow()
  })
})

describe('Vite film integration', () => {
  it('emits originals and derivatives beneath the production base, but no canister variants', async () => {
    const { root, entry, file } = await fixture()
    await sharp({ create: { width: 30, height: 80, channels: 4, background: '#ffbb33' } })
      .png().toFile(path.join(path.dirname(file), 'canister.png'))
    const result = await build({
      configFile: false, root, base: '/tdwhere/', plugins: [filmAssets()], logLevel: 'silent',
      build: { write: false, minify: false, assetsInlineLimit: 0, rollupOptions: { input: entry } },
    })
    if (!('output' in result)) throw new Error('Expected a single Rollup build')
    const webps = result.output.filter((output) => output.type === 'asset' && output.fileName.endsWith('.webp'))
    expect(webps).toHaveLength(2)
    expect(result.output.some((output) => output.fileName.endsWith('.JPG'))).toBe(true)
    expect(result.output.some((output) => output.fileName.endsWith('.png'))).toBe(true)
    const code = result.output.filter((output) => output.type === 'chunk').map((chunk) => chunk.code).join('\n')
    for (const variant of webps) expect(code).toContain(`/tdwhere/${variant.fileName}`)
    expect(code).toContain('thumbnail: { src: thumbnail, width: 320, height: 480 }')
  })

  it('serves real derivatives in dev and discovers a newly dropped roll without a manifest edit', async () => {
    const { root, file } = await fixture()
    const server = await createServer({
      configFile: false, root, plugins: [filmAssets()], logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0 }, optimizeDeps: { noDiscovery: true },
    })
    try {
      await server.listen()
      const transformed = await server.transformRequest('/src/assets/film/new-roll/01.JPG?film-asset')
      const thumbnail = transformed?.code.match(/import thumbnail from "([^"]+)"/)?.[1]
      expect(thumbnail).toBeDefined()
      const address = server.httpServer!.address()
      if (!address || typeof address === 'string') throw new Error('Expected an HTTP listener')
      const response = await fetch(`http://127.0.0.1:${address.port}${thumbnail!.split('?')[0]}`)
      expect(response.status).toBe(200)
      expect(await sharp(Buffer.from(await response.arrayBuffer())).metadata()).toMatchObject({ format: 'webp', width: 320 })
      await server.transformRequest('/entry.js')
      const dropped = path.join(root, 'src/assets/film/dropped-roll/02.jpg')
      await mkdir(path.dirname(dropped))
      await copyFile(file, dropped)
      await expect.poll(async () => (await server.transformRequest('/entry.js'))?.code, { timeout: 5000 }).toContain('dropped-roll/02.jpg')
      expect((await server.transformRequest('/src/assets/film/dropped-roll/02.jpg?film-asset'))?.code).toContain('width: 320')
      await sharp({ create: { width: 100, height: 200, channels: 3, background: '#bd6045' } }).jpeg().toFile(dropped)
      await expect.poll(async () => (await server.transformRequest('/src/assets/film/dropped-roll/02.jpg?film-asset'))?.code, { timeout: 5000 }).toContain('width: 100')
    } finally {
      await server.close()
    }
  }, 10000)
})
