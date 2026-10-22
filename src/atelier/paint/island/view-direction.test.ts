import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { waterViewDirection } from './render-math'

describe('orthographic water view', () => {
  for (const yaw of [-.35, 0, 1.2, Math.PI]) {
    it(`keeps reflected trails screen-vertical at yaw ${yaw}`, () => {
      const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, .1, 40)
      const offset = new THREE.Vector3(Math.sin(yaw) * 10, 6, Math.cos(yaw) * 10)
      const first = new THREE.Vector3()
      for (const look of [new THREE.Vector3(), new THREE.Vector3(-1.3, 0, -.6)]) {
        camera.position.copy(offset).add(look)
        camera.lookAt(look)
        camera.updateMatrixWorld()
        const view = waterViewDirection(camera, new THREE.Vector3())
        expect(view.length()).toBeCloseTo(1)
        if (first.lengthSq()) expect(view.distanceTo(first)).toBeLessThan(1e-12)
        else first.copy(view)
        const origin = new THREE.Vector3(-2, 0, -.5)
        const alongWater = new THREE.Vector3(view.x, 0, view.z).normalize()
        const start = origin.clone().project(camera)
        const end = origin.add(alongWater).project(camera)
        expect(end.x).toBeCloseTo(start.x, 12)
        expect(end.y).toBeLessThan(start.y)
      }
    })
  }
})
