/**
 * Headless smoke against the Vite preview/dev server.
 * Usage: node scripts/e2e-smoke.mjs [baseUrl]
 * Default: http://localhost:4173/tdwhere/
 */
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'

const BASE = process.argv[2] || 'http://localhost:4173/tdwhere/'
const ROUTES = ['', 'alaya', 'do-it', 'write-right', 'blog', 'about', 'playground', 'no-such-route']
const HERO = new Set(['', 'alaya', 'do-it', 'write-right', 'blog', 'about', 'playground', 'no-such-route'])
const WEBGL_NOISE = /WebGL|WEBGL|createWebGLContext|getContext/i

function findChrome() {
  const env = process.env.CHROME_PATH
  if (env && fs.existsSync(env)) return env
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ]
  const hit = candidates.find((p) => fs.existsSync(p))
  if (!hit) throw new Error('Chrome not found. Set CHROME_PATH.')
  return hit
}

function resolveUrl(route) {
  const base = BASE.endsWith('/') ? BASE : `${BASE}/`
  return new URL(route, base).href
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const results = []
function ok(name, detail = '') {
  results.push({ name, pass: true, detail })
  console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`)
}
function fail(name, detail = '') {
  results.push({ name, pass: false, detail })
  console.error(`FAIL  ${name}${detail ? ' — ' + detail : ''}`)
}

async function clickLang(page, label) {
  return page.evaluate((lab) => {
    const btn = [...document.querySelectorAll('.a-language button')].find(
      (b) => (b.textContent || '').trim() === lab,
    )
    if (!btn) return false
    btn.click()
    return true
  }, label)
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(30000)

  await page.setRequestInterception(true)
  page.on('request', (req) => {
    const u = req.url()
    if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) req.abort()
    else req.continue()
  })

  try {
    for (const route of ROUTES) {
      const pageErrors = []
      const onError = (e) => pageErrors.push(String(e))
      page.on('pageerror', onError)

      const url = resolveUrl(route)
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      const status = res?.status() ?? 0
      if (!res || status >= 400) throw new Error(`navigate ${url} status=${status}`)

      await page.waitForSelector('main#content', { timeout: 15000 })
      await page.waitForFunction(
        () => (document.querySelector('main#content')?.innerText || '').trim().length > 0,
        { timeout: 15000 },
      )
      const label = route || 'home'
      ok(`${label} · main#content`)

      if (HERO.has(route)) {
        await page.waitForFunction(
          () => !!(document.querySelector('canvas.a-paint') || document.querySelector('img.a-art')),
          { timeout: 15000 },
        )
        ok(`${label} · hero art`)
      }

      await wait(200)
      const realErrors = pageErrors.filter((e) => !WEBGL_NOISE.test(e))
      if (realErrors.length) fail(`${label} · page errors`, realErrors.slice(0, 3).join(' | '))
      else ok(`${label} · no page errors`)
      page.off('pageerror', onError)
    }

    await page.goto(resolveUrl(''), { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForSelector('.a-language', { timeout: 15000 })
    if (!(await clickLang(page, 'EN'))) throw new Error('EN toggle missing')
    await wait(400)
    const enText = await page.evaluate(() => document.body.innerText)
    if (!(await clickLang(page, '中'))) throw new Error('中 toggle missing')
    await wait(400)
    const zhText = await page.evaluate(() => document.body.innerText)
    if (!enText.trim() || !zhText.trim() || enText === zhText) {
      fail('language toggle', 'document text did not change between EN and 中')
    } else ok('language toggle')
  } catch (e) {
    fail('suite crashed', String(e))
  } finally {
    await browser.close()
  }

  const failed = results.filter((r) => !r.pass)
  console.log('\n=== SUMMARY ===')
  console.log(JSON.stringify({ base: BASE, passed: results.filter((r) => r.pass).length, failed: failed.length, results }, null, 2))
  process.exit(failed.length ? 1 : 0)
}

main()
