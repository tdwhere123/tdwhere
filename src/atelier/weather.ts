/**
 * The weather over the overture's block of water, read from the visitor's
 * own clock: the month gives the season, the hour gives the light, and the
 * date picks the day's weather, so everyone who visits on one day sees the
 * same sky until the hour turns.
 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type Sky = 'rain' | 'sun' | 'wind' | 'mist' | 'snow'
export type Rgb = [number, number, number]

export type Weather = {
  season: Season
  sky: Sky
  /** Local hour, 0–24. */
  hour: number
  /** 0..1 strength of the day's weather. */
  strength: number
  /** Lean of whatever falls, in radians; wind days lean hardest. */
  lean: number
}

export type Light = {
  paper: Rgb
  /** Shallow and deep water. */
  water: Rgb
  deep: Rgb
  /** Color of the light, and its direction across the paper (screen space, y up). */
  light: Rgb
  from: [number, number]
  /** 0 is moonless dark, 1 full day. */
  sun: number
  /** Ink of the outline and the falling rain. */
  ink: Rgb
}

export function seasonOf(month: number): Season {
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

/** Each season's odds for the day's sky. */
const odds: Record<Season, [Sky, number][]> = {
  spring: [['rain', 0.38], ['sun', 0.28], ['wind', 0.18], ['mist', 0.16]],
  summer: [['sun', 0.42], ['rain', 0.36], ['wind', 0.12], ['mist', 0.1]],
  autumn: [['wind', 0.3], ['sun', 0.28], ['rain', 0.26], ['mist', 0.16]],
  winter: [['snow', 0.32], ['mist', 0.24], ['sun', 0.24], ['rain', 0.1], ['wind', 0.1]],
}

/** A stable 0..1 number for a string. */
function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  h = Math.imul(h ^ (h >>> 15), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function weatherAt(date: Date): Weather {
  const season = seasonOf(date.getMonth())
  const day = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  let roll = hash(day),
    sky: Sky = odds[season][0][0]
  for (const [s, p] of odds[season]) {
    sky = s
    if ((roll -= p) < 0) break
  }
  const strength = 0.45 + hash(`${day}:strength`) * 0.55
  const side = hash(`${day}:lean`) < 0.5 ? -1 : 1
  return {
    season,
    sky,
    hour: date.getHours() + date.getMinutes() / 60,
    strength,
    lean: side * (sky === 'wind' ? 0.34 + strength * 0.2 : 0.06 + strength * 0.1),
  }
}

/** The light through a day, keyed by hour; the last key wraps to the first. */
const day: [number, Omit<Light, 'from'>][] = [
  [0, { paper: [0.15, 0.17, 0.2], water: [0.2, 0.27, 0.34], deep: [0.07, 0.1, 0.14], light: [0.7, 0.76, 0.9], sun: 0, ink: [0.82, 0.84, 0.86] }],
  [5, { paper: [0.24, 0.24, 0.29], water: [0.3, 0.34, 0.44], deep: [0.11, 0.13, 0.2], light: [0.8, 0.74, 0.86], sun: 0.1, ink: [0.8, 0.8, 0.84] }],
  [6.5, { paper: [0.93, 0.84, 0.8], water: [0.72, 0.74, 0.82], deep: [0.4, 0.44, 0.56], light: [1, 0.78, 0.66], sun: 0.55, ink: [0.25, 0.22, 0.26] }],
  [9, { paper: [0.95, 0.92, 0.85], water: [0.67, 0.76, 0.8], deep: [0.38, 0.5, 0.58], light: [1, 0.95, 0.86], sun: 0.85, ink: [0.17, 0.2, 0.22] }],
  [13, { paper: [0.96, 0.94, 0.88], water: [0.64, 0.77, 0.82], deep: [0.33, 0.5, 0.58], light: [1, 1, 0.95], sun: 1, ink: [0.16, 0.19, 0.21] }],
  [16.5, { paper: [0.95, 0.9, 0.8], water: [0.64, 0.72, 0.76], deep: [0.36, 0.44, 0.52], light: [1, 0.9, 0.74], sun: 0.85, ink: [0.2, 0.2, 0.2] }],
  [18.5, { paper: [0.93, 0.78, 0.62], water: [0.72, 0.66, 0.68], deep: [0.36, 0.32, 0.42], light: [1, 0.68, 0.42], sun: 0.55, ink: [0.26, 0.18, 0.16] }],
  [20, { paper: [0.36, 0.33, 0.4], water: [0.36, 0.38, 0.5], deep: [0.13, 0.14, 0.24], light: [0.9, 0.66, 0.6], sun: 0.15, ink: [0.82, 0.78, 0.8] }],
  [21.5, { paper: [0.17, 0.19, 0.23], water: [0.22, 0.29, 0.37], deep: [0.08, 0.11, 0.16], light: [0.72, 0.78, 0.92], sun: 0, ink: [0.82, 0.84, 0.86] }],
]

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

/** Season and weather shift the hour's light: overcast greys it, snow cools it. */
export function lightAt(w: Weather): Light {
  const h = ((w.hour % 24) + 24) % 24
  let i = day.length - 1
  while (i > 0 && day[i][0] > h) i--
  const [h0, a] = day[i],
    [h1, b] = day[(i + 1) % day.length]
  const t = Math.min(1, Math.max(0, (h - h0) / (((h1 - h0 + 24) % 24) || 24)))
  const k = t * t * (3 - 2 * t)
  let paper = mix(a.paper, b.paper, k),
    water = mix(a.water, b.water, k),
    deep = mix(a.deep, b.deep, k),
    light = mix(a.light, b.light, k),
    sun = a.sun + (b.sun - a.sun) * k
  const ink = mix(a.ink, b.ink, k)
  const tint: Record<Season, Rgb> = {
    spring: [0.98, 1.02, 0.98],
    summer: [0.95, 1.02, 1.02],
    autumn: [1.04, 0.99, 0.92],
    winter: [0.96, 0.99, 1.04],
  }
  water = water.map((v, j) => v * tint[w.season][j]) as Rgb
  const grey = (c: Rgb, amount: number) => {
    const l = c[0] * 0.3 + c[1] * 0.6 + c[2] * 0.1
    return mix(c, [l, l, l], amount)
  }
  if (w.sky === 'rain' || w.sky === 'mist' || w.sky === 'snow') {
    const overcast = 0.3 + w.strength * 0.3
    paper = grey(paper, overcast * 0.6)
    water = grey(water, overcast * 0.5)
    deep = grey(deep, overcast * 0.4)
    light = grey(light, overcast)
    sun *= 1 - overcast * 0.8
  }
  // the sun crosses from the left in the morning to the right by evening
  const arc = Math.min(1, Math.max(0, (h - 6) / 13))
  const from: [number, number] = [Math.cos(Math.PI * (1 - arc)) * 0.9, 0.5 + Math.sin(Math.PI * arc) * 0.5]
  return { paper, water, deep, light, from, sun, ink }
}

/** One line under the water, naming the hour and the weather. */
export function caption(w: Weather): [string, string] {
  const h = w.hour
  const when: [string, string] =
    h < 5 || h >= 21.5
      ? ['夜里', 'Night']
      : h < 8
        ? ['清晨', 'Early morning']
        : h < 11.5
          ? ['上午', 'Morning']
          : h < 14
            ? ['正午', 'Midday']
            : h < 17.5
              ? ['下午', 'Afternoon']
              : ['傍晚', 'Evening']
  const what: Record<Sky, [string, string]> = {
    rain: ['在下雨', 'raining'],
    sun: [h < 5 || h >= 21.5 ? '天很清' : '有太阳', h < 5 || h >= 21.5 ? 'clear' : 'sunny'],
    wind: ['起风了', 'windy'],
    mist: ['有雾', 'misty'],
    snow: ['在下雪', 'snowing'],
  }
  return [`${when[0]}，${what[w.sky][0]}。`, `${when[1]}, ${what[w.sky][1]}.`]
}
