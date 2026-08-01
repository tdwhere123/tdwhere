/**
 * Write-Right page v2 screenshots.
 * node scripts/e2e-writeright-v2.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.argv[2] || 'http://localhost:3000'
const OUT = '/tmp/cursor/pages-v2/write-right'
fs.mkdirSync(OUT, { recursive: true })

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file })
  console.log('shot', file)
}

async function setLang(page, lang) {
  await page.evaluate((l) => {
    const group = document.querySelector('[aria-label="Language / 语言"]')
    const btns = [...(group?.querySelectorAll('button') ?? document.querySelectorAll('button'))]
    const tog = btns.find((b) => {
      const t = (b.textContent || '').trim()
      return l === 'en' ? t === 'EN' : t === '中'
    })
    tog?.click()
  }, lang)
  await wait(500)
}

async function currentLangIsEn(page) {
  return page.evaluate(() => document.documentElement.lang === 'en')
}

async function scrollToRouter(page) {
  await page.evaluate(() => {
    document.getElementById('genre-router')?.scrollIntoView({ block: 'start' })
  })
  await wait(1600)
}

async function clickTile(page, text) {
  await page.evaluate((t) => {
    const btn = [...document.querySelectorAll('#genre-router button')].find((b) =>
      (b.textContent || '').includes(t),
    )
    btn?.click()
  }, text)
  await wait(1400)
}

async function capture(browser, tag, viewport, lang) {
  const page = await browser.newPage()
  await page.setViewport(viewport)
  await page.goto(`${BASE}/write-right`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await wait(2500)
  const isEn = await currentLangIsEn(page)
  if (lang === 'en' && !isEn) await setLang(page, 'en')
  if (lang === 'zh' && isEn) await setLang(page, 'zh')
  await wait(800)

  await shot(page, `${tag}-${lang}-01-top`)
  await scrollToRouter(page)
  await shot(page, `${tag}-${lang}-02-router-default`)

  // pick a different genre → route resolution re-runs
  await clickTile(page, lang === 'en' ? 'Speech' : '讲话稿')
  await shot(page, `${tag}-${lang}-03-router-speech`)
  // pick a different setting
  await clickTile(page, lang === 'en' ? 'Downward' : '下行')
  await shot(page, `${tag}-${lang}-04-router-down`)
  // pick a different goal
  await clickTile(page, lang === 'en' ? 'Deploy' : '部署')
  await shot(page, `${tag}-${lang}-05-router-deploy`)

  // mobile: scroll the skeleton sheet itself into view (below the fold there)
  await page.evaluate(() => {
    document.querySelector('#genre-router ol')?.parentElement?.scrollIntoView({ block: 'start' })
  })
  await wait(1200)
  await shot(page, `${tag}-${lang}-05b-sheet`)

  // rest of page sections
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.55))
  await wait(1400)
  await shot(page, `${tag}-${lang}-06-mid`)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await wait(1600)
  await shot(page, `${tag}-${lang}-07-bottom`)
  await page.close()
}

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--proxy-server=direct://'],
})

await capture(browser, 'desktop', { width: 1280, height: 900 }, 'zh')
await capture(browser, 'desktop', { width: 1280, height: 900 }, 'en')
await capture(browser, 'mobile', { width: 390, height: 844, isMobile: true, hasTouch: true }, 'zh')
await capture(browser, 'mobile', { width: 390, height: 844, isMobile: true, hasTouch: true }, 'en')

await browser.close()
console.log('done')
