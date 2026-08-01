/**
 * Reduced-motion check: ribbon + skeleton must render static final state.
 * Usage: node scripts/e2e-writeright-reduced.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core'

const BASE = process.argv[2] || 'http://localhost:3000'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
  defaultViewport: { width: 1280, height: 900 },
})
const page = await browser.newPage()
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await page.goto(`${BASE}/write-right`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await wait(1500)
await page.evaluate(() => document.getElementById('genre-router')?.scrollIntoView())
await wait(600)
const state = await page.evaluate(() => {
  const ribbon = document.querySelector('#genre-router [aria-label*="×"]')
  const chips = ribbon ? ribbon.querySelectorAll('span').length : 0
  const items = document.querySelectorAll('#genre-router ol li').length
  const focus = !!document.querySelector('#genre-router ol li .bg-cobalt')
  return { chips, items, focus }
})
console.log('reduced-motion static state:', JSON.stringify(state))
await page.screenshot({ path: '/tmp/cursor/pages-v2/write-right/reduced-motion.png' })
await browser.close()
