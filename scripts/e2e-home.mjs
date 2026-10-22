/** Home painting/route lifecycle acceptance on a real GPU browser.
 * npm run build && npm run preview
 * CHROME_DEBUG_URL=http://127.0.0.1:9339 node scripts/e2e-home.mjs [baseURL]
 * Or set CHROME_PATH. Screenshots and timings go to /tmp/tdwhere-home-acceptance.
 */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import puppeteer from 'puppeteer-core'

const base = process.argv[2] || 'http://localhost:4173/tdwhere/'
const output = process.env.HOME_ARTIFACTS || '/tmp/tdwhere-home-acceptance'
const remote = process.env.CHROME_DEBUG_URL
const browser = remote ? await puppeteer.connect({ browserURL: remote })
  : await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true })
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const results = []
const section = process.env.HOME_SECTION || 'all'
assert(['all', 'island', 'routes', 'fallbacks', 'recovery', 'fonts'].includes(section))
const includes = (name) => section === 'all' || section === name
await mkdir(output, { recursive: true })

async function pageFor({ seen = false, quiet = false, noGL = false, hour = 13, mobile = false } = {}) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  await page.setViewport(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 })
  await page.setCacheEnabled(false)
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: quiet ? 'reduce' : 'no-preference' }])
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', e => { if (e.type() === 'error' && /shader|VALIDATE_STATUS|INVALID_OPERATION/i.test(e.text())) errors.push(e.text()) })
  await page.evaluateOnNewDocument(({ seen, noGL, hour }) => {
    const realNow = Date.now.bind(Date), start = realNow(), epoch = new Date(2026, 9, 22, hour).getTime()
    Date.now = () => epoch + realNow() - start
    sessionStorage.clear()
    if (seen) sessionStorage.setItem('tdwhere:overture', '1')
    window.__longTasks = []
    new PerformanceObserver(list => window.__longTasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: true })
    if (noGL) {
      const get = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return /webgl/i.test(type) ? null : get.call(this, type, ...args)
      }
    }
  }, { seen, noGL, hour })
  return { context, page, errors }
}
async function record(page, name) {
  const stats = await page.evaluate(() => ({
    paints: performance.getEntriesByType('paint').map(e => ({ name: e.name, at: Math.round(e.startTime) })),
    longTasks: window.__longTasks,
    resources: performance.getEntriesByType('resource').map(e => ({ name: new URL(e.name).pathname, size: e.encodedBodySize })),
  }))
  results.push({ name, ...stats })
  console.log(`PASS ${name}`, JSON.stringify({ paints: stats.paints, longTasks: stats.longTasks }))
}
async function stillReady(page) {
  await page.waitForFunction(() => {
    const img = document.querySelector('.a-frame img.a-still')
    return img?.complete && img.naturalWidth > 0
  })
}
async function liveReady(page) {
  await page.waitForSelector('.a-frame canvas[data-stage="live"]', { timeout: 30000 })
  await page.waitForSelector('.a-doors a[href$="/projects"]')
}

