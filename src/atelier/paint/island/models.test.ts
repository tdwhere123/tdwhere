import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { disposeModelResources } from './models'

describe('model resource lifetime', () => {
  it('disposes shared flock geometry, materials, and texture once', () => {
    const texture = new THREE.Texture(), geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshStandardMaterial({ map: texture, emissiveMap: texture })
    const root = new THREE.Group()
    root.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material))
    const disposeTexture = vi.spyOn(texture, 'dispose'), disposeGeometry = vi.spyOn(geometry, 'dispose'), disposeMaterial = vi.spyOn(material, 'dispose')
    disposeModelResources(root)
    expect(disposeTexture).toHaveBeenCalledTimes(1)
    expect(disposeGeometry).toHaveBeenCalledTimes(1)
    expect(disposeMaterial).toHaveBeenCalledTimes(1)
  })
})

it('keeps authored maps and the native skinning/alpha shader paths when adapting island light', async () => {
  const { lightIslandModel } = await import('./models')
  const texture = new THREE.Texture(), material = new THREE.MeshStandardMaterial({ map: texture, transparent: true, opacity: .7 })
  const root = new THREE.Group()
  root.add(new THREE.Mesh(new THREE.PlaneGeometry(), material))
  const shared = {
    sun: { value: new THREE.Vector3(0, 1, 0) }, shade: { value: new THREE.Vector3(.1, .2, .3) }, lit: { value: new THREE.Vector3(1, 1, 1) },
    day: { value: 1 }, night: { value: 0 }, lampAt: { value: new THREE.Vector3() }, snowCover: { value: 0 },
  }
  lightIslandModel(root, shared, false)
  const shader = { vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader, uniforms: THREE.UniformsUtils.clone(THREE.ShaderLib.standard.uniforms) }
  material.onBeforeCompile(shader as Parameters<THREE.Material['onBeforeCompile']>[0], {} as THREE.WebGLRenderer)
  expect(material.map).toBe(texture)
  expect(material.opacity).toBe(.7)
  expect(shader.uniforms.day).toBe(shared.day)
  expect(shader.vertexShader).toContain('#include <skinning_vertex>')
  expect(shader.vertexShader).toContain('vPaintWorld = (modelMatrix * vec4(transformed, 1.)).xyz;')
  expect(shader.fragmentShader).toContain('#include <map_fragment>')
  expect(shader.fragmentShader).toContain('#include <alphatest_fragment>')
  expect(shader.fragmentShader).toContain('outgoingLight = diffuseColor.rgb')
  disposeModelResources(root)
})
