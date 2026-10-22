import { describe, expect, it } from 'vitest'
import { WavePool, waveField, WAVE_TTL, landingsBetween, advanceRainWaves } from './waves'
import { rainSample } from './render-math'

describe('shared rain and displaced water field', () => {
  const r = { x: 2, z: 0, speed: 1, phase: 0 }, landing = .25 / .45
  it('lands once at the visible endpoint without replaying disabled rain', () => {
    expect(rainSample(landing - 1e-6, r).falling).toBe(true)
    expect(rainSample(landing + 1e-6, r).falling).toBe(false)
    expect(landingsBetween(0, landing - 1e-6, r)).toEqual([])
    expect(landingsBetween(landing - 1e-6, landing + 1e-6, r)).toEqual([landing])
    expect(landingsBetween(landing, landing + .01, r)).toEqual([])
    const pool = new WavePool()
    expect(advanceRainWaves(pool, 0, landing - .01, [r], true)).toHaveLength(0)
    expect(advanceRainWaves(pool, landing - .01, landing + .01, [r], true)).toEqual([{ x: 2, z: 0, time: landing, strength: 1 }])
    advanceRainWaves(pool, landing + .01, landing + .02, [r], true)
    expect(pool.events).toHaveLength(1)
    advanceRainWaves(pool, landing + .02, landing + .1, [r], false)
    expect(pool.events).toHaveLength(1)
    expect(pool.active(landing + WAVE_TTL)).toHaveLength(0)
    const off = new WavePool()
    advanceRainWaves(off, 0, 1, [r], false)
    advanceRainWaves(off, 1, 1.1, [r], true)
    expect(off.events).toHaveLength(0)
  })
  it('rejects the paper outside the water, bounds the CPU/GPU event pool', () => {
    const pool = new WavePool()
    expect(pool.add(5, 5, 1)).toBe(false)
    for (let i = 0; i < 100; i++) pool.add(2, 0, i / 100)
    expect(pool.events).toHaveLength(48)
    expect(pool.events.at(-1)?.time).toBe(.99)
  })
  it('keeps analytic normals on the actual displaced surface and decays impacts', () => {
    const impact = { x: 2, z: 0, time: 1, strength: 1 }
    for (const [x, z, t] of [[2.1, .04, 1.2], [2.3, .1, 1.5], [-1, 2, 2]]) {
      const eps = 1e-6, w = waveField(x, z, t, [impact])
      const dx = (waveField(x + eps, z, t, [impact]).height - waveField(x - eps, z, t, [impact]).height) / (2 * eps)
      const dz = (waveField(x, z + eps, t, [impact]).height - waveField(x, z - eps, t, [impact]).height) / (2 * eps)
      expect(w.dx).toBeCloseTo(dx, 7)
      expect(w.dz).toBeCloseTo(dz, 7)
    }
    expect(waveField(2, .1, .9, [impact])).toEqual(waveField(2, .1, .9))
    expect(waveField(2, .1, 4, [impact])).toEqual(waveField(2, .1, 4))
    const peakDelta = (age: number) => {
      let max = 0
      for (let radius = 0; radius < 2; radius += .002) max = Math.max(max, Math.abs(waveField(2 + radius, 0, 1 + age, [impact]).height - waveField(2 + radius, 0, 1 + age).height))
      return max
    }
    expect(peakDelta(.2)).toBeGreaterThan(.005)
    expect(peakDelta(2)).toBeLessThan(peakDelta(.2) * .1)
  })
})
