import { describe, expect, it } from 'vitest'
import { lightAt, localHour, sunFrom } from './daylight'

describe('the light of the visitor’s hour', () => {
  it('is full day at noon and dark, but colored, at midnight', () => {
    expect(lightAt(13).sun).toBe(1)
    expect(lightAt(0).sun).toBe(0)
    expect(Math.max(...lightAt(0).water)).toBeGreaterThan(0.1)
  })
  it('eases through the day without jumps, including across midnight', () => {
    let previous = lightAt(0)
    for (let h = 0.01; h <= 24; h += 0.01) {
      const next = lightAt(h)
      expect(Math.abs(next.sun - previous.sun)).toBeLessThan(0.02)
      next.light.forEach((c, i) => expect(Math.abs(c - previous.light[i])).toBeLessThan(0.02))
      previous = next
    }
  })
  it('reads the hour from a date and keeps the sun above the water', () => {
    expect(localHour(new Date(2026, 0, 1, 18, 30))).toBeCloseTo(18.5)
    for (let h = 0; h < 24; h += 0.5) expect(sunFrom(h)[1]).toBeGreaterThan(0)
  })
})
