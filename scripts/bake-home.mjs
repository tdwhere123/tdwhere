/** Regenerate the authored home painting using the actual browser painter.
 * Start npm run dev, then:
 * node scripts/bake-home.mjs [Vite URL] [Chrome debugging URL]
 * Or set CHROME_PATH to launch a local Chrome. No browser is needed for builds.
 * Writes the painting at 2560 and 1600 px (one bake, so both are the same strokes)
 * and its grey height layer at 1280 px, which the live engine lights.
 */
import puppeteer from 'puppeteer-core'
import sharp from 'sharp'
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
    const { color, relief } = painter.paintHome(heroFrame)
    return { color: color.toDataURL('image/png'), relief: relief.toDataURL('image/png'), width: color.width, height: color.height }
  }, base)
  const png = (url) => Buffer.from(url.split(',')[1], 'base64')
  const out = (name) => new URL(`../src/assets/ground/${name}`, import.meta.url).pathname
  const color = png(result.color)
  await sharp(color).webp({ quality: 84, effort: 6 }).toFile(out('home-painted-2560.webp'))
  await sharp(color).resize(1600).webp({ quality: 86, effort: 6 }).toFile(out('home-painted.webp'))
  await sharp(png(result.relief)).resize(1280).grayscale().webp({ quality: 80, effort: 6 }).toFile(out('home-relief.webp'))
  console.log(`Baked home painting ${result.width}×${result.height}`)
} finally {
  await context.close()
  if (remote) await browser.disconnect()
  else await browser.close()
}
