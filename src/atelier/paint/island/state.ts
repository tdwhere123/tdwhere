import { islandAt, lightAt, type Clock, type Light, type Rgb, type Weather } from '../../weather'

export function weatherProfile(weather: Weather, light: Light) {
  return {
    rain: weather.sky === 'rain' ? weather.strength : 0,
    snow: weather.sky === 'snow' ? weather.strength : 0,
    mist: weather.sky === 'mist' ? weather.strength : 0,
    wind: weather.sky === 'wind' ? 1 + weather.strength : 0.25,
    lean: weather.lean,
    exposure: 0.55 + light.sun * 0.45,
    glint: 0.1 + light.sun * 0.9,
    glintTint: [...light.light] as Rgb,
    tint: light.light.map((channel) => 0.82 + channel * 0.18) as Rgb,
  }
}

/** Numbers, colors and records of them, part of the way from a to b. */
function blend<T>(a: T, b: T, t: number): T {
  if (typeof a === 'number') return (a + ((b as number) - a) * t) as T
  if (Array.isArray(a)) return a.map((v, i) => blend(v, (b as unknown[])[i], t)) as T
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(a as object)) out[k] = blend(v, (b as Record<string, unknown>)[k], t)
  return out as T
}

/** The island's sky at a real moment: one spell easing into the next. */
export function islandSky(clock: Clock, now: number) {
  const { weather, next, turn } = islandAt(clock, now)
  const a = lightAt(weather),
    b = lightAt(next),
    light = blend(a, b, turn),
    shown = turn < 0.5 ? weather : next
  return {
    weather: shown,
    light,
    profile: blend(weatherProfile(weather, a), weatherProfile(next, b), turn),
    sun: sunVector(shown, light),
  }
}

/** The camera pulls back this far from the first framing, so the water fills about a quarter of the screen. */
export const PULL_BACK = 1.12

export function viewSpan(width: number, height: number) {
  const acceptedSpan = width < 650 ? 12 : 17.3
  // invariant: at 30° elevation the water's lower bound stays above 75% viewport height.
  const minimumVerticalSpan = 7.8
  return Math.max((acceptedSpan / 1.28) * PULL_BACK, minimumVerticalSpan * width / Math.max(1, height))
}

const smoothstep = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

export function transitionState(elapsed: number, enteredAt: number | null, paintedAt: number | null) {
  if (enteredAt === null) return { sink: 0, reveal: 0, done: false }
  const sink = smoothstep((elapsed - enteredAt) / 1.5)
  const reveal = paintedAt === null ? 0 : smoothstep((elapsed - Math.max(enteredAt + 0.7, paintedAt)) / 1.4)
  return { sink, reveal, done: sink === 1 && reveal === 1 }
}


export function sunVector(weather: Weather, light: Light): [number, number, number] {
  const hour = ((weather.hour % 24) + 24) % 24
  const arc = Math.max(0, Math.min(1, (hour - 6.5) / 12))
  const moon = hour < 5 || hour >= 21.5
  const x = moon ? light.from[0] * 0.22 : Math.cos(arc * Math.PI) * 0.34
  const y = moon ? 0.38 : 0.25 + Math.sin(arc * Math.PI) * 0.65
  const z = -0.94
  const length = Math.hypot(x, y, z)
  return [x / length, y / length, z / length]
}
