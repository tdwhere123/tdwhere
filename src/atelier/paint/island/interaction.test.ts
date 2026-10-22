import { describe, expect, it } from 'vitest'
import { pickBird, PondGesture } from './interaction'
import { greetBird, makeFlock, stepFlock } from './birds'
import { randomSource } from './math'

describe('deliberate pond interactions', () => {
  it('picks the nearest visible bird with a touch-sized target', () => {
    const birds = [{ x: 100, y: 100, visible: true }, { x: 110, y: 100, visible: true }, { x: 111, y: 100, visible: false }]
    expect(pickBird(birds, 114, 110)).toBe(1)
    expect(pickBird(birds, 134, 100)).toBe(-1)
  })
  it('keeps taps distinct from drags, including moving out and back', () => {
    const gesture = new PondGesture(1, 20, 30)
    gesture.move(2, 100, 100)
    expect(gesture.finish(2)).toBe(false)
    gesture.move(1, 25, 31)
    expect(gesture.finish(1)).toBe(true)
    gesture.move(1, 40, 30)
    gesture.move(1, 20, 30)
    expect(gesture.finish(1)).toBe(false)
  })
  it('greets only the selected bird, keeps motion continuous, and ignores repeated taps until settled', () => {
    const birds = makeFlock(randomSource(5), [0, 0], 2, 0), bird = birds[0]
    const initial = { ...bird }, other = { ...birds[1] }
    expect(greetBird(bird)).toBe('greet')
    expect(bird.heading).toBe(initial.heading)
    expect(bird.speed).toBe(initial.speed)
    expect(birds[1]).toEqual(other)
    const pond = { random: randomSource(1), running: 1, wheels: [], center: [0, 0] as [number, number], perches: [] }
    let maxSpeed = bird.speed
    for (let i = 0; i < 180; i++) {
      const before = { ...bird }
      if (bird.mode === 'greet') {
        expect(greetBird(bird)).toBe(null)
        expect(bird.t).toBe(before.t)
      }
      stepFlock([bird], 1 / 60, pond)
      const turn = Math.atan2(Math.sin(bird.heading - before.heading), Math.cos(bird.heading - before.heading))
      expect(Math.abs(turn)).toBeLessThanOrEqual(1.6 / 60 + 1e-8)
      expect(Math.abs(bird.speed - before.speed)).toBeLessThan(.01)
      expect(Math.hypot(bird.x - before.x, bird.z - before.z)).toBeLessThan(.004)
      expect(bird.mode).not.toBe('dive')
      maxSpeed = Math.max(maxSpeed, bird.speed)
    }
    expect(maxSpeed).toBeGreaterThan(.09)
    expect(maxSpeed).toBeLessThan(.16)
    expect(bird.mode).toBe('swim')
    expect(greetBird(bird)).toBe('greet')
  })
  it('a perched bird goes back into the water rather than diving through the machine', () => {
    const [bird] = makeFlock(randomSource(5), [0, 0], 1, 1)
    expect(greetBird(bird)).toBe('leave')
    expect(bird.mode).toBe('leave')
    expect(greetBird(bird)).toBe(null)
  })
})
