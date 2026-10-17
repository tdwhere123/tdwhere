import { describe, expect, it } from 'vitest'
import { caption, lightAt, seasonOf, weatherAt } from './weather'

describe('weather', () => {
  it('reads the season from the month', () => {
    expect(seasonOf(0)).toBe('winter')
    expect(seasonOf(3)).toBe('spring')
    expect(seasonOf(6)).toBe('summer')
    expect(seasonOf(9)).toBe('autumn')
    expect(seasonOf(11)).toBe('winter')
  })
  it('gives one sky for the whole of a day', () => {
    const morning = weatherAt(new Date(2026, 9, 17, 8, 0)),
      night = weatherAt(new Date(2026, 9, 17, 23, 30))
    expect(night.sky).toBe(morning.sky)
    expect(night.hour).toBeCloseTo(23.5)
  })
  it('only snows in winter', () => {
    for (let d = 1; d <= 300; d++) {
      const w = weatherAt(new Date(2026, 0, d))
      if (w.sky === 'snow') expect(w.season).toBe('winter')
    }
  })
  it('is dark at night and lit at noon, and wraps past midnight', () => {
    const at = (hour: number) =>
      lightAt({ season: 'summer', sky: 'sun', hour, strength: 0.5, lean: 0 })
    expect(at(13).sun).toBe(1)
    expect(at(2).sun).toBeLessThan(0.05)
    expect(at(23).paper[0]).toBeLessThan(0.2)
    expect(at(13).paper[0]).toBeGreaterThan(0.9)
  })
  it('greys the light when it is overcast', () => {
    const base = { season: 'spring', hour: 13, strength: 1, lean: 0 } as const
    expect(lightAt({ ...base, sky: 'rain' }).sun).toBeLessThan(lightAt({ ...base, sky: 'sun' }).sun)
  })
  it('names the hour and the weather', () => {
    expect(caption({ season: 'autumn', sky: 'rain', hour: 18, strength: 0.5, lean: 0 })).toEqual([
      '傍晚，在下雨。',
      'Evening, raining.',
    ])
  })
})
