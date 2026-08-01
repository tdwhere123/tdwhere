/**
 * do-it page screenshots (pipeline signature states).
 * Usage: node scripts/e2e-doit-pipeline.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.argv[2] || 'http://localhost:3000'
const OUT = '/tmp/cursor/pages-v2/do-it'
fs.mkdirSync(OUT, { recursive: true })

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function newPage(browser, width, height, lang, mobile = false) {
  const page = await browser.newPage()
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile })
  await page.evaluateOnNewDocument((l) => {
    try {
      window.localStorage.setItem('tdwhere-lang', l)
    } catch {}
  }, lang)
  const res = await page.goto(`${BASE}/do-it`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  if (!res || res.status() >= 400) throw new Error(`goto failed ${res?.status()}`)
  await wait(1500)
  return page
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file })
  console.log('saved', file)
}

async function scrollTo(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
  await wait(700)
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath:
      process.env.CHROME_PATH ||
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      '/usr/local/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--proxy-server=direct://'],
  })

  for (const lang of ['zh', 'en']) {
    // —— desktop 1280x900 ——
    const page = await newPage(browser, 1280, 900, lang)
    page.on('pageerror', (e) => console.error('PAGEERROR', String(e)))

    await shot(page, `${lang}-desktop-01-top`)

    const pinTop = await page.evaluate(() => {
      const el = document.getElementById('pipeline')
      if (!el) return -1
      return el.getBoundingClientRect().top + window.scrollY
    })
    console.log(`${lang} pinTop`, pinTop)
    if (pinTop < 0) throw new Error('pipeline section missing')

    // scroll just before pin (section visible approaching)
    await scrollTo(page, pinTop - 500)
    await shot(page, `${lang}-desktop-02-approach`)

    // pinned: gate 1 lit (start of pin)
    await scrollTo(page, pinTop + 60)
    await shot(page, `${lang}-desktop-03-pin-gate1`)

    // mid journey: between gates 2-3 (timeline t≈2 of 4 → progress fraction ≈ 2/4.4)
    await scrollTo(page, pinTop + Math.round(2200 * (2.0 / 4.4)))
    await shot(page, `${lang}-desktop-04-pin-mid`)

    // near end: gate 4 VERIFIED
    await scrollTo(page, pinTop + Math.round(2200 * (3.7 / 4.4)))
    await shot(page, `${lang}-desktop-05-pin-gate4`)

    // after unpin: descriptions all lit
    await scrollTo(page, pinTop + 2400)
    await shot(page, `${lang}-desktop-06-after-pin`)

    // router simulator (auto-runs on view) — wait full act cycle
    await page.evaluate(() => {
      document.getElementById('router')?.scrollIntoView({ block: 'start' })
    })
    await wait(5200)
    await shot(page, `${lang}-desktop-07-router-done`)

    await page.close()

    // —— mobile 390x844 ——
    const m = await newPage(browser, 390, 844, lang, true)
    m.on('pageerror', (e) => console.error('PAGEERROR(m)', String(e)))
    await shot(m, `${lang}-mobile-01-top`)

    await m.evaluate(() => {
      const el = [...document.querySelectorAll('section')].find(
        (s) => /FOUR GATES|走一遍/.test(s.textContent || '') && s.offsetParent !== null,
      )
      el?.scrollIntoView({ block: 'start' })
    })
    await wait(900)
    await shot(m, `${lang}-mobile-02-journey`)

    // tap gate 3 (REVIEW)
    await m.evaluate(() => {
      const tabs = [...document.querySelectorAll('[role="tab"]')]
      tabs[2]?.click()
    })
    await wait(600)
    await shot(m, `${lang}-mobile-03-gate3`)

    await m.close()
  }

  await browser.close()
  console.log('DONE')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
