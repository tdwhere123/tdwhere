import { describe, expect, it } from 'vitest'
import { rainFlight, rainImpacts, rainHalfWidth, SplashPool } from './rain'
import { isOpenWater } from './math'

describe('rain flight and water contact', () => {
  const seed = { id: 7, speed: 1, phase: .13 }
  it('lands at the visible endpoint once and reseeds only between flights', () => {
    const hits = rainImpacts(0, 5, seed)
    expect(hits.length).toBeGreaterThan(1)
    for (const hit of hits) {
      const before = rainFlight(hit.time - 1e-7, seed)
      expect(before.falling).toBe(true)
      expect(before.y).toBeLessThan(.00001)
      expect(before.x).toBeCloseTo(hit.x, 8)
      expect(before.z).toBeCloseTo(hit.z, 8)
      expect(rainFlight(hit.time + 1e-7, seed).falling).toBe(false)
      expect(rainImpacts(hit.time, hit.time + .001, seed)).toEqual([])
    }
    expect(hits[0].x).not.toBe(hits[1].x)
    expect(rainImpacts(0, 5, seed)).toEqual(hits)
  })
  it('keeps every cycle on water and the mobile streak above subpixel width', () => {
    for (let id = 0; id < 140; id++) for (let t = 0; t < 15; t += .73) {
      const p = rainFlight(t, { ...seed, id })
      expect(isOpenWater(p.x, p.z)).toBe(true)
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) expect(isOpenWater(p.x + Math.cos(angle)*.16, p.z + Math.sin(angle)*.16)).toBe(true)
    }
    expect(rainHalfWidth(10.5, 390) * 2 * 390 / 10.5).toBeGreaterThanOrEqual(1.2)
    expect(rainHalfWidth(15, 1440)).toBeLessThan(.012)
  })
  it('keeps width finite and positive through collapsed or invalid resize measurements', () => {
    for (const span of [0, -1, 10.5, NaN, Infinity]) for (const width of [0, -1, 390, NaN, Infinity]) {
      expect(Number.isFinite(rainHalfWidth(span, width))).toBe(true)
      expect(rainHalfWidth(span, width)).toBeGreaterThan(0)
    }
  })
  it('bounds contact splashes and expires them rather than replaying', () => {
    const pool = new SplashPool()
    for (let i = 0; i < 200; i++) pool.add({ x: 2, z: 0, time: i / 1000 })
    expect(pool.active(.2).length).toBeLessThanOrEqual(32)
    expect(pool.active(1)).toEqual([])
  })
})
