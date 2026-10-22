import { waterField, randomSource } from './math'
import type { RainTiming } from './render-math'

export type RainSeed = RainTiming & { id: number }
export type RainImpact = { x: number; z: number; time: number }
const FALL_FRACTION = .52
export const SPLASH_CAPACITY = 32, SPLASH_TTL = .32

function landing(seed: RainSeed, cycle: number) {
  const random = randomSource((Math.imul(seed.id + 1, 73856093) ^ Math.imul(cycle + 1, 19349663)) >>> 0)
  for (let i = 0; i < 64; i++) {
    const x = (random() - .5) * 11, z = (random() - .5) * 9
    // invariant: the expanding .16-world-unit contact stays inside the painted shoreline.
    if (waterField(x, z) > .4) return { x, z }
  }
  return { x: 2, z: 0 }
}

export function rainFlight(time: number, seed: RainSeed) {
  const clock = time * .45 * seed.speed + seed.phase, cycle = Math.floor(clock), phase = clock - cycle
  return { ...landing(seed, cycle), falling: phase < FALL_FRACTION, y: Math.max(0, 1 - phase / FALL_FRACTION) * 2.8 }
}

export function rainImpacts(before: number, now: number, seed: RainSeed): RainImpact[] {
  const rate = .45 * seed.speed, first = Math.floor(before * rate + seed.phase - FALL_FRACTION) + 1
  const last = Math.floor(now * rate + seed.phase - FALL_FRACTION), impacts: RainImpact[] = []
  for (let cycle = first; cycle <= last; cycle++) impacts.push({ ...landing(seed, cycle), time: (cycle + FALL_FRACTION - seed.phase) / rate })
  return impacts
}

export function rainHalfWidth(horizontalSpan: number, cssWidth: number) {
  if (!Number.isFinite(horizontalSpan) || !Number.isFinite(cssWidth) || horizontalSpan <= 0 || cssWidth <= 0) return .007
  return Math.max(.007, .65 * horizontalSpan / Math.max(1, cssWidth))
}

export class SplashPool {
  private events: RainImpact[] = []
  add(impact: RainImpact) {
    this.events.push(impact)
    if (this.events.length > SPLASH_CAPACITY) this.events.shift()
  }
  active(time: number) {
    this.events = this.events.filter(event => time - event.time < SPLASH_TTL)
    return this.events.filter(event => event.time <= time)
  }
}
