import { waterField } from './math'

/**
 * The coots from the home photograph. They paddle about in a loose flock,
 * keep off the turning wheels and each other, scatter from a touch, and now
 * and then one dives and comes up somewhere else. While the aerator stands
 * still they climb onto its pontoons; a touch near them sends them back in.
 */
export type Mode = 'swim' | 'greet' | 'flee' | 'dive' | 'board' | 'hop' | 'perch' | 'leave'
export type Bird = {
  x: number
  z: number
  /** Facing, in radians on the water's plane: (cos, sin) is forward. */
  heading: number
  speed: number
  mode: Mode
  /** Seconds in the present mode. */
  t: number
  /** How long a dive lasts. */
  under: number
  /** The perch it is going to, standing on, or leaving. */
  perch: number
  /** For the head's pumping and the wander. */
  phase: number
  greeting?: { heading: number; turn: number }
}
export type Pond = {
  random: () => number
  /** 0 stopped … 1 at full speed. */
  running: number
  wheels: readonly [number, number][]
  /** The aerator's middle, and each perch on its pontoons, on the water's plane. */
  center: readonly [number, number]
  perches: readonly [number, number][]
}
/** What a flock's step did to the water: rings where a bird went under or came up. */
export type Splash = { x: number; z: number; strength: number }

export const LEAVE_SECONDS = 1.2

const CRUISE = 0.07,
  FLEE = 0.55,
  /** A bird keeps this far inside the shore. */
  SHORE = 0.6,
  /** And this far from a turning wheel. */
  WHEEL_ROOM = 0.5,
  ROOM = 0.26,
  HOP = 0.35

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const toward = (from: number, to: number, rate: number) => from + Math.max(-rate, Math.min(rate, wrap(to - from)))

export function makeFlock(random: () => number, around: [number, number], count = 9, perched = 2): Bird[] {
  const birds: Bird[] = []
  while (birds.length < count) {
    const a = random() * Math.PI * 2,
      r = 0.4 + random() * 1.8
    const x = around[0] + Math.cos(a) * r * 1.3,
      z = around[1] + Math.sin(a) * r * 0.8
    if (waterField(x, z) < SHORE + 0.2) continue
    birds.push({ x, z, heading: random() * Math.PI * 2, speed: CRUISE, mode: 'swim', t: random() * 5, under: 0, perch: -1, phase: random() * 10 })
  }
  for (let i = 0; i < perched && i < birds.length; i++) Object.assign(birds[i], { mode: 'perch', perch: i, speed: 0 })
  return birds
}

/** Birds within `radius` of a touch scatter from it; with `dive`, the nearest may go under instead. */
export function startle(birds: Bird[], x: number, z: number, random: () => number, radius = 1.1, dive = true) {
  let nearest: Bird | undefined,
    best = radius * 0.55
  for (const b of birds) {
    const d = Math.hypot(b.x - x, b.z - z)
    if (d > radius || b.mode === 'dive') continue
    if (b.mode === 'perch' || b.mode === 'board' || b.mode === 'hop') {
      if (b.mode === 'perch') Object.assign(b, { mode: 'leave', t: 0 })
      continue
    }
    Object.assign(b, { mode: 'flee', t: 0, heading: Math.atan2(b.z - z, b.x - x) + (random() - 0.5) * 0.6, speed: FLEE * (1 - (d / radius) * 0.5) })
    if (d < best) {
      best = d
      nearest = b
    }
  }
  if (dive && nearest && random() < 0.6) Object.assign(nearest, { mode: 'dive', t: 0, under: 2.2 + random() * 1.8 })
}

export function greetBird(bird: Bird): 'greet' | 'leave' | null {
  if (bird.mode === 'greet' || bird.mode === 'dive' || bird.mode === 'leave' || bird.mode === 'hop') return null
  if (bird.mode === 'perch') {
    Object.assign(bird, { mode: 'leave', t: 0 })
    return 'leave'
  }
  Object.assign(bird, { mode: 'greet', t: 0, perch: -1, greeting: { heading: bird.heading, turn: Math.sin(bird.phase) >= 0 ? .6 : -.6 } })
  return 'greet'
}

