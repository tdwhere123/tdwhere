import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildCoot } from './coot'
import { greetBird, stepFlock, type Bird, type Mode } from './birds'

function model() {
  const root = new THREE.Group(), rig = new THREE.Group(), head = new THREE.Bone()
  rig.scale.setScalar(.125)
  rig.rotation.x = -Math.PI / 2
  head.name = 'head_pivot'
  head.position.set(.47, 0, .63)
  rig.add(head)
  root.add(rig)
  return root
}
const bird = (mode: Mode = 'swim', t = 0): Bird => ({ x: 1, z: 2, heading: 0, speed: .07, mode, t, under: 1, perch: 0, phase: 0 })
const flat = { height: 0, dx: 0, dz: 0 }, perches = [new THREE.Vector3(-1, .1, -.6)]

describe('authored coot pose', () => {
  it('keeps the authored head rest pose and pumps in world-forward units, independently per bird', () => {
    const template = model(), first = buildCoot(template), second = buildCoot(template)
    const head = first.group.getObjectByName('head_pivot')!
    first.update(bird(), 0, flat, perches)
    const rest = head.getWorldPosition(new THREE.Vector3())
    first.update(bird(), Math.PI / 18, flat, perches)
    const pumped = head.getWorldPosition(new THREE.Vector3())
    expect(pumped.x - rest.x).toBeCloseTo(.006)
    expect(pumped.y).toBeCloseTo(rest.y)
    expect(pumped.z).toBeCloseTo(rest.z)
    expect(second.group.getObjectByName('head_pivot')!.position.x).toBe(.47)
    expect(template.getObjectByName('head_pivot')!.position.x).toBe(.47)
  })
  it('dives bill-first, disappears under water, and restores its pose on resurfacing', () => {
    const coot = buildCoot(model())
    coot.update(bird('dive', .2), 0, flat, perches)
    coot.group.updateMatrixWorld(true)
    const bill = coot.group.localToWorld(new THREE.Vector3(.12, 0, 0))
    const tail = coot.group.localToWorld(new THREE.Vector3(-.12, 0, 0))
    expect(bill.y).toBeLessThan(tail.y)
    expect(coot.group.visible).toBe(true)
    coot.update(bird('dive', .31), 0, flat, perches)
    expect(coot.group.visible).toBe(false)
    coot.update(bird(), 0, flat, perches)
    expect(coot.group.visible).toBe(true)
    expect(coot.group.rotation.z).toBeCloseTo(0)
  })
  it('preserves swim, dive and pontoon boarding poses', () => {
    const coot = buildCoot(model())
    for (const mode of ['swim', 'flee', 'board'] as const) {
      coot.update(bird(mode), 0, flat, perches)
      expect(coot.group.position.toArray()).toEqual([1, -.015, 2])
    }
    for (const [mode, time, position] of [
      ['perch', 0, perches[0]], ['hop', .35, perches[0]],
      ['hop', 0, new THREE.Vector3(1, -.015, 2)],
    ] as const) {
      coot.update(bird(mode, time), 0, flat, perches)
      expect(coot.group.position.distanceTo(position)).toBeLessThan(1e-8)
    }
  })
  it('glances with its skinned head, stays visible, and restores the authored head rotation', () => {
    const coot = buildCoot(model()), state = bird()
    const head = coot.group.getObjectByName('head_pivot')!
    const rest = head.quaternion.clone()
    greetBird(state)
    let last = rest.clone(), maxAngle = 0
    for (let i = 0; i <= 144; i++) {
      state.t = i / 60
      coot.update(state, state.t, flat, perches)
      expect(coot.group.visible).toBe(true)
      expect(coot.group.position.y).toBe(-.015)
      expect(last.angleTo(head.quaternion)).toBeLessThan(.03)
      maxAngle = Math.max(maxAngle, rest.angleTo(head.quaternion))
      last = head.quaternion.clone()
    }
    expect(maxAngle).toBeGreaterThan(.25)
    expect(rest.angleTo(head.quaternion)).toBeLessThan(1e-7)
  })
  it('can greet on the first perched frame without stale water coordinates', () => {
    const state = bird('hop', .34)
    const pond = { random: () => .5, running: 0, wheels: [], center: [0, 0] as [number, number], perches: [[perches[0].x, perches[0].z] as [number, number]] }
    stepFlock([state], 1 / 60, pond)
    expect(state.mode).toBe('perch')
    const coot = buildCoot(model())
    coot.update(state, 0, flat, perches)
    const before = coot.group.position.clone()
    greetBird(state)
    coot.update(state, 0, flat, perches)
    expect(coot.group.position.distanceTo(before)).toBeLessThan(1e-8)
  })
  it('leaves the pontoon continuously without a final position or heading snap', () => {
    const coot = buildCoot(model()), state = bird('perch')
    state.x = perches[0].x; state.z = perches[0].z; state.speed = 0
    const pond = { random: () => .5, running: 0, wheels: [], center: [0, 0] as [number, number], perches: [[state.x, state.z] as [number, number]] }
    coot.update(state, 0, flat, perches)
    greetBird(state)
    let previous = coot.group.position.clone()
    let previousStep = new THREE.Vector2(), previousWorldStep = new THREE.Vector3()
    for (let i = 0; i < 240; i++) {
      const before = { ...state }
      stepFlock([state], 1 / 60, pond)
      coot.update(state, i / 60, flat, perches)
      const displacement = new THREE.Vector2(state.x - before.x, state.z - before.z)
      expect(displacement.distanceTo(previousStep)).toBeLessThan(.0003)
      previousStep = displacement
      const worldStep = coot.group.position.clone().sub(previous)
      expect(worldStep.distanceTo(previousWorldStep)).toBeLessThan(.001)
      previousWorldStep = worldStep
      expect(coot.group.visible).toBe(true)
      expect(coot.group.position.distanceTo(previous)).toBeLessThan(.025)
      expect(Math.hypot(state.x - before.x, state.z - before.z)).toBeLessThan(.006)
      expect(Math.abs(state.heading - before.heading)).toBeLessThan(.027)
      expect(Math.abs(state.speed - before.speed)).toBeLessThan(.01)
      previous = coot.group.position.clone()
    }
    expect(state.perch).toBe(-1)
    expect(state.mode).toBe('swim')
  })
})
