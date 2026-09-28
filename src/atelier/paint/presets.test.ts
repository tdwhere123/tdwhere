import { describe, expect, it } from 'vitest'
import {
  coverFit,
  fieldSteps,
  mixRgb,
  parseObjectPosition,
  presetFor,
  scrollProgress,
  settleFrames,
} from './presets'

describe('coverFit', () => {
  it('crops the wider axis and keeps the other whole', () => {
    const { scale, offset } = coverFit(1000, 1000, 1600, 1000)
    expect(scale[0]).toBeCloseTo(0.625)
    expect(scale[1]).toBeCloseTo(1)
    expect(offset[0]).toBeCloseTo(0.1875)
    expect(offset[1]).toBeCloseTo(0)
  })
  it('measures object-position y from the top in a y-up uv space', () => {
    const top = coverFit(1600, 400, 1600, 1000, [0.5, 0])
    const bottom = coverFit(1600, 400, 1600, 1000, [0.5, 1])
    expect(top.offset[1]).toBeCloseTo(0.6)
    expect(bottom.offset[1]).toBeCloseTo(0)
  })
  it('is an identity for degenerate sizes', () => {
    expect(coverFit(0, 10, 10, 10)).toEqual({ scale: [1, 1], offset: [0, 0] })
  })
})

describe('parseObjectPosition', () => {
  it('reads percentages and keywords', () => {
    expect(parseObjectPosition('60% 50%')).toEqual([0.6, 0.5])
    expect(parseObjectPosition('center')).toEqual([0.5, 0.5])
    expect(parseObjectPosition('top')).toEqual([0.5, 0])
    expect(parseObjectPosition('bottom left')).toEqual([0, 1])
  })
  it('falls back to center for lengths', () => {
    expect(parseObjectPosition('12px 40%')).toEqual([0.5, 0.4])
  })
})

describe('field timing', () => {
  it('steps at 60 Hz and carries the remainder', () => {
    const a = fieldSteps(25)
    expect(a.steps).toBe(1)
    const b = fieldSteps(10, a.carry)
    expect(b.steps).toBe(1)
  })
  it('caps a stalled tab', () => {
    expect(fieldSteps(5000)).toEqual({ steps: 4, carry: 0 })
  })
  it('knows when a decaying field has settled', () => {
    expect(settleFrames(0.5, 0.25)).toBe(2)
    expect(settleFrames(1)).toBe(Infinity)
  })
})

describe('presets', () => {
  it('quiet intensity only softens the full preset', () => {
    const full = presetFor('construction'),
      quiet = presetFor('construction', 'quiet')
    expect(quiet.mode).toBe(full.mode)
    quiet.gain.forEach((g, i) => expect(g).toBeLessThanOrEqual(full.gain[i]))
    expect(quiet.drift).toBeLessThan(full.drift)
  })
  it('clamps color mixing and scroll progress', () => {
    expect(mixRgb([0, 0, 0], [1, 1, 1], 2)).toEqual([1, 1, 1])
    expect(scrollProgress(900, 500, 900)).toBe(0)
    expect(scrollProgress(-500, 500, 900)).toBe(1)
  })
})
