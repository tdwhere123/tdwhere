import puppeteer from 'puppeteer-core'

const BASE = 'http://localhost:4521/tdwhere/'
const CHROME = '/home/tdwhere/bin/google-chrome'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  headless: true,
})

// desktop: the works/field section
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 })
await new Promise((r) => setTimeout(r, 2500))
await page.evaluate(() => document.getElementById('works')?.scrollIntoView({ block: 'start' }))
await new Promise((r) => setTimeout(r, 6000)) // let the field bloom + waves fire
await page.screenshot({ path: '/tmp/cursor/field-desktop.png' })
// hover the alaya row to light its anchor
await page.evaluate(() => {
  const a = [...document.querySelectorAll('#works a')].find((x) => /alaya/i.test(x.textContent || ''))
  if (a) a.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
})
await new Promise((r) => setTimeout(r, 1600))
await page.screenshot({ path: '/tmp/cursor/field-desktop-hover.png' })

// mobile
const m = await browser.newPage()
await m.setViewport({ width: 390, height: 844 })
await m.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 })
await new Promise((r) => setTimeout(r, 2500))
await m.evaluate(() => document.getElementById('works')?.scrollIntoView({ block: 'start' }))
await new Promise((r) => setTimeout(r, 5000))
await m.screenshot({ path: '/tmp/cursor/field-mobile.png' })

await browser.close()
console.log('done')
