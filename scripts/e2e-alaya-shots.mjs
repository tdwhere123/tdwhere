/**
 * Screenshot pass for /alaya — hero, signature Similarity demo states,
 * desktop + mobile, zh + en. Output: /tmp/cursor/pages-v2/alaya/
 * Usage: node scripts/e2e-alaya-shots.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.argv[2] || 'http://localhost:3000'
const OUT = '/tmp/cursor/pages-v2/alaya'
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
  await page.goto(`${BASE}/alaya`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await wait(1800)
  return page
}

async function scrollToSignature(page) {
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('section')].find((s) =>
      s.querySelector('[role="slider"], [role="tablist"]'),
    )
    el?.scrollIntoView({ block: 'center', behavior: 'instant' })
  })
  await wait(800)
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
    const d = await newPage(browser, 1280, 900, lang)
    await d.screenshot({ path: path.join(OUT, `${lang}-desktop-01-hero.png`) })

    // signature: initial (auto-sweep rests at ~0.32)
    await scrollToSignature(d)
    await wait(3600) // let the one-time sweep finish
    await d.screenshot({ path: path.join(OUT, `${lang}-desktop-02-similarity-rest.png`) })

    // signature: drag divider to the left third (mostly truth revealed)
    const box = await d.evaluate(() => {
      const el = document.querySelector('[role="slider"]')?.closest('div.relative')
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.left, y: r.top, w: r.width, h: r.height }
    })
    if (box) {
      const cy = box.y + box.h / 2
      await d.mouse.move(box.x + box.w * 0.55, cy)
      await d.mouse.down()
      await d.mouse.move(box.x + box.w * 0.25, cy, { steps: 12 })
      await d.mouse.up()
      await wait(500)
      await d.screenshot({ path: path.join(OUT, `${lang}-desktop-03-similarity-dragged.png`) })
    } else {
      console.error('slider pane not found', lang)
    }
    await d.close()

    // —— mobile 390x844 ——
    const m = await newPage(browser, 390, 844, lang, true)
    await m.screenshot({ path: path.join(OUT, `${lang}-mobile-01-hero.png`) })
    await scrollToSignature(m)
    await m.screenshot({ path: path.join(OUT, `${lang}-mobile-02-similarity-a.png`) })
    // tap the B tab
    await m.evaluate(() => {
      const tabs = [...document.querySelectorAll('[role="tab"]')]
      tabs[1]?.click()
    })
    await wait(600)
    await m.screenshot({ path: path.join(OUT, `${lang}-mobile-03-similarity-b.png`) })
    await m.close()
  }

  await browser.close()
  console.log('done →', OUT)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
