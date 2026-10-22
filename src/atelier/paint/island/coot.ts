import * as THREE from 'three'
import type { Finish } from './aerator'

/** Water units from tail to bill. */
export const COOT_LENGTH = 0.25

/**
 * A coot as it sits on the water: a low black body, its tail cocked, the
 * head held up on a short neck with the white bill and shield. Faces +x.
 */
export function buildCoot(paint: (color: THREE.ColorRepresentation, finish?: Finish) => THREE.Material) {
  const group = new THREE.Group(),
    black = paint('#16191c', { shine: 0.25, bare: true }),
    white = paint('#ecebe4', { shine: 0.4, bare: true })
  const blob = (r: [number, number, number], at: [number, number, number], material: THREE.Material, parent: THREE.Object3D = group) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), material)
    mesh.scale.set(...r)
    mesh.position.set(...at)
    parent.add(mesh)
    return mesh
  }
  blob([0.085, 0.042, 0.05], [0, 0.012, 0], black)
  blob([0.034, 0.024, 0.034], [-0.07, 0.03, 0], black).rotation.z = 0.5
  const head = new THREE.Group()
  head.position.set(0.062, 0.03, 0)
  group.add(head)
  blob([0.02, 0.034, 0.018], [0, 0.02, 0], black, head).rotation.z = -0.4
  blob([0.027, 0.025, 0.024], [0.014, 0.05, 0], black, head)
  const bill = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.032, 10), white)
  bill.rotation.z = -Math.PI / 2 - 0.15
  bill.position.set(0.052, 0.044, 0)
  head.add(bill)
  blob([0.008, 0.013, 0.007], [0.037, 0.06, 0], white, head)
  group.scale.setScalar(COOT_LENGTH / 0.2)
  return { group, head }
}
