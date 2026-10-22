import { describe, expect, it } from 'vitest'
import { WavePool, waveField, WAVE_GLSL, WAVE_TTL, landingsBetween, advanceRainWaves } from './waves'
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
  it('reserves interaction waves through sustained precipitation and expires naturally', () => {
    const pool = new WavePool()
    pool.add(2, 0, 0, 1.8)
    const touch = pool.events[0]
    for (let tick = 0; tick < 2500; tick++) pool.addRain(2, 0, tick / 1000)
    expect(pool.active(2.5)).toContain(touch)
    expect(pool.events.length).toBeLessThanOrEqual(33)
    expect(pool.active(WAVE_TTL)).not.toContain(touch)
    expect(pool.addRain(2, 0, 10)).toBe(true)
    expect(pool.events).toHaveLength(1)
  })
  it('rate limits physical rain without invalid or reversed events consuming admission', () => {
    const pool = new WavePool()
    expect(pool.addRain(5, 5, 0)).toBe(false)
    expect(pool.addRain(2, 0, Number.NaN)).toBe(false)
    expect(pool.addRain(2, 0, 0)).toBe(true)
    expect(pool.addRain(2, 0, .01)).toBe(false)
    expect(pool.addRain(2, 0, -.2)).toBe(false)
    expect(pool.addRain(2, 0, 1 / 12)).toBe(true)
    expect(pool.events.map(event => event.time)).toEqual([0, 1 / 12])
  })
  it('evicts precipitation before interactions and never admits rain into a full interaction pool', () => {
    const pool = new WavePool(6)
    for (let i = 0; i < 4; i++) expect(pool.addRain(2, 0, i / 10)).toBe(true)
    expect(pool.addRain(2, 0, .4)).toBe(true)
    expect(pool.events).toHaveLength(4)
    for (let i = 0; i < 6; i++) pool.add(2, 0, .5, 1.8)
    expect(pool.events).toHaveLength(6)
    expect(pool.events.every(event => event.strength === 1.8)).toBe(true)
    expect(pool.addRain(2, 0, .6)).toBe(false)
    expect(pool.events.every(event => event.strength === 1.8)).toBe(true)
  })
  it('admits legacy precipitation chronologically rather than in seed order', () => {
    const early = { ...r, phase: .20 }, late = { ...r, phase: .05 }
    const pool = new WavePool()
    advanceRainWaves(pool, 0, .5, [late, early], true)
    expect(pool.events.map(event => event.time)).toEqual([(.25 - .20) / .45, (.25 - .05) / .45])
  })
  it('uses aligned long and middle swells with only a weak crossing component', () => {
    for (const [x, z, time] of [[0, 0, 0], [2.3, -.7, 4.2], [-3, 1.2, 17]]) {
      const raw = .018 * Math.sin(x * 1.1 + z * .45 + time * .7)
        + .008 * Math.sin(x * 2.6 + z * 1.25 + time * 1.15)
        + .004 * Math.sin(x * -1.6 + z * 2.1 + time * 1.1 + .8)
      expect(waveField(x, z, time).height).toBeCloseTo(raw / Math.sqrt(1 + raw * raw / .0144), 12)
    }
    expect(WAVE_GLSL).toContain('p.x*1.1+p.y*0.45+time*0.7')
    expect(WAVE_GLSL).toContain('p.x*2.6+p.y*1.25+time*1.15')
    expect(WAVE_GLSL).toContain('p.x*-1.6+p.y*2.1+time*1.1+0.8')
    expect(WAVE_GLSL.match(/for\(/g)).toHaveLength(1)
  })
  it('keeps the base swell within its old height envelope and its gradients on the surface', () => {
    const impact = { x: 2, z: 0, time: 1, strength: 1.8 }
    for (let x = -4; x <= 4; x += .4) for (let z = -3; z <= 3; z += .6) {
      for (const time of [0, .9, 1.1, 1.5, 2.7, 4, 31]) {
        expect(Math.abs(waveField(x, z, time).height)).toBeLessThanOrEqual(.030)
        for (const events of [[], [impact]]) {
          const eps = 1e-6, sample = waveField(x, z, time, events)
          const dx = (waveField(x + eps, z, time, events).height - waveField(x - eps, z, time, events).height) / (2 * eps)
          const dz = (waveField(x, z + eps, time, events).height - waveField(x, z - eps, time, events).height) / (2 * eps)
          expect(sample.dx).toBeCloseTo(dx, 7)
          expect(sample.dz).toBeCloseTo(dz, 7)
        }
      }
    }
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
