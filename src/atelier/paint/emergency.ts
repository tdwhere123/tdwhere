import type { PaintPreset, Rgb } from './presets'

/** A dependency-free colored ground when painting code/images cannot load.
 * This is an explicit error fallback, not a claim that the requested painting rendered.
 */
export function emergencyGround(preset: PaintPreset) {
  const color = (rgb: Rgb) => `rgb(${rgb.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255)).join(',')})`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="${color(preset.ground)}"/><g fill="${color(preset.accent)}"><path opacity=".22" d="M0 420L1200 240V670L0 790Z"/><path opacity=".3" d="M0 470L1200 400V530L0 660Z"/><path opacity=".12" d="M0 220L1200 80V290L0 440Z"/></g></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
