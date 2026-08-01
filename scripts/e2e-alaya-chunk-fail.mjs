import puppeteer from 'puppeteer-core'

const BASE = 'http://localhost:4517/tdwhere/'
const CHROME = '/home/tdwhere/bin/google-chrome'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  headless: true,
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 120)))
page.on('response', (r) => { if (r.status() >= 400) console.log(`[http ${r.status()}]`, r.url()) })

// Simulate a stale tab: the Alaya chunk has been replaced by a new deploy → 404
await page.setRequestInterception(true)
let failAlaya = true
page.on('request', (req) => {
  const url = req.url()
  if (failAlaya && /assets\/Alaya-.*\.js/.test(url)) {
    req.abort()
  } else {
    req.continue()
  }
})

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 })
await new Promise((r) => setTimeout(r, 1200))

await page.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find((x) => /alaya/i.test(x.getAttribute('href') || '') || /Alaya/i.test(x.textContent || ''))
  if (a) a.click()
})
await new Promise((r) => setTimeout(r, 2000))

const state = await page.evaluate(() => ({
  url: location.pathname,
  bodyText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 200),
}))
console.log('after blocked-chunk nav:', JSON.stringify(state, null, 2))

await page.screenshot({ path: '/tmp/cursor/alaya-chunk-fail.png' })
await browser.close()