try {
  // Full interactive island: no hidden home painting work, real shader compilation,
  // preserved machine controls, transition then an actually drawn home frame.
  for (const [name, options] of (includes('island') ? [['day', {}], ['night-mobile', { hour: 23, mobile: true }]] : [])) {
    const { context, page, errors } = await pageFor(options)
    try {
      await page.goto(base, { waitUntil: 'domcontentloaded' })
      await stillReady(page)
      await page.waitForSelector('.a-pond-keyboard button:not(:disabled)', { timeout: 45000 })
      assert.equal(await page.$('.a-frame canvas[data-stage="live"]'), null, 'covered home must not initialize')
      const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(r => r.name))
      assert(!resources.some(r => /\/(painter|engine)-[^/]+\.js/.test(r)), 'no live painter/engine behind island')
      await page.screenshot({ path: `${output}/${name}-island.png` })
      const machine = '.a-pond-keyboard button[aria-pressed]'
      await page.$eval(machine, b => b.click())
      await page.waitForFunction(s => document.querySelector(s)?.getAttribute('aria-pressed') === 'false', {}, machine)
      await page.$eval(machine, b => b.click())
      await page.waitForFunction(s => document.querySelector(s)?.getAttribute('aria-pressed') === 'true', {}, machine)
      await page.click('.a-overture-foot button')
      await pause(1000)
      await page.screenshot({ path: `${output}/${name}-enter.png` })
      await page.waitForFunction(() => !document.querySelector('.a-overture'), { timeout: 15000 })
      await liveReady(page)
      await page.screenshot({ path: `${output}/${name}-home.png` })
      assert.equal(await page.$eval('html', el => el.scrollWidth > innerWidth), false, 'no horizontal overflow')
      if (name === 'day') {
        await page.click('.a-weather')
        await page.waitForSelector('.a-pond-keyboard button:not(:disabled)')
        await page.keyboard.press('Escape')
        await page.waitForFunction(() => !document.querySelector('.a-overture'))
        await liveReady(page)
        assert.equal(await page.$eval('html', el => el.style.overflow === 'hidden'), false)
        assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('a-weather')), true)
      }
      assert.deepEqual(errors, [])
      await record(page, `${name}: island, controls, enter, live painting${name === 'day' ? ', replay/Escape/focus restoration' : ''}`)
    } finally { await context.close() }
  }

  // React may retain the old home under a pending transition; either way the knife waits.
  if (includes('routes')) {
    const { context, page, errors } = await pageFor({ seen: true })
    const held = []
    let delay = true
    try {
      await page.setRequestInterception(true)
      page.on('request', request => {
        if (delay && /\/Projects-[^/]+\.js/.test(request.url())) held.push(request)
        else void request.continue()
      })
      await page.goto(base, { waitUntil: 'domcontentloaded' })
      await liveReady(page)
      await page.$eval('.a-doors a[href$="/projects"]', a => a.click())
      await page.waitForFunction(() => location.pathname.endsWith('/projects'))
      await pause(1800)
      assert(held.length, 'lazy route request was held')
      assert.equal(await page.$('.a-frame[data-parting]'), null, 'knife waits for real route content')
      assert(await page.$('.a-frame'), 'keep the painting while the route is pending')
      assert(await page.$('.a-home') || await page.$('.a-route-wait[role="status"]'), 'retained UI or loading feedback')
      delay = false
      await Promise.all(held.splice(0).map(r => r.continue()))
      await page.waitForSelector('.a-frame[data-parting]')
      await page.waitForFunction(() => !document.querySelector('.a-frame'))
      assert.equal(await page.$$eval('.a-index-art .a-art', a => a.length), 0)
      await page.goBack()
      await liveReady(page)
      await page.$eval('.a-doors a[href$="/projects"]', a => a.click())
      await page.waitForSelector('.a-frame[data-parting]')
      await page.goBack()
      await liveReady(page)
      await pause(1800)
      assert(await page.$('.a-frame:not([data-covering]):not([data-parting])'), 'back cancels departure')
      assert.deepEqual(errors, [])
      await record(page, 'delayed route arrival and rapid back cancellation')
    } finally { await context.close() }
  }

  // A late graphics import must not cover a departure with a newly opaque canvas.
  if (includes('routes')) {
    const { context, page, errors } = await pageFor({ seen: true })
    const held = []
    let delay = true
    try {
      await page.setRequestInterception(true)
      page.on('request', request => {
        if (delay && /\/engine-[^/]+\.js/.test(request.url())) held.push(request)
        else void request.continue()
      })
      await page.goto(base, { waitUntil: 'domcontentloaded' })
      await stillReady(page)
      await page.waitForSelector('.a-doors a')
      await page.waitForFunction(() => document.querySelector('.a-frame canvas')?.dataset.stage === 'pending')
      await pause(200)
      assert(held.length, 'engine import was held')
      await page.$eval('.a-doors a[href$="/projects"]', a => a.click())
      await page.waitForSelector('.a-frame[data-parting]')
      delay = false
      await Promise.all(held.splice(0).map(r => r.continue()))
      await pause(200)
      assert.equal(await page.$('.a-frame canvas[data-stage="live"]'), null)
      await page.waitForFunction(() => !document.querySelector('.a-frame'))
      assert.deepEqual(errors, [])
      await record(page, 'early departure before graphics import: no late opaque canvas')
    } finally { await context.close() }
  }

  for (const [name, options] of (includes('fallbacks') ? [['reduced', { quiet: true }], ['no-webgl', { noGL: true }], ['reduced-mobile', { quiet: true, mobile: true }]] : [])) {
    const { context, page, errors } = await pageFor(options)
    try {
      await page.goto(base, { waitUntil: 'domcontentloaded' })
      await stillReady(page)
      await page.waitForFunction(() => !document.querySelector('.a-overture'))
      await page.waitForFunction(() => document.querySelector('.a-frame canvas')?.dataset.stage === 'still')
      const src = await page.$eval('.a-frame img', img => img.src)
      assert.match(src, /home-painted.*\.webp/)
      assert.deepEqual(errors, [])
      await page.screenshot({ path: `${output}/${name}.png` })
      await record(page, `${name}: authored static fallback`)
    } finally { await context.close() }
  }

  if (includes('recovery')) {
    // Non-eager stills keep a mounted observation target at orientation/motion changes.
    for (const route of ['film', 'projects']) {
      const { context, page, errors } = await pageFor({ quiet: true })
      try {
        await page.goto(new URL(route, base).href, { waitUntil: 'domcontentloaded' })
        const surface = route === 'film' ? '.a-film-backdrop' : '.a-index-art'
        if (route === 'projects') {
          await page.waitForSelector('.a-index-list a')
          await page.hover('.a-index-list a')
        }
        await page.waitForSelector(`${surface} canvas[data-stage="still"]`)
        await page.setViewport({ width: 600, height: 900 })
        await page.waitForFunction(s => {
          const img = document.querySelector(`${s} img.a-still`)
          return img?.complete && img.naturalWidth > 0 && getComputedStyle(img).opacity !== '0'
        }, {}, surface)
        await pause(1000)
        assert(await page.$(`${surface} canvas[data-stage="still"]`))
        if (route === 'projects') {
          await page.setViewport({ width: 1280, height: 900 })
          await page.waitForSelector(`${surface} canvas[data-stage="still"]`)
        }
        assert.deepEqual(errors, [])
        await record(page, `${route}: non-eager still survives responsive changes`)
      } finally { await context.close() }
    }
    {
      const { context, page, errors } = await pageFor({ seen: true })
      try {
        await page.goto(base, { waitUntil: 'domcontentloaded' })
        await liveReady(page)
        await page.$eval('.a-frame canvas', canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext())
        await page.waitForSelector('.a-frame canvas[data-stage="still"]')
        await stillReady(page)
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
        await page.waitForSelector('.a-weather:disabled')
        await page.waitForSelector('.a-frame canvas[data-stage="still"]')
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
        await page.waitForSelector('.a-weather:not(:disabled)')
        await liveReady(page)
        assert.deepEqual(errors, [])
        await record(page, 'context loss and changing motion preference retain artwork')
      } finally { await context.close() }
    }
    {
      const { context, page, errors } = await pageFor({ quiet: true })
      const reported = []
      try {
        page.on('console', e => { if (e.text().includes('Painting unavailable:')) reported.push(e.text()) })
        await page.setRequestInterception(true)
        page.on('request', request => {
          if (/\/painter-[^/]+\.js/.test(request.url())) void request.abort()
          else void request.continue()
        })
        await page.goto(new URL('blog', base).href, { waitUntil: 'domcontentloaded' })
        await page.waitForSelector('canvas.a-art[data-stage="failed"]')
        await page.waitForFunction(() => [...document.querySelectorAll('img.a-still')].some(img => img.complete && img.naturalWidth > 0 && img.src.startsWith('data:image/svg+xml,')))
        assert(reported.length, 'initialization failure is reported, not labeled successful')
        assert.deepEqual(errors, [])
        await record(page, 'painter import failure: reported, dependency-free error artwork')
      } finally { await context.close() }
    }
  }

  // Fonts deliberately remain in flight: the still and text must appear regardless.
  if (includes('fonts')) {
    const { context, page, errors } = await pageFor({ seen: true, quiet: true })
    try {
      await page.setRequestInterception(true)
      page.on('request', request => {
        if (!/fonts\.googleapis\.com|cdn\.jsdelivr\.net/.test(request.url())) void request.continue()
      })
      await page.goto(base, { waitUntil: 'domcontentloaded' })
      await stillReady(page)
      await page.waitForSelector('.a-signature')
      assert.deepEqual(errors, [])
      await record(page, 'font CSS stalled: still and content painted')
    } finally { await context.close() }
  }
} finally {
  await writeFile(`${output}/${section}-results.json`, JSON.stringify(results, null, 2))
  if (remote) await browser.disconnect()
  else await browser.close()
}
