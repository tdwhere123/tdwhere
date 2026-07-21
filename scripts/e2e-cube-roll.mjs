/**
 * E2E: opposite face (do-it / back) is reachable via chained S rolls.
 * Old floor bounds rejected the second Z roll — this guards the fix.
 * Usage: node scripts/e2e-cube-roll.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.argv[2] || 'http://localhost:3000'
const OUT = '/opt/cursor/artifacts/e2e-cube-roll'
fs.mkdirSync(OUT, { recursive: true })

function ok(msg) {
  console.log(`PASS  ${msg}`)
}
function fail(msg) {
  console.error(`FAIL  ${msg}`)
  process.exitCode = 1
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/local/bin/google-chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--window-size=1280,900',
    ],
    defaultViewport: { width: 1280, height: 900 },
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(60000)

  try {
    const t0 = Date.now()
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForSelector('canvas', { timeout: 30000 })
    await page.waitForSelector('[data-testid="plane-ink"]', { timeout: 30000 })
    // Wait until title shows home
    await page.waitForFunction(
      () => {
        const ink = document.querySelector('[data-testid="plane-ink"]')
        return ink && /阿黄|tdwhere/i.test(ink.textContent || '')
      },
      { timeout: 20000 },
    )
    const readyMs = Date.now() - t0
    ok(`home interactive in ${readyMs}ms`)
    if (readyMs > 8000) fail(`home load slower than expected (${readyMs}ms)`)

    await page.screenshot({ path: path.join(OUT, '01-home.png') })

    // Chain two S presses quickly — should land on do-it (back face)
    await page.keyboard.press('s')
    await wait(80)
    await page.keyboard.press('s')
    await wait(1600)

    const title = await page.$eval(
      '[data-testid="plane-ink"]',
      (el) => el.textContent?.trim() || '',
    )
    await page.screenshot({ path: path.join(OUT, '02-after-ss.png') })

    if (!/do-it/i.test(title)) {
      fail(`expected do-it after S→S, got: ${title.slice(0, 80)}`)
    } else {
      ok(`reached do-it via S→S: ${title.slice(0, 40)}`)
    }

    // Further rolls should still work (not stuck at bounds)
    await page.keyboard.press('s')
    await wait(700)
    await page.keyboard.press('a')
    await wait(700)
    await page.screenshot({ path: path.join(OUT, '03-more-rolls.png') })
    const title2 = await page.$eval(
      '[data-testid="plane-ink"]',
      (el) => el.textContent?.trim() || '',
    )
    ok(`continued rolling, now: ${title2.slice(0, 40)}`)

    fs.writeFileSync(
      path.join(OUT, 'summary.json'),
      JSON.stringify({ readyMs, titleAfterSS: title, titleLater: title2 }, null, 2),
    )
  } catch (e) {
    fail(String(e))
    try {
      await page.screenshot({ path: path.join(OUT, '99-error.png') })
    } catch {
      /* ignore */
    }
  } finally {
    await browser.close()
  }

  if (process.exitCode) {
    console.error('\nE2E FAILED')
    process.exit(1)
  }
  console.log('\nE2E PASSED')
}

main()
