/**
 * The weather over the overture's block of water. The island keeps its own
 * time: its clock is set going at the visitor's own hour and season, then a
 * day passes in twenty minutes and each day brings the next season, so a
 * whole year goes by in eighty. Each day turns through a few spells of
 * weather, each easing into the next.
 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type Sky = 'rain' | 'sun' | 'wind' | 'mist' | 'snow'
export type Rgb = [number, number, number]

export type Weather = {
  season: Season
  sky: Sky
  /** Island hour, 0–24. */
  hour: number
  /** 0..1 strength of the spell's weather. */
  strength: number
  /** Lean of whatever falls, in radians; wind leans hardest. */
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

/** One island day, in real milliseconds. */
export const DAY_MS = 20 * 60_000
/** Island hours per spell of weather, and how long a spell takes to turn into the next. */
export const SPELL_HOURS = 4
const TURN_HOURS = 0.75

export const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter']

export function seasonOf(month: number): Season {
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

/** Where the island's clock started: a real moment, and the hour and season it stood at. */
export type Clock = { start: number; hour: number; season: number; seed: string }

export function clockFrom(start: number): Clock {
  const d = new Date(start)
  return {
    start,
    hour: d.getHours() + d.getMinutes() / 60,
    season: seasons.indexOf(seasonOf(d.getMonth())),
    seed: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
  }
}

const CLOCK = 'tdwhere:clock'
let kept: Clock | undefined

/** One clock for the session, so the island is further on when it is visited again. */
export function sessionClock(): Clock {
  if (kept) return kept
  let start = Date.now()
  try {
    const stored = Number(sessionStorage.getItem(CLOCK))
    if (stored > 0 && stored <= start) start = stored
    else sessionStorage.setItem(CLOCK, String(start))
  } catch {
    /* a clock for this page only */
  }
  return (kept = clockFrom(start))
}

/** Island hours since midnight of the day the clock started. */
const hoursAt = (c: Clock, now: number) => c.hour + (Math.max(0, now - c.start) / DAY_MS) * 24

const seasonOfDay = (c: Clock, day: number) => seasons[(c.season + day) % 4]

/** Each season's odds for a spell's sky. */
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

function roll(season: Season, key: string) {
  let left = hash(key),
    sky: Sky = odds[season][0][0]
  for (const [s, p] of odds[season]) {
    sky = s
    if ((left -= p) < 0) break
  }
  return sky
}

/** The weather of one spell; a spell rarely repeats the sky before it. */
function spell(c: Clock, s: number): Omit<Weather, 'hour'> {
  const season = seasonOfDay(c, Math.floor((s * SPELL_HOURS) / 24)),
    key = `${c.seed}:${s}`
  let sky = roll(season, key)
  if (sky === roll(seasonOfDay(c, Math.floor(((s - 1) * SPELL_HOURS) / 24)), `${c.seed}:${s - 1}`))
    sky = roll(season, `${key}:again`)
  const strength = 0.45 + hash(`${key}:strength`) * 0.55
  const side = hash(`${key}:lean`) < 0.5 ? -1 : 1
  return {
    season,
    sky,
    strength,
    lean: side * (sky === 'wind' ? 0.34 + strength * 0.2 : 0.06 + strength * 0.1),
  }
}

/** The spell now, the one coming, and how far (0..1) the one is turning into the other. */
export function islandAt(c: Clock, now: number): { weather: Weather; next: Weather; turn: number } {
  const h = hoursAt(c, now),
    s = Math.floor(h / SPELL_HOURS),
    hour = h % 24
  const t = Math.max(0, (h - s * SPELL_HOURS - (SPELL_HOURS - TURN_HOURS)) / TURN_HOURS)
  return {
    weather: { ...spell(c, s), hour },
    next: { ...spell(c, s + 1), hour },
    turn: t * t * (3 - 2 * t),
  }
}

/** The weather as it reads now: the spell that is more than half in. */
export function weatherNow(c: Clock, now = Date.now()) {
  const { weather, next, turn } = islandAt(c, now)
  return turn < 0.5 ? weather : next
}

/** The light through a day, keyed by hour; the last key wraps to the first. */
const day: [number, Omit<Light, 'from'>][] = [
  [0, { paper: [0.11, 0.13, 0.18], water: [0.22, 0.33, 0.43], deep: [0.07, 0.14, 0.22], light: [0.7, 0.8, 0.9], sun: 0, ink: [0.82, 0.84, 0.86] }],
  [5, { paper: [0.18, 0.22, 0.28], water: [0.27, 0.37, 0.47], deep: [0.1, 0.17, 0.27], light: [0.76, 0.8, 0.88], sun: 0.1, ink: [0.8, 0.82, 0.84] }],
  [6.5, { paper: [0.93, 0.91, 0.9], water: [0.5, 0.66, 0.78], deep: [0.16, 0.32, 0.52], light: [1, 0.82, 0.7], sun: 0.55, ink: [0.24, 0.24, 0.26] }],
  [9, { paper: [0.93, 0.93, 0.9], water: [0.44, 0.66, 0.78], deep: [0.1, 0.3, 0.5], light: [1, 0.96, 0.88], sun: 0.85, ink: [0.16, 0.2, 0.24] }],
  [13, { paper: [0.94, 0.95, 0.94], water: [0.4, 0.66, 0.78], deep: [0.08, 0.3, 0.5], light: [1, 1, 0.95], sun: 1, ink: [0.16, 0.19, 0.22] }],
  [16.5, { paper: [0.94, 0.935, 0.91], water: [0.42, 0.62, 0.74], deep: [0.1, 0.28, 0.46], light: [1, 0.9, 0.74], sun: 0.85, ink: [0.2, 0.2, 0.22] }],
  [18.5, { paper: [0.92, 0.9, 0.87], water: [0.42, 0.6, 0.76], deep: [0.1, 0.25, 0.48], light: [1, 0.72, 0.48], sun: 0.55, ink: [0.24, 0.2, 0.18] }],
  [20, { paper: [0.24, 0.3, 0.4], water: [0.34, 0.48, 0.62], deep: [0.1, 0.22, 0.36], light: [0.9, 0.72, 0.6], sun: 0.15, ink: [0.8, 0.82, 0.84] }],
  [21.5, { paper: [0.13, 0.15, 0.21], water: [0.24, 0.35, 0.46], deep: [0.07, 0.15, 0.23], light: [0.72, 0.8, 0.92], sun: 0, ink: [0.82, 0.84, 0.86] }],
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
    autumn: [1.0, 1.0, 0.96],
    winter: [0.96, 0.99, 1.04],
  }
  water = water.map((v, j) => v * tint[w.season][j]) as Rgb
  deep = deep.map((v, j) => v * tint[w.season][j]) as Rgb
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

/** One line under the water, naming the season, the hour and the weather. */
export function caption(w: Weather): [string, string] {
  const h = w.hour
  const night = h < 5 || h >= 21.5
  const season: Record<Season, [string, string]> = {
    spring: ['春', 'Spring'],
    summer: ['夏', 'Summer'],
    autumn: ['秋', 'Autumn'],
    winter: ['冬', 'Winter'],
  }
  const when: [string, string] = night
    ? ['夜', 'night']
    : h < 8
      ? ['日清晨', 'early morning']
      : h < 11.5
        ? ['日上午', 'morning']
        : h < 14
          ? ['日正午', 'midday']
          : h < 17.5
            ? ['日下午', 'afternoon']
            : ['日傍晚', 'evening']
  const what: Record<Sky, [string, string]> = {
    rain: ['在下雨', 'raining'],
    sun: [night ? '天很清' : '有太阳', night ? 'clear' : 'sunny'],
    wind: ['起风了', 'windy'],
    mist: ['有雾', 'misty'],
    snow: ['在下雪', 'snowing'],
  }
  const [zh, en] = season[w.season]
  return [`${zh}${when[0]}，${what[w.sky][0]}。`, `${en} ${when[1]}, ${what[w.sky][1]}.`]
}
