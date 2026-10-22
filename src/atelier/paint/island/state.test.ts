import { describe, expect, it } from 'vitest'
import { lightAt, type Sky, type Weather } from '../../weather'
import { sunVector, transitionState, viewSpan, weatherProfile } from './state'

const weather = (sky: Sky, hour = 13): Weather => ({ sky, hour, season: 'spring', strength: 0.8, lean: 0.1 })
const profile = (sky: Sky, hour = 13) => {
  const w = weather(sky, hour)
  return weatherProfile(w, lightAt(w))
}

describe('local weather rendered by the island', () => {
  it('keeps rain and snow distinct without precipitation in other skies', () => {
    for (const sky of ['rain', 'sun', 'wind', 'mist', 'snow'] as const) {
      expect(profile(sky).rain).toBe(sky === 'rain')
      expect(profile(sky).snow).toBe(sky === 'snow')
    }
    expect(profile('snow').precipitationSpeed).toBe(0.25)
    expect(profile('rain').precipitationSpeed).toBe(1)
  })
  it('reserves haze for mist and strengthens wind on windy days', () => {
    expect(profile('mist').mist).toBe(0.8)
    expect(profile('sun').mist).toBe(0)
    expect(profile('wind').wind).toBeGreaterThan(profile('rain').wind)
    expect(profile('wind').wind).toBeGreaterThan(profile('sun').wind)
  })
  it('dims night without losing the scene and warms evening tint', () => {
    expect(profile('sun', 0).exposure).toBeCloseTo(0.45)
    expect(profile('sun', 13).exposure).toBeCloseTo(1)
    const evening = profile('sun', 18.5).tint
    expect(evening[0]).toBeGreaterThan(evening[2])
    expect(Math.min(...evening)).toBeGreaterThan(0.8)
  })
})

describe('responsive scene footprint', () => {
  it('enlarges the accepted desktop and phone model by 28 percent', () => {
    expect(viewSpan(1440, 900)).toBeCloseTo(17.3 / 1.28)
    expect(viewSpan(390, 844)).toBeCloseTo(12 / 1.28)
  })
  it('reserves a vertical safe area above the original footer on short screens', () => {
    expect(viewSpan(1000, 300) / (1000 / 300)).toBeGreaterThanOrEqual(5.6)
  })
})

describe('enter handover', () => {
  it('does not transition before entry even if the painting is ready', () => {
    expect(transitionState(4, null, 0.4)).toEqual({ sink: 0, reveal: 0, done: false })
  })
  it('sinks over 1.5 seconds and starts revealing only after 0.7 seconds', () => {
    expect(transitionState(1.5, 1, 0.4).reveal).toBe(0)
    expect(transitionState(1.75, 1, 0.4).sink).toBeCloseTo(0.5)
    expect(transitionState(2.5, 1, 0.4).sink).toBe(1)
    expect(transitionState(3.1, 1, 0.4)).toEqual({ sink: 1, reveal: 1, done: true })
  })
  it('waits for a late painting and still gives it a full reveal duration', () => {
    expect(transitionState(10, 1, null)).toEqual({ sink: 1, reveal: 0, done: false })
    expect(transitionState(10, 1, 10).reveal).toBe(0)
    expect(transitionState(10.7, 1, 10).reveal).toBeCloseTo(0.5)
    expect(transitionState(11.4, 1, 10).done).toBe(true)
  })
})


describe('world-space time illumination', () => {
  const direction = (hour: number) => {
    const w = weather('sun', hour)
    return sunVector(w, lightAt(w))
  }
  it('retains the accepted low dawn light and raises it at noon', () => {
    const dawn = direction(6.5)
    expect(dawn[0]).toBeCloseTo(0.32997, 4)
    expect(dawn[1]).toBeCloseTo(0.24263, 4)
    expect(dawn[2]).toBeCloseTo(-0.91228, 4)
    expect(direction(12.5)[1]).toBeGreaterThan(dawn[1])
    expect(direction(18.5)[0]).toBeLessThan(0)
  })
  it('keeps every hourly light normalized and above the water', () => {
    for (let hour = 0; hour < 24; hour += 0.25) {
      const v = direction(hour)
      expect(Math.hypot(...v)).toBeCloseTo(1)
      expect(v[1]).toBeGreaterThan(0)
    }
  })
  it('reduces moon glint and colors evening highlights with the local light', () => {
    expect(profile('sun', 0).glint).toBeCloseTo(0.1)
    expect(profile('sun', 13).glint).toBeCloseTo(1)
    expect(profile('sun', 18.5).glintTint[0]).toBeGreaterThan(profile('sun', 18.5).glintTint[2])
  })
})
