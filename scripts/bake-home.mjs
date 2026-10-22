/** Regenerate the authored home painting using the actual browser painter.
 * Start npm run dev, then:
 * node scripts/bake-home.mjs [Vite URL] [Chrome debugging URL]
 * Or set CHROME_PATH to launch a local Chrome. No browser is needed for builds.
 */
import puppeteer from 'puppeteer-core'
import { writeFile } from 'node:fs/promises'
const base = process.argv[2] || 'http://localhost:3000/'
const remote = process.argv[3]
const browser = remote
  ? await puppeteer.connect({ browserURL: remote })
  : await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true })
const context = await browser.createBrowserContext()
try {
  const page = await context.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  const result = await page.evaluate(async (base) => {
    const root = new URL(base).pathname
    const painter = await import(`${root}src/atelier/paint/painter.ts`)
    const { heroFrame } = await import(`${root}src/atelier/grounds.ts`)
    await painter.loadFrame(heroFrame)
    const canvas = painter.paintHome(heroFrame)
    return { url: canvas.toDataURL('image/webp', .9), width: canvas.width, height: canvas.height }
  }, base)
  await writeFile(new URL('../src/assets/ground/home-painted.webp', import.meta.url), Buffer.from(result.url.split(',')[1], 'base64'))
  console.log(`Baked home painting ${result.width}×${result.height}`)
} finally {
  await context.close()
  if (remote) await browser.disconnect()
  else await browser.close()
}
