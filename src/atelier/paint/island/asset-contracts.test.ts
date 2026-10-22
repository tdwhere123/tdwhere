import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { AERATOR, LAMP, PERCHES, aeratorAxis, buildAerator, wheelSpots } from './aerator'
import { disposeModelResources } from './models'

// @anchor:binary-asset-contract Tests use shipped geometry/transforms; GPU texture decoding requires separate browser QA, not this CPU parse.
async function geometryFromAsset(name: string) {
  const bytes = await readFile(`public/models/${name}-painterly.glb`)
  const jsonLength = bytes.readUInt32LE(12)
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString())
  const bin = bytes.subarray(28 + jsonLength)
  for (const mesh of json.meshes) for (const primitive of mesh.primitives) delete primitive.material
  const encoded = Buffer.from(JSON.stringify(json))
  const padded = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 32)
  encoded.copy(padded)
  const glb = Buffer.alloc(28 + padded.length + bin.length)
  glb.writeUInt32LE(0x46546c67, 0); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(glb.length, 8)
  glb.writeUInt32LE(padded.length, 12); glb.writeUInt32LE(0x4e4f534a, 16); padded.copy(glb, 20)
  glb.writeUInt32LE(bin.length, 20 + padded.length); glb.writeUInt32LE(0x004e4942, 24 + padded.length); bin.copy(glb, 28 + padded.length)
  const asset = await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength), '')
  return { root: asset.scene, json }
}

describe('shipped aerator asset and runtime contract', () => {
  it('keeps its four shaft pivots, lamp and float decks in lake units', async () => {
    const { root, json } = await geometryFromAsset('aerator')
    root.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(root)
    expect(bounds.min.x).toBeCloseTo(-.62, 4)
    expect(bounds.max.x).toBeCloseTo(.62, 4)
    const lamp = root.getObjectByName('Lamp')!.getWorldPosition(new THREE.Vector3())
    expect(lamp.distanceTo(new THREE.Vector3(...LAMP))).toBeLessThan(.003)
    const machine = buildAerator(root)
    machine.group.updateMatrixWorld(true)
    for (let i = 0; i < 4; i++) {
      const wheel = root.getObjectByName(`wheel_${i}`)!
      const world = wheel.getWorldPosition(new THREE.Vector3())
      expect(world.x).toBeCloseTo(wheelSpots[i][0])
      expect(world.z).toBeCloseTo(wheelSpots[i][1])
      const shaft = new THREE.Vector3(1, 0, 0).applyQuaternion(wheel.getWorldQuaternion(new THREE.Quaternion()))
      expect(shaft.distanceTo(new THREE.Vector3(aeratorAxis[0], 0, aeratorAxis[1]))).toBeLessThan(1e-6)
      const before = wheel.rotation.x
      machine.update(1, .1, 1, { height: 0, pitch: 0, roll: 0 })
      expect(wheel.rotation.x).toBeLessThan(before)
      const stopped = wheel.rotation.x
      machine.update(1, .1, 0, { height: 0, pitch: 0, roll: 0 })
      expect(wheel.rotation.x).toBe(stopped)
    }
    expect(json.images.length).toBe(9)
    for (const material of json.materials) if (material.name !== 'lamp_glow') expect(material.pbrMetallicRoughness.baseColorTexture).toBeDefined()
    for (const [x, y, z] of PERCHES) {
      const ray = new THREE.Raycaster(new THREE.Vector3(x, y + .05, z), new THREE.Vector3(0, -1, 0))
      root.updateMatrixWorld(true)
      // Test decks in their own frame, independently of the lake placement.
      const worldOrigin = machine.group.localToWorld(ray.ray.origin.clone())
      ray.set(worldOrigin, new THREE.Vector3(0, -1, 0))
      const hit = ray.intersectObject(root, true)[0]
      expect(hit).toBeDefined()
      expect(Math.abs(machine.group.worldToLocal(hit.point).y - y)).toBeLessThan(.025)
    }
    machine.group.updateMatrixWorld(true)
    const ray = new THREE.Raycaster(new THREE.Vector3(AERATOR.x, 3, AERATOR.z), new THREE.Vector3(0, -1, 0))
    expect(machine.hit(ray)).toBe(true)
    ray.set(new THREE.Vector3(20, 3, 20), new THREE.Vector3(0, -1, 0))
    expect(machine.hit(ray)).toBe(false)
    disposeModelResources(machine.group)
  })
})

