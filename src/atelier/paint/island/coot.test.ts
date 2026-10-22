import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildCoot } from './coot'
import type { Bird, Mode } from './birds'

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
  it('preserves all seven behavior poses and the pontoon hop/leave endpoints', () => {
    const coot = buildCoot(model())
    for (const mode of ['swim', 'flee', 'board'] as const) {
      coot.update(bird(mode), 0, flat, perches)
      expect(coot.group.position.toArray()).toEqual([1, -.015, 2])
    }
    for (const [mode, time, position] of [
      ['perch', 0, perches[0]], ['hop', .35, perches[0]], ['leave', 0, perches[0]],
      ['hop', 0, new THREE.Vector3(1, -.015, 2)], ['leave', .35, new THREE.Vector3(1, -.015, 2)],
    ] as const) {
      coot.update(bird(mode, time), 0, flat, perches)
      expect(coot.group.position.distanceTo(position)).toBeLessThan(1e-8)
    }
  })
})
