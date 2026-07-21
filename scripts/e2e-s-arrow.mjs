/**
 * E2E: S-roll 3D arrow is face-mounted and follows cube when orbiting.
 * Uses window.__tdwhereSetOrbit + __tdwhereRollArrow (no mouse drag).
 * Usage: node scripts/e2e-s-arrow.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.argv[2] || 'http://localhost:3000'
const OUT = '/opt/cursor/artifacts/e2e-s-arrow'
fs.mkdirSync(OUT, { recursive: true })

/** Slightly tilted polar so the face arrow is readable in screenshots. */
const POLAR = 0.92

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

async function readArrow(page) {
  return page.evaluate(() => {
    const a = window.__tdwhereRollArrow
    if (!a) return null
    return { ...a }
  })
}

async function waitForArrow(page, timeoutMs = 20000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const a = await readArrow(page)
    if (a && Number.isFinite(a.wx)) return a
    await wait(100)
  }
  throw new Error('__tdwhereRollArrow never appeared')
}

async function setOrbit(page, azimuth, polar = POLAR) {
  await page.evaluate(
    ({ azimuth, polar }) => {
      window.__tdwhereSetOrbit(azimuth, polar)
    },
    { azimuth, polar },
  )
  await wait(700)
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

  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(String(e)))

  try {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForSelector('canvas', { timeout: 30000 })
    await wait(2500)

    const labelSel = '[data-testid="roll-s-label"]'
    await page.waitForSelector(labelSel, { timeout: 15000 })

    await page.waitForFunction(
      () => typeof window.__tdwhereSetOrbit === 'function' && !!window.__tdwhereRollArrow,
      { timeout: 20000 },
    )

    await setOrbit(page, 0)
    const before = await waitForArrow(page)
    await page.screenshot({ path: path.join(OUT, '01-azimuth-0.png'), fullPage: false })
    ok(
      `azimuth=0 arrow world=(${before.wx.toFixed(2)}, ${before.wy.toFixed(2)}, ${before.wz.toFixed(2)}) ` +
        `faceN=(${before.faceNx.toFixed(2)}, ${before.faceNz.toFixed(2)})`,
    )

    await setOrbit(page, Math.PI / 2)
    const after = await waitForArrow(page)
    await page.screenshot({ path: path.join(OUT, '02-azimuth-90.png'), fullPage: false })
    ok(
      `azimuth=π/2 arrow world=(${after.wx.toFixed(2)}, ${after.wy.toFixed(2)}, ${after.wz.toFixed(2)}) ` +
        `faceN=(${after.faceNx.toFixed(2)}, ${after.faceNz.toFixed(2)})`,
    )

    const worldDelta = Math.hypot(after.wx - before.wx, after.wz - before.wz)
    const faceDot = before.faceNx * after.faceNx + before.faceNz * after.faceNz

    if (worldDelta < 0.75) {
      fail(`world tip barely moved on XZ (Δ=${worldDelta.toFixed(2)}) — still fixed in world?`)
    } else {
      ok(`world tip moved on XZ (Δ=${worldDelta.toFixed(2)})`)
    }

    if (faceDot > 0.35) {
      fail(`face normal barely rotated (dot=${faceDot.toFixed(3)})`)
    } else {
      ok(`face normal rotated with camera (dot=${faceDot.toFixed(3)})`)
    }

    const beforeAxis = Math.abs(before.faceNx) > Math.abs(before.faceNz) ? 'x' : 'z'
    const afterAxis = Math.abs(after.faceNx) > Math.abs(after.faceNz) ? 'x' : 'z'
    if (beforeAxis === afterAxis) {
      fail(`still on same axis face (${beforeAxis}) after 90° orbit`)
    } else {
      ok(`switched cube face axis ${beforeAxis} → ${afterAxis}`)
    }

    await setOrbit(page, -Math.PI / 2)
    const after2 = await waitForArrow(page)
    await page.screenshot({ path: path.join(OUT, '03-azimuth-neg90.png'), fullPage: false })
    const worldDelta2 = Math.hypot(after2.wx - after.wx, after2.wz - after.wz)
    const faceDot2 = after.faceNx * after2.faceNx + after.faceNz * after2.faceNz
    if (worldDelta2 < 0.75 || faceDot2 > 0.35) {
      fail(
        `second orbit weak: worldΔ=${worldDelta2.toFixed(2)} faceDot=${faceDot2.toFixed(3)}`,
      )
    } else {
      ok(`second orbit moved worldΔ=${worldDelta2.toFixed(2)} faceDot=${faceDot2.toFixed(3)}`)
    }

    if (after.wx * after2.wx >= 0) {
      fail(`±90° tips not on opposite X faces (wx ${after.wx.toFixed(2)} vs ${after2.wx.toFixed(2)})`)
    } else {
      ok(`±90° tips on opposite sides (wx ${after.wx.toFixed(2)} vs ${after2.wx.toFixed(2)})`)
    }

    // Default-ish top view too (matches product camera feel)
    await setOrbit(page, 0, 0.22)
    await waitForArrow(page)
    await page.screenshot({ path: path.join(OUT, '04-topish-default.png'), fullPage: false })
    ok('captured top-ish default polar screenshot')

    const hasFixedSvgArrow = await page.evaluate(() => {
      const label = document.querySelector('[data-testid="roll-s-label"]')
      if (!label) return true
      return !!label.querySelector('svg')
    })
    if (hasFixedSvgArrow) fail('2D SVG arrow still present in overlay')
    else ok('overlay is caption-only; arrow is 3D in canvas')

    const labelText = await page.$eval(labelSel, (el) => el.textContent?.trim() || '')
    if (!/S/.test(labelText)) fail(`label missing S caption: ${labelText}`)
    else ok(`caption present: ${labelText}`)

    const realErrors = pageErrors.filter((e) => !/WebGL/i.test(e))
    if (realErrors.length) fail('page errors: ' + realErrors.slice(0, 3).join(' | '))
    else ok('no blocking page errors')

    fs.writeFileSync(
      path.join(OUT, 'summary.json'),
      JSON.stringify(
        {
          before,
          after,
          after2,
          worldDelta,
          faceDot,
          worldDelta2,
          labelText,
          pageErrors,
        },
        null,
        2,
      ),
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
