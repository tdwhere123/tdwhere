import { describe, expect, it } from 'vitest'
import { makeFlock, startle, stepFlock, type Pond } from './birds'
import { randomSource, waterField } from './math'

const wheels: [number, number][] = [[-1.9, -0.5], [-1.5, -0.6], [-1.1, -0.7], [-0.7, -0.8]]
const perches: [number, number][] = [[-1.5, -0.9], [-1.0, -0.4], [-1.6, -0.3], [-0.9, -1.0]]
const pond = (running: number, random = randomSource(7)): Pond => ({ random, running, wheels, center: [-1.3, -0.6], perches })

describe('the coots', () => {
  it('start on open water, two of them up on the pontoons', () => {
    const flock = makeFlock(randomSource(), [-0.2, 0.1])
    expect(flock.filter((b) => b.mode === 'perch')).toHaveLength(2)
    for (const b of flock) if (b.mode !== 'perch') expect(waterField(b.x, b.z)).toBeGreaterThan(0.6)
  })
  it('stay on the water and keep off the turning wheels over a long while', () => {
    const flock = makeFlock(randomSource(3), [-0.2, 0.1], 9, 0),
      p = pond(1)
    for (let i = 0; i < 6000; i++) {
      stepFlock(flock, 1 / 30, p)
      for (const b of flock) {
        expect(waterField(b.x, b.z)).toBeGreaterThan(0)
        for (const [x, z] of wheels) expect(Math.hypot(b.x - x, b.z - z)).toBeGreaterThan(0.15)
      }
    }
  })
  it('scatter from a touch, and one may dive and come up elsewhere with a ring', () => {
    const flock = makeFlock(randomSource(5), [0.5, 0.2], 9, 0),
      random = randomSource(11)
    const [tx, tz] = [flock[0].x + 0.1, flock[0].z]
    const near = flock.filter((b) => Math.hypot(b.x - tx, b.z - tz) < 1.1),
      before = near.map((b) => Math.hypot(b.x - tx, b.z - tz))
    startle(flock, tx, tz, () => 0.1)
    expect(near.every((b) => b.mode === 'flee' || b.mode === 'dive')).toBe(true)
    expect(near.some((b) => b.mode === 'dive')).toBe(true)
    const rings = []
    for (let i = 0; i < 150; i++) rings.push(...stepFlock(flock, 1 / 30, pond(1, random)))
    near.forEach((b, k) => expect(Math.hypot(b.x - tx, b.z - tz)).toBeGreaterThan(before[k]))
    expect(rings.length).toBeGreaterThanOrEqual(2)
  })
  it('climb onto the pontoons only while the aerator stands still, and leave them when startled', () => {
    const flock = makeFlock(randomSource(9), [-1.3, -0.2], 9, 0),
      random = randomSource(2)
    for (let i = 0; i < 3000; i++) stepFlock(flock, 1 / 30, pond(1, random))
    expect(flock.filter((b) => b.mode === 'perch')).toHaveLength(0)
    for (let i = 0; i < 12000; i++) stepFlock(flock, 1 / 30, pond(0, random))
    const up = flock.filter((b) => b.mode === 'perch')
    expect(up.length).toBeGreaterThan(0)
    expect(new Set(up.map((b) => b.perch)).size).toBe(up.length)
    const [x, z] = perches[up[0].perch]
    startle(flock, x, z, random)
    expect(up[0].mode).toBe('leave')
    for (let i = 0; i < 30; i++) stepFlock(flock, 1 / 30, pond(0, random))
    expect(up[0].mode).not.toBe('perch')
    expect(up[0].perch).toBe(-1)
  })
})
