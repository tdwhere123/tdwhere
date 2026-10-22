import { describe, expect, it } from 'vitest'
import { clockFrom, DAY_MS } from '../weather'
import { islandSky } from './island/state'
import { paintingLight } from './light'

describe('one sky on water and pigment', () => {
  const clock = clockFrom(new Date(2026, 9, 22, 12).getTime())
  it('uses the island light and keeps night colored rather than black', () => {
    const sky = islandSky(clock, clock.start)
    const paint = paintingLight(sky)
    expect(paint.tint).toEqual(sky.light.light)
    expect(paint.shade).toEqual(sky.light.water)
    expect(paint.sun).toBe(sky.light.sun)
    expect(paint.tint).not.toBe(sky.light.light)
    for (let t = 0; t < DAY_MS; t += 5000) {
      const next = paintingLight(islandSky(clock, clock.start + t))
      expect(next.exposure).toBeGreaterThanOrEqual(.74)
      expect(next.exposure).toBeLessThanOrEqual(1.06)
      expect(next.direction[1]).toBeGreaterThan(0)
    }
  })
  it('carries easing through weather changes without an hourly light jump', () => {
    let previous = paintingLight(islandSky(clock, clock.start))
    for (let t = 1000; t < DAY_MS; t += 1000) {
      const next = paintingLight(islandSky(clock, clock.start + t))
      expect(Math.abs(next.exposure - previous.exposure)).toBeLessThan(.025)
      expect(Math.abs(next.tint[0] - previous.tint[0])).toBeLessThan(.025)
      previous = next
    }
  })
})
