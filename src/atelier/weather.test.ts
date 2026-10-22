import { describe, expect, it } from 'vitest'
import { DAY_MS, SPELL_HOURS, caption, clockFrom, islandAt, lightAt, seasonOf, weatherNow } from './weather'

// 15:00 on an October afternoon
const clock = clockFrom(new Date(2026, 9, 22, 15, 0).getTime())
const after = (hours: number) => clock.start + (hours / 24) * DAY_MS

describe('weather', () => {
  it('reads the season from the month', () => {
    expect(seasonOf(0)).toBe('winter')
    expect(seasonOf(3)).toBe('spring')
    expect(seasonOf(6)).toBe('summer')
    expect(seasonOf(9)).toBe('autumn')
    expect(seasonOf(11)).toBe('winter')
  })
  it('starts at the visitor’s hour and season and runs a day in twenty minutes', () => {
    expect(weatherNow(clock, clock.start).hour).toBeCloseTo(15)
    expect(weatherNow(clock, clock.start).season).toBe('autumn')
    expect(weatherNow(clock, clock.start + DAY_MS / 2).hour).toBeCloseTo(3)
    expect(weatherNow(clock, clock.start + DAY_MS).hour).toBeCloseTo(15)
  })
  it('brings the next season with each island day, a year in eighty minutes', () => {
    expect(weatherNow(clock, after(10)).season).toBe('winter')
    expect(weatherNow(clock, after(34)).season).toBe('spring')
    expect(weatherNow(clock, after(58)).season).toBe('summer')
    expect(weatherNow(clock, clock.start + 4 * DAY_MS).season).toBe('autumn')
  })
  it('holds a spell, then eases it into the next', () => {
    const middle = islandAt(clock, after(SPELL_HOURS - 15 + SPELL_HOURS / 2))
    expect(middle.turn).toBe(0)
    const end = islandAt(clock, after(SPELL_HOURS * 5 - 15 - 0.01))
    expect(end.turn).toBeGreaterThan(0.99)
  })
  it('changes the sky within a day', () => {
    const skies = new Set<string>()
    for (let h = 0; h < 24; h += SPELL_HOURS) skies.add(weatherNow(clock, after(h)).sky)
    expect(skies.size).toBeGreaterThan(1)
  })
  it('only snows in winter', () => {
    for (let h = 0; h < 24 * 40; h += 1) {
      const w = weatherNow(clock, after(h))
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
  it('advances the caption and light with island time, not the starting wall hour', () => {
    const start = weatherNow(clock, clock.start)
    const later = weatherNow(clock, clock.start + 5 * 60_000)
    expect(start.hour).toBe(15)
    expect(later.hour).toBe(21)
    expect(caption(start)[0]).toContain('日下午')
    expect(caption(later)[0]).toContain('日傍晚')
    expect(lightAt(later).sun).toBeLessThan(lightAt(start).sun)
    expect(caption(later)).toEqual(['秋日傍晚，天很清。', 'Autumn evening, clear.'])
  })
  it('does not promise sunshine once clear dusk reaches night lighting', () => {
    const clear = (hour: number) => ({ season: 'autumn', sky: 'sun', hour, strength: 0.5, lean: 0 }) as const
    expect(caption(clear(18.5))).toEqual(['秋日傍晚，有太阳。', 'Autumn evening, sunny.'])
    for (const hour of [20, 21, 21.49]) {
      expect(lightAt(clear(hour)).sun).toBeLessThanOrEqual(0.15)
      expect(caption(clear(hour))).toEqual(['秋日傍晚，天很清。', 'Autumn evening, clear.'])
    }
    expect(caption(clear(21.5))).toEqual(['秋夜，天很清。', 'Autumn night, clear.'])
    expect(caption(clear(5))).toEqual(['秋日清晨，天很清。', 'Autumn early morning, clear.'])
    expect(caption(clear(6.5))).toEqual(['秋日清晨，有太阳。', 'Autumn early morning, sunny.'])
  })
  it('names the season, the hour and the weather', () => {
    expect(caption({ season: 'autumn', sky: 'rain', hour: 18, strength: 0.5, lean: 0 })).toEqual([
      '秋日傍晚，在下雨。',
      'Autumn evening, raining.',
    ])
    expect(caption({ season: 'winter', sky: 'sun', hour: 23, strength: 0.5, lean: 0 })).toEqual([
      '冬夜，天很清。',
      'Winter night, clear.',
    ])
  })
})
