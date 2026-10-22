import { createHash, randomUUID } from 'node:crypto'
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { normalizePath, type Plugin } from 'vite'

const widths = { thumbnail: 320, preview: 640 } as const
const webp = { quality: 78, effort: 4 } as const
// Include encoder versions and the complete recipe: changing either invalidates the cache.
const recipe = JSON.stringify({ version: 1, widths, webp, autoOrient: true, sharp: sharp.versions })

type Variant = { file: string; width: number; height: number }
type GeneratedFilm = { width: number; height: number; thumbnail: Variant; preview: Variant }

async function atomicWrite(file: string, data: string | Buffer) {
  const temporary = `${file}.${process.pid}-${randomUUID()}.tmp`
  await writeFile(temporary, data)
  await rename(temporary, file)
}

/** Content-addressed, uncropped derivatives. Originals never get rewritten. */
export async function generateFilmVariants(file: string, cacheDir: string): Promise<GeneratedFilm> {
  const source = await readFile(file)
  const key = createHash('sha256').update(recipe).update(source).digest('hex').slice(0, 24)
  const manifest = path.join(cacheDir, `${key}.json`)
  try {
    const cached = JSON.parse(await readFile(manifest, 'utf8')) as GeneratedFilm
    await Promise.all([cached.thumbnail, cached.preview].map((v) => access(path.join(cacheDir, v.file))))
    return cached
  } catch (error) {
    // A missing/incomplete cache can be rebuilt; permission and other I/O failures should surface.
    if (!(error instanceof SyntaxError) && (error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }

  await mkdir(cacheDir, { recursive: true })
  const image = sharp(source)
  const metadata = await image.metadata()
  const { width, height } = metadata.autoOrient
  const make = async (kind: keyof typeof widths): Promise<Variant> => {
    const output = await image.clone().autoOrient()
      .resize({ width: widths[kind], withoutEnlargement: true })
      .webp(webp)
      .toBuffer({ resolveWithObject: true })
    const name = `${key}-${widths[kind]}.webp`
    await atomicWrite(path.join(cacheDir, name), output.data)
    return { file: name, width: output.info.width, height: output.info.height }
  }
  const generated = { width, height, thumbnail: await make('thumbnail'), preview: await make('preview') }
  // Commit last, so an interrupted generation is never mistaken for a complete entry.
  await atomicWrite(manifest, JSON.stringify(generated))
  return generated
}

/**
 * `?film-asset` is still an ordinary Vite image dependency (including HMR/glob discovery).
 * Vite owns public URLs, base paths, hashing and production emission, not a second manifest.
 */
export function filmAssets(): Plugin {
  let filmDir: string
  let cacheDir: string
  // Keep cold builds bounded instead of decoding every roll concurrently.
  let queue: Promise<void> = Promise.resolve()
  return {
    name: 'film-assets',
    enforce: 'pre',
    configResolved(config) {
      filmDir = path.resolve(config.root, 'src/assets/film')
      cacheDir = path.resolve(config.root, 'node_modules/.cache/film-assets')
    },
    async load(id) {
      const [file, query] = id.split('?')
      if (!new URLSearchParams(query).has('film-asset')) return
      const relative = path.relative(filmDir, file)
      if (relative.startsWith('..') || relative.split(path.sep).length !== 2 || !/\.(jpe?g|png|webp|avif)$/i.test(file)) return
      this.addWatchFile(file)
      const original = `import src from ${JSON.stringify(`${normalizePath(file)}?url`)};\n`
      // Canister cut-outs remain separate from the frame collection.
      if (/^canister\./i.test(path.basename(file))) return `${original}export default src;`
      const pending = queue.then(() => generateFilmVariants(file, cacheDir))
      queue = pending.then(() => undefined, () => undefined)
      const generated = await pending
      const imports = (['thumbnail', 'preview'] as const).map((kind) =>
        `import ${kind} from ${JSON.stringify(`${normalizePath(path.join(cacheDir, generated[kind].file))}?url&no-inline`)};`,
      ).join('\n')
      return `${original}${imports}
export default {
  src, width: ${generated.width}, height: ${generated.height},
  thumbnail: { src: thumbnail, width: ${generated.thumbnail.width}, height: ${generated.thumbnail.height} },
  preview: { src: preview, width: ${generated.preview.width}, height: ${generated.preview.height} }
};`
    },
  }
}