/** One step of the flock. Returns the rings it made on the water. */
export function stepFlock(birds: Bird[], dt: number, pond: Pond): Splash[] {
  const splashes: Splash[] = [],
    { random } = pond
  const taken = new Set(birds.filter((b) => b.perch >= 0).map((b) => b.perch))
  let cx = 0,
    cz = 0,
    n = 0
  for (const b of birds)
    if (b.mode === 'swim') {
      cx += b.x
      cz += b.z
      n++
    }
  for (const b of birds) {
    b.t += dt
    if (b.mode === 'perch') {
      const [px, pz] = pond.perches[b.perch]
      b.x = px
      b.z = pz
      b.heading += Math.sin(b.t * 0.4 + b.phase) * dt * 0.3
      continue
    }
    if (b.mode === 'hop' || b.mode === 'leave') {
      if (b.mode === 'leave') {
        const [px, pz] = pond.perches[b.perch]
        const out = Math.atan2(pz - pond.center[1], px - pond.center[0])
        b.heading = toward(b.heading, out, dt * 1.6)
        if (Math.abs(wrap(out - b.heading)) > .001) { b.t = 0; continue }
        b.speed += (.14 - b.speed) * Math.min(1, dt * 4)
        b.x += Math.cos(b.heading) * b.speed * dt
        b.z += Math.sin(b.heading) * b.speed * dt
        if (b.t >= LEAVE_SECONDS) {
          Object.assign(b, { mode: 'swim', t: 0, perch: -1 })
          splashes.push({ x: b.x, z: b.z, strength: 0.6 })
        }
      } else if (b.t >= HOP) {
        const [x, z] = pond.perches[b.perch]
        Object.assign(b, { mode: 'perch', t: 0, speed: 0, x, z })
      }
      continue
    }
    if (b.mode === 'dive') {
      if (b.t >= b.under) {
        // comes up a little way on, still on the water
        let x = b.x + Math.cos(b.heading) * 0.9,
          z = b.z + Math.sin(b.heading) * 0.9
        if (waterField(x, z) < SHORE) {
          x = b.x
          z = b.z
        }
        Object.assign(b, { mode: 'swim', t: 0, x, z, speed: CRUISE })
        splashes.push({ x, z, strength: 0.7 })
      } else if (b.t - dt < 0.25 && b.t >= 0.25) splashes.push({ x: b.x, z: b.z, strength: 0.8 })
      continue
    }

    let want = b.heading + Math.sin(b.t * 0.7 + b.phase) * 0.6 * dt
    if (b.mode === 'greet' && b.greeting) {
      const k = Math.max(0, Math.min(1, (b.t - .25) / 1.2))
      want = b.greeting.heading + b.greeting.turn * k * k * (3 - 2 * k)
    }
    // home in on a free perch while the wheels are still
    if (b.mode === 'board') {
      const [px, pz] = pond.perches[b.perch],
        d = Math.hypot(px - b.x, pz - b.z)
      if (pond.running > 0.3) Object.assign(b, { mode: 'swim', perch: -1 })
      else if (d < 0.14) {
        Object.assign(b, { mode: 'hop', t: 0 })
        continue
      } else want = Math.atan2(pz - b.z, px - b.x)
    } else if (b.mode === 'swim' && pond.running < 0.1 && random() < dt * 0.06) {
      const free = pond.perches.findIndex((_, i) => !taken.has(i))
      if (free >= 0) {
        Object.assign(b, { mode: 'board', perch: free })
        taken.add(free)
      }
    }
    if (b.mode === 'swim' && n > 1) want = toward(want, Math.atan2(cz / n - b.z, cx / n - b.x), dt * 0.15)
    for (const o of birds) {
      if (o === b || o.mode === 'dive' || o.mode === 'perch') continue
      const d = Math.hypot(o.x - b.x, o.z - b.z)
      if (d < ROOM && d > 0) want = toward(want, Math.atan2(b.z - o.z, b.x - o.x), dt * 2.5)
    }
    if (b.mode !== 'board' && pond.running > 0.1)
      for (const [wx, wz] of pond.wheels) {
        const d = Math.hypot(wx - b.x, wz - b.z)
        if (d < WHEEL_ROOM) want = toward(want, Math.atan2(b.z - wz, b.x - wx), dt * 3 * pond.running)
      }
    // turn back from the shore toward open water
    const ahead = waterField(b.x + Math.cos(b.heading) * 0.4, b.z + Math.sin(b.heading) * 0.4)
    if (ahead < SHORE) want = toward(want, Math.atan2(-b.z, -b.x), dt * 3)
    b.heading = toward(b.heading, want, dt * (b.mode === 'flee' ? 4 : 1.6))
    if (b.mode === 'greet') {
      const k = Math.min(1, b.t / 2.4)
      const speed = CRUISE + .08 * Math.sin(Math.PI * k) ** 2
      b.speed += (speed - b.speed) * Math.min(1, dt * 4)
      if (b.t >= 2.4) { b.mode = 'swim'; b.greeting = undefined }
    } else if (b.mode === 'flee') {
      b.speed += (CRUISE - b.speed) * Math.min(1, dt * 1.6)
      if (b.t > 1.8) b.mode = 'swim'
    } else b.speed += ((b.mode === 'board' ? 0.12 : CRUISE) * (0.7 + 0.3 * Math.sin(b.t * 0.5 + b.phase)) - b.speed) * Math.min(1, dt)
    const x = b.x + Math.cos(b.heading) * b.speed * dt,
      z = b.z + Math.sin(b.heading) * b.speed * dt
    if (waterField(x, z) > 0.2 || b.mode === 'board') {
      b.x = x
      b.z = z
    }
  }
  return splashes
}
