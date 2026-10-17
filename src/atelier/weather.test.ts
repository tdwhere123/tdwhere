import { describe, expect, it } from 'vitest'
import { blendLight, caption, dayTour, lightAt, periodOf, seasonOf, weatherAt } from './weather'

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
  it('names each part of the day from the same bounds', () => {
    expect(periodOf(4.9)).toBe('night')
    expect(periodOf(5)).toBe('dawn')
    expect(periodOf(8)).toBe('morning')
    expect(periodOf(11.5)).toBe('noon')
    expect(periodOf(14)).toBe('afternoon')
    expect(periodOf(17.5)).toBe('evening')
    expect(periodOf(21.5)).toBe('night')
    expect(periodOf(26)).toBe('night')
    expect(periodOf(-1)).toBe('night')
  })
  it('walks every part of the day, then rests on the visitor’s hour', () => {
    const afternoon = dayTour(new Date(2026, 9, 17, 15, 30))
    expect(afternoon.map((w) => periodOf(w.hour))).toEqual([
      'night',
      'dawn',
      'morning',
      'noon',
      'afternoon',
      'evening',
      'afternoon',
    ])
    expect(afternoon[0].hour).toBe(2)
    expect(afternoon[6].hour).toBeCloseTo(15.5)
    expect(afternoon.every((w) => w.sky === afternoon[0].sky && w.season === 'autumn')).toBe(true)
    const evening = dayTour(new Date(2026, 9, 17, 19, 30))
    expect(evening).toHaveLength(6)
    expect(evening[5].hour).toBeCloseTo(19.5)
  })
  it('blends light from one hour to the next', () => {
    const a = lightAt({ season: 'summer', sky: 'sun', hour: 2, strength: 0.5, lean: 0 })
    const b = lightAt({ season: 'summer', sky: 'sun', hour: 13, strength: 0.5, lean: 0 })
    expect(blendLight(a, b, 0).sun).toBeCloseTo(a.sun)
    expect(blendLight(a, b, 1).sun).toBeCloseTo(b.sun)
    expect(blendLight(a, b, 0.5).paper[0]).toBeGreaterThan(a.paper[0])
    expect(blendLight(a, b, 0.5).paper[0]).toBeLessThan(b.paper[0])
  })
})
