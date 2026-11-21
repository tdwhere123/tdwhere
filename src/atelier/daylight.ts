/**
 * The light on the home painting follows the visitor's own hour: cool at dawn, plain at midday,
 * gold toward evening, moonlit after dark. No seasons, no weather, and no words for any of it.
 */
export type Rgb = [number, number, number]

export type Light = {
  /** The site's paper by day, its night after dark. */
  paper: Rgb
  /** Shallow and deep water. */
  water: Rgb
  deep: Rgb
  /** Color of the light. */
  light: Rgb
  /** 0 is moonless dark, 1 full day. */
  sun: number
}

/** The light through a day, keyed by hour; the last key wraps to the first. */
const day: [number, Light][] = [
  [0, { paper: [0.075, 0.13, 0.18], water: [0.2, 0.28, 0.44], deep: [0.07, 0.11, 0.24], light: [0.7, 0.8, 0.9], sun: 0 }],
  [5, { paper: [0.13, 0.18, 0.25], water: [0.25, 0.32, 0.48], deep: [0.1, 0.14, 0.3], light: [0.76, 0.8, 0.88], sun: 0.1 }],
  [6.5, { paper: [0.95, 0.915, 0.87], water: [0.5, 0.56, 0.74], deep: [0.18, 0.22, 0.46], light: [1, 0.82, 0.7], sun: 0.55 }],
  [9, { paper: [0.955, 0.93, 0.885], water: [0.38, 0.51, 0.71], deep: [0.11, 0.2, 0.41], light: [1, 0.96, 0.88], sun: 0.85 }],
  [13, { paper: [0.953, 0.933, 0.89], water: [0.34, 0.49, 0.7], deep: [0.1, 0.18, 0.4], light: [1, 1, 0.95], sun: 1 }],
  [16.5, { paper: [0.95, 0.925, 0.875], water: [0.39, 0.5, 0.69], deep: [0.12, 0.18, 0.39], light: [1, 0.9, 0.74], sun: 0.85 }],
  [18.5, { paper: [0.93, 0.89, 0.83], water: [0.44, 0.5, 0.72], deep: [0.16, 0.18, 0.42], light: [1, 0.72, 0.48], sun: 0.55 }],
  [20, { paper: [0.18, 0.24, 0.32], water: [0.32, 0.4, 0.6], deep: [0.12, 0.16, 0.34], light: [0.9, 0.72, 0.6], sun: 0.15 }],
  [21.5, { paper: [0.08, 0.14, 0.19], water: [0.22, 0.3, 0.46], deep: [0.08, 0.12, 0.25], light: [0.72, 0.8, 0.92], sun: 0 }],
]

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

/** The visitor's hour, 0–24. */
export function localHour(date = new Date()) {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600
}

/** The light at an hour, eased between the keys around it. */
export function lightAt(hour: number): Light {
  const h = ((hour % 24) + 24) % 24
  let i = day.length - 1
  while (i > 0 && day[i][0] > h) i--
  const [h0, a] = day[i],
    [h1, b] = day[(i + 1) % day.length]
  const t = Math.min(1, Math.max(0, (h - h0) / (((h1 - h0 + 24) % 24) || 24)))
  const k = t * t * (3 - 2 * t)
  return {
    paper: mix(a.paper, b.paper, k),
    water: mix(a.water, b.water, k),
    deep: mix(a.deep, b.deep, k),
    light: mix(a.light, b.light, k),
    sun: a.sun + (b.sun - a.sun) * k,
  }
}

/** Where the light comes from across the painting (screen space, y up): the sun's arc, or the moon. */
export function sunFrom(hour: number): [number, number] {
  const h = ((hour % 24) + 24) % 24
  if (h < 5 || h >= 21.5) return [0.08, 0.38]
  const arc = Math.max(0, Math.min(1, (h - 6.5) / 12))
  return [Math.cos(arc * Math.PI) * 0.34, 0.25 + Math.sin(arc * Math.PI) * 0.65]
}
