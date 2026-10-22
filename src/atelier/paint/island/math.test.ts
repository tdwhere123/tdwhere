import { describe, expect, it } from 'vitest'
import { project, waterPoint, height, normal, diffuse, LIGHT, waterField, landField, ELEVATION, CAMERA_RADIUS, randomSource, shadow, isOpenWater, waterSpecular, waterNormal } from './math'
import { PAPER_SRGB, compositePaper, rainSample } from './render-math'

describe('accepted island model', () => {
  it('picks water across the full 22 degree orbit', () => {
    expect(ELEVATION).toBe(22 * Math.PI / 180)
    expect(CAMERA_RADIUS).toBe(12)
    for (const yaw of [0, .5, Math.PI, Math.PI * 2]) for (const p of [[1, 0, 2], [-.4, 0, .7], [0, 0, 0]]) {
      const s = project(p, yaw, 100, 500, 400), back = waterPoint(s[0], s[1], yaw, 100, 500, 400)
      expect(Math.hypot(...p.map((v, i) => v - back[i]))).toBeLessThan(1e-12)
    }
    expect(project([1, .3, .5], 0, 100, 0, 0).map(Math.round)).toEqual(project([1, .3, .5], Math.PI * 2, 100, 0, 0).map(Math.round))
  })
  it('preserves low canopy, seeded marks, and geometry-driven occlusion', () => {
    expect(height(0, 0)).toBeGreaterThan(.05)
    expect(height(0, 0)).toBeLessThan(.2)
    expect(height(2, 0)).toBe(0)
    expect(shadow(-.5, 0, -.1)).toBe(1)
    const a = randomSource(), b = randomSource()
    for (let i = 0; i < 100; i++) expect(a()).toBe(b())
    const n = normal(-.3, -.1), shade = diffuse(n), fixed = [...LIGHT]
    expect(Math.hypot(...n)).toBeCloseTo(1, 12)
    for (const yaw of [0, 1, 2, 3]) {
      project([-.3, height(-.3, -.1), -.1], yaw, 100, 0, 0)
      expect(diffuse(n)).toBe(shade)
      expect(LIGHT).toEqual(fixed)
    }
    expect(LIGHT[1]).toBeGreaterThan(.2)
    expect(LIGHT[1]).toBeLessThan(.3)
  })
  it('excludes land and paper from all seeded rain impacts', () => {
    expect(waterField(2, 0)).toBeGreaterThan(0)
    expect(waterField(4, 0)).toBeLessThan(0)
    expect(landField(1, .5)).toBeLessThan(0)
    expect(isOpenWater(0, 0)).toBe(false)
    expect(isOpenWater(4, 4)).toBe(false)
    expect(isOpenWater(2, 0)).toBe(true)
    let accepted = 0
    const rng = randomSource()
    for (let i = 0; i < 1000 && accepted < 80; i++) {
      const x = (rng() - .5) * 6.2, z = (rng() - .5) * 6.2
      if (isOpenWater(x, z)) {
        expect(waterField(x, z)).toBeGreaterThan(.1)
        expect(landField(x, z)).toBeLessThan(-.05)
        accepted++
      }
    }
    expect(accepted).toBe(80)
  })
  it('changes fixed-light reflection with azimuth and animated normals', () => {
    let front = 0, back = 0, animated = 0
    for (let x = -2; x < 2; x += .2) for (let z = -2; z < 2; z += .2) {
      const s = waterSpecular(x, z, -.35, 0), b = waterSpecular(x, z, Math.PI - .35, 0), t = waterSpecular(x, z, -.35, 4)
      front += s.broad; back += b.broad; animated += Math.abs(s.broad - t.broad)
      expect(Math.hypot(...waterNormal(x, z, 1))).toBeCloseTo(1, 12)
    }
    expect(front).toBeGreaterThan(back * 3)
    expect(animated).toBeGreaterThan(1)
  })
  it('preserves exact paper outside coverage and varied rain fall timing', () => {
    for (const rgb of [[0, 0, 0], [1, .2, .3], [.4, .5, .6]]) {
      compositePaper(rgb, 0).forEach((v, i) => expect(v).toBeCloseTo(PAPER_SRGB[i], 12))
    }
    for (const speed of [.8, 1, 1.2]) {
      const rain = { speed, phase: 0 }, fallTime = .25 / (.45 * speed)
      expect(rainSample(.1, rain).falling).toBe(true)
      expect(fallTime).toBeGreaterThanOrEqual(.46)
      expect(fallTime).toBeLessThanOrEqual(.70)
      expect(rainSample(fallTime + .01, rain).falling).toBe(false)
      expect(rainSample(fallTime + .01, rain).impactAge).toBeGreaterThan(0)
    }
  })
})
