/**
 * Verify the homepage wheel-scroll fix: a real mouse wheel must move the page.
 * Usage: node scripts/e2e-wheel.mjs [baseUrl]
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
  args: ['--no-sandbox', '--disable-gpu', '--proxy-server=direct://'],
  defaultViewport: { width: 1280, height: 900 },
})
const page = await browser.newPage()

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
// Give the app time to boot AND for the idle-deferred Lenis init to fire.
await wait(3000)

const doc = await page.evaluate(() => ({
  scrollY: window.scrollY,
  scrollable: document.documentElement.scrollHeight > window.innerHeight,
  height: document.documentElement.scrollHeight,
  inner: window.innerHeight,
}))
console.log('before:', JSON.stringify(doc))

// Park the cursor mid-page (not over the nav) and wheel down like a user.
await page.mouse.move(640, 450)
for (let i = 0; i < 6; i++) {
  await page.mouse.wheel({ deltaY: 240 })
  await wait(120)
}
await wait(800)

const after = await page.evaluate(() => window.scrollY)
console.log('after wheel:', after)

// Also verify wheel works after navigating to another page and back.
await page.evaluate(() => {
  const link = [...document.querySelectorAll('a')].find((a) =>
    /about/i.test(a.getAttribute('href') || ''),
  )
  link?.click()
})
await wait(1500)
await page.mouse.wheel({ deltaY: 400 })
await wait(600)
const aboutScroll = await page.evaluate(() => window.scrollY)
console.log('about page scrollY after wheel:', aboutScroll)

await page.evaluate(() => history.back())
await wait(1500)
await page.mouse.move(640, 450)
for (let i = 0; i < 6; i++) {
  await page.mouse.wheel({ deltaY: 240 })
  await wait(120)
}
await wait(800)
const backHome = await page.evaluate(() => window.scrollY)
console.log('back home scrollY after wheel:', backHome)

await browser.close()

const pass = doc.scrollable && after > 100 && backHome > 100
console.log(pass ? 'PASS wheel scrolls on home' : 'FAIL wheel still blocked')
process.exit(pass ? 0 : 1)
