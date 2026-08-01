/**
 * Regression: SPA navigate → /alaya must keep main content visible
 * (Layout must not leave an opacity:0 curtain over Outlet).
 *
 * Usage: node scripts/e2e-alaya-nav.mjs [baseUrl]
 * baseUrl examples: http://localhost:3000  |  http://127.0.0.1:4173/tdwhere/
 */
import puppeteer from 'puppeteer-core'

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const CHROME =
  process.env.CHROME_PATH ||
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  '/home/tdwhere/bin/google-chrome'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function urlFor(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${BASE}${p === '/' ? '/' : p}`
}

async function probe(page) {
  return page.evaluate(() => {
    const main = document.querySelector('main')
    const h1 = document.querySelector('h1')
    const wrap = main?.firstElementChild
    return {
      url: location.pathname,
      mainOpacity: main ? getComputedStyle(main).opacity : null,
      wrapOpacity: wrap ? getComputedStyle(wrap).opacity : null,
      wrapInline: wrap?.getAttribute('style') || '',
      h1: h1?.textContent?.slice(0, 40) ?? null,
      h1Opacity: h1 ? getComputedStyle(h1).opacity : null,
      sections: document.querySelectorAll('main section').length,
      blank: (() => {
        const el = wrap || main
        if (!el) return true
        return Number(getComputedStyle(el).opacity) < 0.05
      })(),
    }
  })
}

async function navFrom(browser, fromPath) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  page.on('pageerror', (e) => console.error('[pageerror]', e.message.slice(0, 160)))
  const res = await page.goto(urlFor(fromPath), {
    waitUntil: 'networkidle0',
    timeout: 60000,
  })
  if (!res || res.status() >= 400) {
    await page.close()
    throw new Error(`goto ${fromPath} failed ${res?.status()}`)
  }
  await wait(1000)

  const clicked = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a')].find((x) => {
      const href = x.getAttribute('href') || ''
      return /(?:^|\/)alaya\/?$/.test(href) || /alaya/i.test(href)
    })
    if (!a) return false
    a.click()
    return true
  })
  if (!clicked) {
    // Fallback: client navigate via location (still SPA if History API)
    await page.evaluate((base) => {
      const root = base.replace(/\/$/, '')
      const prefix = root.includes('/tdwhere') ? '/tdwhere' : ''
      history.pushState({}, '', `${prefix}/alaya`)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, BASE)
    await wait(300)
    // Prefer a real link click — if none, use window navigation as last resort
    const hasH1 = await page.evaluate(() => !!document.querySelector('h1'))
    if (!hasH1) {
      await page.goto(urlFor('/alaya'), { waitUntil: 'domcontentloaded' })
      await page.close()
      throw new Error(`no /alaya link from ${fromPath}`)
    }
  }

  await wait(1600)
  const state = await probe(page)
  const tag = fromPath.replace(/\//g, '_') || 'home'
  await page.screenshot({ path: `/tmp/cursor/alaya-nav-fix-${tag}.png` })
  await page.close()
  return state
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
})

let failed = 0
for (const from of ['/', '/do-it']) {
  const state = await navFrom(browser, from)
  const ok =
    !state.blank &&
    state.h1 === 'Do-SOUL-Alaya' &&
    Number(state.h1Opacity) > 0.9 &&
    state.sections >= 6
  console.log(from, ok ? 'PASS' : 'FAIL', JSON.stringify(state))
  if (!ok) failed += 1
}

await browser.close()
if (failed) {
  console.error(`FAILED ${failed} route(s)`)
  process.exit(1)
}
console.log('DONE — Alaya SPA nav visible')
