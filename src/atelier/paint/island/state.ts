import type { Light, Rgb, Weather } from '../../weather'

export function weatherProfile(weather: Weather, light: Light) {
  return {
    rain: weather.sky === 'rain',
    snow: weather.sky === 'snow',
    mist: weather.sky === 'mist' ? weather.strength : 0,
    wind: weather.sky === 'wind' ? 1 + weather.strength : 0.25,
    exposure: 0.45 + light.sun * 0.55,
    glint: 0.1 + light.sun * 0.9,
    glintTint: [...light.light] as Rgb,
    tint: light.light.map((channel) => 0.82 + channel * 0.18) as Rgb,
    precipitationSpeed: weather.sky === 'snow' ? 0.25 : 1,
  }
}

export function viewSpan(width: number, height: number) {
  const acceptedSpan = width < 650 ? 12 : 17.3
  // invariant: at 22° elevation the water's lower bound stays above 75% viewport height.
  const minimumVerticalSpan = 5.6
  return Math.max(acceptedSpan / 1.28, minimumVerticalSpan * width / Math.max(1, height))
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
