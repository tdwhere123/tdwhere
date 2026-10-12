import { describe, it, expect } from 'vitest'
import {
  advanceRun,
  emptyRun,
  evidence,
  recallFixture,
  sceneAt,
  workflow,
  type QueryId,
  type TaskKind,
} from './model'
describe('illustrative recall', () => {
  it.each<QueryId>(['design', 'ship', 'access'])(
    'respects budget and validity: %s',
    (query) => {
      for (let cap = 0; cap < 6; cap++) {
        const r = recallFixture(query, cap)
        expect(r.used).toBeLessThanOrEqual(cap)
        expect(r.selected.every((e) => e.current)).toBe(true)
        expect(new Set(r.selected.map((e) => e.id)).size).toBe(
          r.selected.length,
        )
      }
    },
  )
  it('excludes superseded but related evidence', () => {
    expect(
      recallFixture('design').candidates.some((e) => e.id === 'cube'),
    ).toBe(true)
    expect(recallFixture('design').selected.some((e) => e.id === 'cube')).toBe(
      false,
    )
  })
  it('changes membership with the question', () =>
    expect(recallFixture('ship').selected.map((e) => e.id)).not.toEqual(
      recallFixture('access').selected.map((e) => e.id),
    ))
  it('handles invalid budgets', () => {
    expect(recallFixture('design', NaN).used).toBe(0)
    expect(recallFixture('design', -1).used).toBe(0)
  })
  it('has unique evidence identifiers', () =>
    expect(new Set(evidence.map((e) => e.id)).size).toBe(evidence.length))
})
describe('illustrative workflow', () => {
  it.each<TaskKind>(['copy', 'api', 'auth'])(
    'blocks delivery before rechecking: %s',
    (kind) => {
      let s = emptyRun()
      while (workflow[kind][s.index] !== 'verify')
        s = advanceRun(kind, s, 'next')
      s = advanceRun(kind, s, 'next')
      expect(s.failed).toBe(true)
      expect(advanceRun(kind, s, 'next')).toEqual(s)
      s = advanceRun(kind, s, 'repair')
      expect(workflow[kind][s.index]).toBe('verify')
      s = advanceRun(kind, s, 'next')
      expect(workflow[kind][s.index]).toBe('deliver')
      expect(advanceRun(kind, s, 'reset')).toEqual(emptyRun())
    },
  )
  it('does not repair before failure', () =>
    expect(advanceRun('api', emptyRun(), 'repair')).toEqual(emptyRun()))
})
describe('scene from scroll', () => {
  const chapters = [
    { center: 100, scene: 0 },
    { center: 500, scene: 0 },
    { center: 900, scene: 1 },
    { center: 1300, scene: 3 },
  ]
  it('holds the first and last scenes beyond the chapters', () => {
    expect(sceneAt(chapters, 0)).toBe(0)
    expect(sceneAt(chapters, 2000)).toBe(3)
    expect(sceneAt([], 10)).toBe(0)
  })
  it('holds near a chapter center and turns between them', () => {
    expect(sceneAt(chapters, 560)).toBe(0)
    expect(sceneAt(chapters, 700)).toBeCloseTo(0.5)
    expect(sceneAt(chapters, 880)).toBe(1)
    expect(sceneAt(chapters, 1100)).toBeCloseTo(2)
  })
})
