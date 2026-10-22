import * as THREE from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import type { Bird } from './birds'

/** Water units from tail to bill; the authored model is approximately this length. */
export const COOT_LENGTH = 0.25

export function buildCoot(model: THREE.Group) {
  const group = new THREE.Group(), visual = clone(model)
  group.rotation.order = 'YXZ'
  group.add(visual)
  const head = visual.getObjectByName('head_pivot')
  if (!head?.parent) throw new Error('Missing coot head_pivot')
  group.updateMatrixWorld(true)
  const restHead = head.position.clone()
  const headForward = new THREE.Vector3(1, 0, 0).applyMatrix3(new THREE.Matrix3().setFromMatrix4(head.parent.matrixWorld.clone().invert()))
  const lift = new THREE.Vector3()
  return {
    group,
    update(bird: Bird, elapsed: number, wave: { height: number; dx: number; dz: number }, perches: THREE.Vector3[]) {
      const afloat = wave.height - .015
      group.visible = true
      group.rotation.set(wave.dz * .8, -bird.heading, -wave.dx * .8)
      group.position.set(bird.x, afloat, bird.z)
      head.position.copy(restHead).addScaledVector(headForward, Math.sin(elapsed * 9 + bird.phase) * .006 * Math.min(2, bird.speed / .07))
      if (bird.mode === 'dive') {
        const down = Math.min(1, bird.t / .3)
        // invariant: +X is the bill; negative Z pitch lowers it into the water.
        group.rotation.z -= down * .9
        group.position.y = afloat - down * .1
        group.visible = bird.t < .3
      } else if (bird.mode === 'perch') {
        group.position.copy(perches[bird.perch])
      } else if (bird.mode === 'hop' || bird.mode === 'leave') {
        const k = Math.min(1, bird.t / .35), up = bird.mode === 'hop' ? k : 1 - k
        lift.set(bird.x, afloat, bird.z).lerp(perches[bird.perch], up)
        lift.y += Math.sin(k * Math.PI) * .08
        group.position.copy(lift)
      }
    },
  }
}
