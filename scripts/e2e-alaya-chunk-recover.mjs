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

await page.setRequestInterception(true)
let failAlaya = true
page.on('request', (req) => {
  const url = req.url()
  if (failAlaya && /assets\/Alaya-.*\.js/.test(url)) {
    // first failure represents the stale chunk; after it, the "new deploy"
    // (triggered by the app's auto-reload) serves the chunk normally
    failAlaya = false
    req.abort()
  } else {
    req.continue()
  }
})

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 })
await new Promise((r) => setTimeout(r, 1200))

// stale-tab scenario: Alaya chunk 404s on nav → app should auto-reload once
await page.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find((x) => /alaya/i.test(x.getAttribute('href') || '') || /Alaya/i.test(x.textContent || ''))
  if (a) a.click()
})

// wait for the app-triggered reload, then the fresh chunk load
await new Promise((r) => setTimeout(r, 5000))

const state = await page.evaluate(() => ({
  url: location.pathname,
  hasErrorUI: /出了点问题|went wrong/.test(document.body.innerText),
  chars: document.querySelectorAll('[data-char]').length,
  charVis: document.querySelector('[data-char]') ? getComputedStyle(document.querySelector('[data-char]')).opacity : 'none',
  h1: document.querySelector('h1')?.textContent?.slice(0, 40) ?? null,
}))
console.log('final:', JSON.stringify(state, null, 2))
await page.screenshot({ path: '/tmp/cursor/alaya-chunk-recovered.png' })
await browser.close()
