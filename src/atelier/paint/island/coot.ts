import * as THREE from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { LEAVE_SECONDS, type Bird } from './birds'

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
  const restHeadRotation = head.quaternion.clone()
  const headUp = new THREE.Vector3(0, 1, 0).applyMatrix3(new THREE.Matrix3().setFromMatrix4(head.parent.matrixWorld.clone().invert())).normalize()
  const glance = new THREE.Quaternion()
  const lift = new THREE.Vector3()
  return {
    group,
    update(bird: Bird, elapsed: number, wave: { height: number; dx: number; dz: number }, perches: THREE.Vector3[]) {
      const afloat = wave.height - .015
      group.visible = true
      group.rotation.set(wave.dz * .8, -bird.heading, -wave.dx * .8)
      group.position.set(bird.x, afloat, bird.z)
      head.position.copy(restHead).addScaledVector(headForward, Math.sin(elapsed * 9 + bird.phase) * .006 * Math.min(2, bird.speed / .07))
      const glanceAngle = bird.mode === 'greet' && bird.greeting && bird.t < .65
        ? -Math.sign(bird.greeting.turn) * .28 * Math.sin(Math.PI * bird.t / .65) ** 2 : 0
      head.quaternion.copy(restHeadRotation).premultiply(glance.setFromAxisAngle(headUp, glanceAngle))
      if (bird.mode === 'dive') {
        const down = Math.min(1, bird.t / .3)
        // invariant: +X is the bill; negative Z pitch lowers it into the water.
        group.rotation.z -= down * .9
        group.position.y = afloat - down * .1
        group.visible = bird.t < .3
      } else if (bird.mode === 'perch') {
        group.position.copy(perches[bird.perch])
      } else if (bird.mode === 'hop' || bird.mode === 'leave') {
        const k = Math.min(1, bird.t / (bird.mode === 'leave' ? LEAVE_SECONDS : .35)), up = bird.mode === 'hop' ? k : 1 - k
        lift.set(bird.x, afloat, bird.z)
        if (bird.mode === 'hop') {
          lift.lerp(perches[bird.perch], up)
          lift.y += Math.sin(k * Math.PI) * .08
        } else {
          lift.y += (perches[bird.perch].y - afloat) * (1 - k * k * (3 - 2 * k))
          lift.y += Math.sin(k * Math.PI) ** 2 * .04
        }
        group.position.copy(lift)
      }
    },
  }
}
