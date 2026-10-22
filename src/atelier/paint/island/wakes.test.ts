import { describe, expect, it } from 'vitest'
import { CootWakeTrail, COOT_WAKE_LIFE, COOT_WAKE_SAMPLES } from './wakes'
import type { Mode } from './birds'

const bird = (x: number, z = 0, mode: Mode = 'swim') => ({ x, z, mode })
const packets = (trail: CootWakeTrail) => Array.from({ length: trail.uniforms.length / 4 }, (_, i) => Array.from(trail.uniforms.slice(i * 4, i * 4 + 4))).filter(p => p[3] > 0)

describe('coot wake history', () => {
  it('leaves past water positions fixed through a turn instead of rotating an attached V', () => {
    const trail = new CootWakeTrail(1)
    trail.update([bird(0)], 0)
    trail.update([bird(.09)], .3)
    const before = packets(trail)
    trail.update([bird(.09, .09)], .6)
    expect(before.length).toBe(2)
    expect(packets(trail).slice(0, 2)).toEqual(before)
    expect(packets(trail).slice(2).every(p => Math.abs(p[0] - .09) < 1e-6 && p[1] > 0)).toBe(true)
  })
  it('emits by distance, with interpolated birth times, independently of frame rate', () => {
    const run = (fps: number) => {
      const trail = new CootWakeTrail(1)
      for (let frame = 0; frame <= fps * 2; frame++) trail.update([bird(frame / fps * .12)], frame / fps)
      return packets(trail)
    }
    const slow = run(20), fast = run(120)
    expect(slow).toHaveLength(5)
    expect(fast).toHaveLength(slow.length)
    slow.forEach((p, i) => p.forEach((v, j) => expect(v).toBeCloseTo(fast[i][j], 5)))
  })

  it.each(['swim', 'dive', 'perch'] as const)('retains then expires the old wake when stationary or %s', mode => {
    const trail = new CootWakeTrail(1)
    trail.update([bird(0)], 0)
    trail.update([bird(.09)], .3)
    const before = packets(trail)
    trail.update([bird(.09, 0, mode)], .6)
    expect(packets(trail)).toEqual(before)
    trail.update([bird(.09, 0, mode)], COOT_WAKE_LIFE + .4)
    expect(packets(trail)).toHaveLength(0)
  })

  it('never joins dive/surface relocation or a discontinuous jump', () => {
    const trail = new CootWakeTrail(1)
    trail.update([bird(0)], 0)
    trail.update([bird(0, 0, 'dive')], .1)
    trail.update([bird(.9)], .2)
    expect(packets(trail)).toHaveLength(0)
    trail.update([bird(.99)], .5)
    expect(packets(trail)).toHaveLength(2)
    const before = packets(trail)
    trail.update([bird(3)], .6)
    expect(packets(trail)).toEqual(before)
  })

  it('keeps fixed uniform storage and a fair bounded slice for each bird', () => {
    const trail = new CootWakeTrail(9), storage = trail.uniforms
    for (let frame = 0; frame < 600; frame++) trail.update(Array.from({ length: 9 }, (_, i) => bird(frame * .01, i)), frame / 30)
    expect(trail.uniforms).toBe(storage)
    expect(storage.length).toBe(9 * COOT_WAKE_SAMPLES * 4)
    expect(packets(trail)).toHaveLength(9 * COOT_WAKE_SAMPLES)
    for (let i = 0; i < 9; i++) expect(packets(trail).filter(p => p[1] === i)).toHaveLength(COOT_WAKE_SAMPLES)
    expect([...storage].every(Number.isFinite)).toBe(true)
  })

  it('does not bridge a paused clock or poison storage with invalid input', () => {
    const trail = new CootWakeTrail(1)
    trail.update([bird(0)], 0)
    trail.update([bird(.1)], 2)
    trail.update([bird(Number.NaN)], 2.1)
    trail.update([bird(.2)], 2.2)
    trail.update([bird(.3)], Number.NaN)
    expect(packets(trail)).toHaveLength(0)
    expect([...trail.uniforms].every(Number.isFinite)).toBe(true)
  })
})
