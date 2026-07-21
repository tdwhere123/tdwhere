/**
 * E2E: floor S-arrow is world-fixed (+Z), not camera-relative.
 * Orbit must NOT flip the mark's world direction.
 * Usage: node scripts/e2e-s-arrow.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.argv[2] || 'http://localhost:3000'
const OUT = '/opt/cursor/artifacts/e2e-s-arrow'
fs.mkdirSync(OUT, { recursive: true })

const POLAR = 0.22 // product-like near-top view

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
      `azimuth=0 tip world=(${before.wx.toFixed(2)}, ${before.wz.toFixed(2)}) ` +
        `dir=(${before.dirX.toFixed(2)}, ${before.dirZ.toFixed(2)})`,
    )

    // Must point world +Z
    if (Math.abs(before.dirX) > 0.05 || before.dirZ < 0.9) {
      fail(`expected world +Z dir, got (${before.dirX}, ${before.dirZ})`)
    } else {
      ok('floor mark points world +Z')
    }
    if (before.wz < 0.5) {
      fail(`tip should sit on +Z side of cube (wz=${before.wz.toFixed(2)})`)
    } else {
      ok(`tip on +Z side (wz=${before.wz.toFixed(2)})`)
    }

    await setOrbit(page, Math.PI / 2)
    const after = await waitForArrow(page)
    await page.screenshot({ path: path.join(OUT, '02-azimuth-90.png'), fullPage: false })
    ok(
      `azimuth=π/2 tip world=(${after.wx.toFixed(2)}, ${after.wz.toFixed(2)}) ` +
        `dir=(${after.dirX.toFixed(2)}, ${after.dirZ.toFixed(2)})`,
    )

    // Direction must NOT follow camera
    if (Math.abs(after.dirX - before.dirX) > 0.05 || Math.abs(after.dirZ - before.dirZ) > 0.05) {
      fail(
        `dir followed camera after orbit: before=(${before.dirX},${before.dirZ}) ` +
          `after=(${after.dirX},${after.dirZ})`,
      )
    } else {
      ok('dir unchanged after orbit (world-fixed)')
    }

    // World tip should stay put (cube idle) — not swing around the cube with camera
    const worldDelta = Math.hypot(after.wx - before.wx, after.wz - before.wz)
    if (worldDelta > 0.15) {
      fail(`world tip moved with orbit (Δ=${worldDelta.toFixed(2)}) — still camera-chasing?`)
    } else {
      ok(`world tip stayed put (Δ=${worldDelta.toFixed(3)})`)
    }

    // Screen position SHOULD change (projection), proving it's in the 3D scene
    const screenDelta = Math.hypot(after.sx - before.sx, after.sy - before.sy)
    if (screenDelta < 20) {
      fail(`screen tip barely moved (Δ=${screenDelta.toFixed(1)}) — looks like fixed HUD?`)
    } else {
      ok(`screen projection moved with orbit (Δ=${screenDelta.toFixed(1)}px)`)
    }

    await setOrbit(page, -Math.PI / 2)
    const after2 = await waitForArrow(page)
    await page.screenshot({ path: path.join(OUT, '03-azimuth-neg90.png'), fullPage: false })
    if (Math.abs(after2.dirZ - 1) > 0.05 || Math.abs(after2.wx - before.wx) > 0.15) {
      fail('second orbit broke world-fixed pose')
    } else {
      ok('second orbit still world-fixed +Z')
    }

    await setOrbit(page, 0, 0.92)
    await waitForArrow(page)
    await page.screenshot({ path: path.join(OUT, '04-tilted.png'), fullPage: false })
    ok('captured tilted view screenshot')

    const hasFixedSvgArrow = await page.evaluate(() => {
      const label = document.querySelector('[data-testid="roll-s-label"]')
      if (!label) return true
      return !!label.querySelector('svg')
    })
    if (hasFixedSvgArrow) fail('2D SVG arrow still present in overlay')
    else ok('overlay is caption-only; mark is on the floor plane')

    const labelText = await page.$eval(labelSel, (el) => el.textContent?.trim() || '')
    if (!/S/.test(labelText)) fail(`label missing S caption: ${labelText}`)
    else ok(`caption present: ${labelText}`)

    const realErrors = pageErrors.filter((e) => !/WebGL/i.test(e))
    if (realErrors.length) fail('page errors: ' + realErrors.slice(0, 3).join(' | '))
    else ok('no blocking page errors')

    fs.writeFileSync(
      path.join(OUT, 'summary.json'),
      JSON.stringify({ before, after, after2, worldDelta, screenDelta, labelText, pageErrors }, null, 2),
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