describe('shipped coot asset and runtime contract', () => {
  it('keeps the accepted scale, skinned head, painted atlas and independent nine-bird rigs', async () => {
    const { buildCoot } = await import('./coot')
    const { root, json } = await geometryFromAsset('coot')
    root.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(root)
    expect(bounds.max.x - bounds.min.x).toBeGreaterThan(.24)
    expect(bounds.max.x - bounds.min.x).toBeLessThan(.27)
    expect(bounds.min.y).toBeGreaterThan(-.02)
    expect(bounds.max.y).toBeLessThan(.11)
    const pivot = root.getObjectByName('head_pivot')!
    expect(pivot).toBeInstanceOf(THREE.Bone)
    expect(pivot.getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(.05875, .045, 0))).toBeLessThan(1e-6)
    expect(json.skins.length).toBeGreaterThan(0)
    expect(json.materials.some((m: { alphaMode?: string; pbrMetallicRoughness?: { baseColorTexture?: unknown } }) => m.alphaMode !== 'BLEND' && m.pbrMetallicRoughness?.baseColorTexture)).toBe(true)
    expect(json.materials.filter((m: { alphaMode?: string }) => m.alphaMode === 'BLEND').length).toBeLessThanOrEqual(2)
    const flock = Array.from({ length: 9 }, () => buildCoot(root))
    const heads = flock.map(coot => coot.group.getObjectByName('head_pivot')!)
    expect(new Set(heads).size).toBe(9)
    const meshes: THREE.SkinnedMesh[] = []
    for (const coot of flock) coot.group.traverse(object => { if (object instanceof THREE.SkinnedMesh) meshes.push(object) })
    expect(meshes.length).toBeGreaterThanOrEqual(9)
    const first = meshes[0], matching = meshes.find(mesh => mesh !== first && mesh.name === first.name)!
    expect(first.geometry).toBe(matching.geometry)
    expect(first.material).toBe(matching.material)
    expect(first.skeleton).not.toBe(matching.skeleton)
    const rest = heads[0].getWorldPosition(new THREE.Vector3())
    flock[0].update({ x: 0, z: 0, heading: 0, speed: .07, mode: 'swim', t: 0, under: 1, perch: -1, phase: 0 }, Math.PI / 18, { height: .015, dx: 0, dz: 0 }, [])
    expect(heads[0].getWorldPosition(new THREE.Vector3()).x - rest.x).toBeCloseTo(.006)
    expect(heads[1].position.toArray()).toEqual(pivot.position.toArray())
    const restRotation = heads[0].getWorldQuaternion(new THREE.Quaternion())
    flock[0].update({ x: 0, z: 0, heading: 0, speed: .07, mode: 'greet', t: .325, under: 1, perch: -1, phase: 0, greeting: { heading: 0, turn: .6 } }, Math.PI / 18, { height: .015, dx: 0, dz: 0 }, [])
    const rotation = heads[0].getWorldQuaternion(new THREE.Quaternion()).multiply(restRotation.clone().invert())
    expect(rotation.angleTo(new THREE.Quaternion())).toBeCloseTo(.28)
    expect(new THREE.Vector3(0, 1, 0).applyQuaternion(rotation).distanceTo(new THREE.Vector3(0, 1, 0))).toBeLessThan(1e-6)
    expect(heads[1].quaternion.toArray()).toEqual(pivot.quaternion.toArray())
    disposeModelResources(root, ...flock.map(coot => coot.group))
  })
})
