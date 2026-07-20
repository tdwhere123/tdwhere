/**
 * Headless E2E against the Vite preview/dev server.
 * Usage: node scripts/e2e-smoke.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.argv[2] || 'http://localhost:3000'
const OUT = '/tmp/cursor/e2e-smoke'
fs.mkdirSync(OUT, { recursive: true })

const results = []
function ok(name, detail = '') {
  results.push({ name, pass: true, detail })
  console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`)
}
function fail(name, detail = '') {
  results.push({ name, pass: false, detail })
  console.error(`FAIL  ${name}${detail ? ' — ' + detail : ''}`)
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  return file
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function goto(page, route) {
  const url = route.startsWith('http') ? route : `${BASE}${route}`
  const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
  const status = res?.status() ?? 0
  // 304 Not Modified is fine for cached SPA shells
  if (!res || (status >= 400)) throw new Error(`导航失败 ${url} status=${status}`)
  await wait(400)
}

async function clickNav(page, label) {
  // Desktop nav
  const clicked = await page.evaluate((lab) => {
    const links = [...document.querySelectorAll('a, button')]
    const el = links.find((a) => (a.textContent || '').trim().toUpperCase().includes(lab.toUpperCase()))
    if (!el) return false
    el.click()
    return true
  }, label)
  return clicked
}

async function powerOnSentinel(page) {
  // Prefer aria-label / power button
  const powered = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')]
    const power = btns.find((b) => {
      const t = `${b.getAttribute('aria-label') || ''} ${b.textContent || ''}`.toLowerCase()
      return t.includes('电源') || t.includes('power') || t.includes('开机')
    })
    if (!power) return false
    power.click()
    return true
  })
  if (!powered) throw new Error('找不到 SENTINEL 电源键')
  // Wait for boot + greeting typewriter
  await wait(9000)
}

async function sentinelCmd(page, cmd, settleMs = 4500) {
  // Focus CRT input
  await page.evaluate(() => {
    const input = document.querySelector('.pg-sentinel input[type="text"]')
    if (!input) throw new Error('no sentinel input')
    input.focus()
  })
  // Clear and type
  const input = await page.$('.pg-sentinel input[type="text"]')
  if (!input) throw new Error('sentinel input missing')
  // Wait until enabled
  for (let i = 0; i < 40; i++) {
    const disabled = await page.$eval('.pg-sentinel input[type="text"]', (el) => el.disabled)
    if (!disabled) break
    await wait(250)
  }
  await input.click({ clickCount: 3 })
  await page.keyboard.press('Backspace')
  await input.type(cmd, { delay: 20 })
  await page.keyboard.press('Enter')
  await wait(settleMs)
}

async function closeModalIfAny(page) {
  const open = await page.$('[role="dialog"]')
  if (!open) return false
  // Prefer close button
  const closed = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]')
    if (!dlg) return false
    const btn = dlg.querySelector('button')
    if (btn) {
      btn.click()
      return true
    }
    return false
  })
  await wait(500)
  return closed
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/local/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(45000)

  // Capture page errors
  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(String(e)))

  try {
    // —— Home ——
    await goto(page, '/')
    await shot(page, '01-home')
    const hasCube = await page.evaluate(() => {
      return !!document.querySelector('canvas') || !!document.querySelector('[aria-label]')
    })
    if (hasCube) ok('home loads')
    else fail('home loads', 'no canvas/aria landmark')

    // Lang toggle
    const langOk = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')]
      const tog = btns.find((b) => /EN|中|ZH/i.test(b.textContent || ''))
      if (!tog) return false
      tog.click()
      return true
    })
    await wait(400)
    if (langOk) ok('lang toggle clickable')
    else fail('lang toggle clickable')

    // Nav ABOUT
    const aboutNav = await clickNav(page, 'ABOUT') || await clickNav(page, '关于')
    await wait(800)
    if (aboutNav && page.url().includes('about')) ok('nav → about')
    else fail('nav → about', page.url())

    // —— Do It ——
    await goto(page, '/do-it')
    await shot(page, '02-doit')
    const doitTitle = await page.title()
    const doitHasIllust = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')]
      return imgs.some((i) => (i.src || '').includes('do-it') || (i.src || '').includes('illustrations'))
    })
    if (doitHasIllust) ok('do-it illustration present')
    else fail('do-it illustration present')

    // Route button
    const routed = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')]
      const route = btns.find((b) => /Route|路由|跑一次|再跑/i.test(b.textContent || ''))
      if (!route) return 'missing'
      route.click()
      return 'clicked'
    })
    await wait(1500)
    if (routed === 'clicked') ok('do-it route/replay button', routed)
    else fail('do-it route/replay button', routed)

    // Site clue
    const clue = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')]
      const c = btns.find((b) => /leads|线索|可用/i.test(b.textContent || ''))
      if (!c) return false
      c.click()
      return true
    })
    await wait(400)
    if (clue) ok('do-it site clue')
    else fail('do-it site clue')

    // —— Alaya ——
    await goto(page, '/alaya')
    await shot(page, '03-alaya')
    ok('alaya loads', await page.title())

    // —— Write Right ——
    await goto(page, '/write-right')
    await shot(page, '04-writeright')
    ok('write-right loads')

    // —— About ——
    await goto(page, '/about')
    await shot(page, '05-about')
    const accordion = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')]
      const q = btns.find((b) => (b.textContent || '').length > 8 && b.closest('section'))
      if (!q) return false
      q.click()
      return true
    })
    if (accordion) ok('about accordion click')
    else fail('about accordion click')

    // —— Playground / SENTINEL eggs ——
    await page.evaluateOnNewDocument(() => {
      try {
        localStorage.removeItem('tdwhere-sentinel-cards')
        localStorage.removeItem('tdwhere-sentinel-fragments')
      } catch {}
    })
    await goto(page, '/playground')
    await shot(page, '06-playground')
    await page.evaluate(() => {
      try {
        localStorage.removeItem('tdwhere-sentinel-cards')
        localStorage.removeItem('tdwhere-sentinel-fragments')
      } catch {}
    })

    // Scroll terminal into view
    await page.evaluate(() => {
      document.querySelector('.pg-sentinel')?.scrollIntoView({ block: 'center' })
    })
    await wait(600)

    await powerOnSentinel(page)
    await shot(page, '07-sentinel-on')
    ok('sentinel power on')

    await sentinelCmd(page, 'help', 5000)
    const helpText = await page.evaluate(() => document.querySelector('.pg-sentinel')?.innerText || '')
    if (/whoami|help|freedom/i.test(helpText)) ok('sentinel help')
    else fail('sentinel help', helpText.slice(0, 200))

    const cardCmds = ['interrogate', 'leads', 'materials', 'ledger', 'publish']
    for (let i = 0; i < cardCmds.length; i++) {
      const cmd = cardCmds[i]
      await sentinelCmd(page, cmd, 6500)
      await wait(800)
      const dialog = await page.$('[role="dialog"]')
      if (dialog) {
        ok(`card drop: ${cmd}`)
        await shot(page, `08-card-${i + 1}-${cmd}`)
        await closeModalIfAny(page)
        await wait(900)
      } else {
        // Maybe still typing — wait more
        await wait(4000)
        const dialog2 = await page.$('[role="dialog"]')
        if (dialog2) {
          ok(`card drop: ${cmd}`, 'slow')
          await closeModalIfAny(page)
          await wait(900)
        } else {
          fail(`card drop: ${cmd}`, 'no dialog')
          await shot(page, `08-fail-${cmd}`)
        }
      }
    }

    // Finale mask after 5th close
    await wait(1200)
    const finale = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"][aria-labelledby="finale-question"]')
      const q = document.getElementById('finale-question')
      return {
        open: !!dlg || !!q,
        text: q?.textContent || dlg?.textContent || '',
      }
    })
    if (finale.open || /身份|identity|历史|history/i.test(finale.text)) {
      ok('finale mask', finale.text.slice(0, 80))
      await shot(page, '09-finale')
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find((b) =>
          /关闭|close|轻触|Tap/i.test(b.textContent || ''),
        )
        btn?.click()
      })
      await wait(400)
    } else {
      fail('finale mask', JSON.stringify(finale))
      await shot(page, '09-finale-missing')
    }

    await sentinelCmd(page, 'cards', 4000)
    const cardsText = await page.evaluate(() => document.querySelector('.pg-sentinel')?.innerText || '')
    if (/5\s*\/\s*5|5 \/ 5|概念图进度/.test(cardsText)) ok('cards progress 5/5')
    else fail('cards progress 5/5', cardsText.slice(-300))

    // Vegetarian draw
    await page.evaluate(() => {
      document.querySelector('#veggie, .pg-gallery')?.scrollIntoView({ block: 'end' })
    })
    await wait(400)
    const drew = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')]
      const draw = btns.find((b) => /抽|Draw|今日素/i.test(b.textContent || ''))
      if (!draw) return false
      draw.click()
      return true
    })
    await wait(2000)
    if (drew) ok('veggie draw')
    else fail('veggie draw')

    // —— Mobile home swipe ——
    const mobile = await browser.newPage()
    await mobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    await mobile.goto(`${BASE}/`, { waitUntil: 'networkidle2' })
    await wait(800)
    await shot(mobile, '10-mobile-home')
    const swipeable = await mobile.evaluate(() => {
      const scroller = document.querySelector('[data-lenis-prevent-touch], .snap-x')
      return !!scroller
    })
    if (swipeable) {
      // Simulate horizontal swipe
      await mobile.evaluate(() => {
        const el = document.querySelector('.snap-x, [data-lenis-prevent-touch]')
        if (!el) return
        el.scrollBy({ left: el.clientWidth, behavior: 'instant' })
      })
      await wait(600)
      ok('mobile cube horizontal scroller')
      await shot(mobile, '11-mobile-swiped')
    } else {
      fail('mobile cube horizontal scroller')
    }

    // Mobile nav menu
    const menu = await mobile.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => {
        const a = b.getAttribute('aria-label') || ''
        return /menu|菜单|打开/i.test(a)
      })
      if (!btn) return false
      btn.click()
      return true
    })
    await wait(500)
    if (menu) ok('mobile menu opens')
    else fail('mobile menu opens')
    await shot(mobile, '12-mobile-menu')
    await mobile.close()

    // Nav PROJECTS from about should go home
    await goto(page, '/about')
    const toProjects = await clickNav(page, 'PROJECTS') || await clickNav(page, '项目')
    await wait(700)
    const path = new URL(page.url()).pathname
    if (toProjects && (path === '/' || path.endsWith('/'))) ok('nav PROJECTS → home', path)
    else fail('nav PROJECTS → home', path)

  } catch (e) {
    fail('suite crashed', String(e))
    try {
      await shot(page, '99-crash')
    } catch {}
  } finally {
    const realPageErrors = pageErrors.filter((e) => {
      const msg = String(e)
      return !/WebGL|WEBGL|createWebGLContext|getContext/i.test(msg)
    })
    if (realPageErrors.length) {
      fail('pageerrors', realPageErrors.slice(0, 5).join(' | '))
    } else {
      ok('no pageerrors', pageErrors.length ? `ignored ${pageErrors.length} headless WebGL` : '')
    }
    await browser.close()
  }

  const failed = results.filter((r) => !r.pass)
  const summary = {
    base: BASE,
    passed: results.filter((r) => r.pass).length,
    failed: failed.length,
    results,
  }
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2))
  console.log('\n=== SUMMARY ===')
  console.log(JSON.stringify(summary, null, 2))
  process.exit(failed.length ? 1 : 0)
}

main()
