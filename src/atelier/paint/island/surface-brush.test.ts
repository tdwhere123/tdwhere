import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { WATER_BRUSH_GLSL, WATER_BRUSH_WORLD_SCALE } from './surface-brush'

const overture = readFileSync(new URL('../overture.ts', import.meta.url), 'utf8')

describe('surface brush coordinate contract', () => {
  it('takes surface coordinates without a screen or time dependent pigment field', () => {
    expect(WATER_BRUSH_GLSL).toContain('waterBrush(vec2 surface)')
    expect(WATER_BRUSH_GLSL).not.toMatch(/vUv|resolution|camera|\btime\b/)
    expect(overture).toContain('col+=waterBrush(vWorld.xz);')
  })
  it('applies procedural brush only to water, not the object-UV models or final scene image', () => {
    const post = overture.slice(overture.indexOf('const postMaterial'), overture.indexOf('postScene.add'))
    expect(post).not.toContain('waterBrush(')
    expect(post).not.toContain('float worked=')
    expect(post).not.toContain('float height=lum(sharp)')
    expect(post).not.toContain('ground(vUv+along*k)')
    expect(post).toContain('if(reveal>0.)')
  })
  for (const yaw of [-.35, 1.2]) for (const zoom of [1, 3]) {
    it(`recovers the same water pigment at yaw ${yaw}, zoom ${zoom}`, () => {
      const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, .1, 40)
      const look = new THREE.Vector3(-1.3, 0, -.6)
      camera.position.set(Math.sin(yaw) * 10, 6, Math.cos(yaw) * 10).add(look)
      camera.lookAt(look)
      camera.zoom = zoom
      camera.updateProjectionMatrix()
      camera.updateMatrixWorld()
      const point = new THREE.Vector3(.7, .12, -1.4)
      const screen = point.clone().project(camera)
      const ray = new THREE.Raycaster()
      ray.setFromCamera(new THREE.Vector2(screen.x, screen.y), camera)
      const recovered = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -point.y), new THREE.Vector3())!
      expect(recovered.x * WATER_BRUSH_WORLD_SCALE).toBeCloseTo(point.x * WATER_BRUSH_WORLD_SCALE, 12)
      expect(recovered.z * WATER_BRUSH_WORLD_SCALE).toBeCloseTo(point.z * WATER_BRUSH_WORLD_SCALE, 12)
    })
  }
})
