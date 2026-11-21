import { describe, expect, it } from 'vitest'
import { lightAt } from '../daylight'
import { paintingLight } from './light'

describe('the hour as light on pigment', () => {
  it('copies the hour’s colors and keeps night colored rather than black', () => {
    const paint = paintingLight(12)
    expect(paint.tint).toEqual(lightAt(12).light)
    for (let h = 0; h < 24; h += 0.25) {
      const next = paintingLight(h)
      expect(next.exposure).toBeGreaterThanOrEqual(0.74)
      expect(next.exposure).toBeLessThanOrEqual(1.06)
      expect(next.direction[1]).toBeGreaterThan(0)
    }
  })
})
