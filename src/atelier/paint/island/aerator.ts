import * as THREE from 'three'

/**
 * The four-wheel paddlewheel aerator from the home photograph, in the
 * proportions of the common pond machine: two HDPE pontoons, a bevel gearbox
 * in the middle with its motor lying on it under a blue moulded hood, a stainless shaft through
 * a bearing on each pontoon, and on it four nylon wheels of perforated
 * blades, each wheel about half a pontoon across and as wide as one, dipping
 * a third of the way in. A lamp on its mast is lit at dusk. Water units; its
 * shaft runs a little askew to the usual view, so the wheels show their sides.
 */
export const AERATOR = { x: -1.3, z: -0.6, turn: 0.25, size: 1.5 }
/** Along the shaft: the four wheels, and the two pontoons under it. */
const WHEELS = [-0.52, -0.17, 0.17, 0.52]
/** The wheels' size in the authored asset's local frame. */
const WHEEL_RADIUS = 0.17,
  WHEEL_WIDTH = 0.13,
  /** Turns a second at full speed. */
  SPIN = 1.2
const SPRAY_PER_WHEEL = 18,
  SPRAY_LIFE = 0.5
/** Where a bird can stand on the pontoons, in the aerator's own frame. */
export const PERCHES: [number, number, number][] = [
  [-0.34, 0.075, -0.26],
  [0.34, 0.075, 0.26],
  [-0.34, 0.075, 0.26],
  [0.34, 0.075, -0.26],
]
/** The mast's lamp, in the aerator's own frame. */
export const LAMP: [number, number, number] = [0.05, 0.46, -0.19]

/** The shaft's direction and the way the wheels throw the water, on the water's plane. */
export const aeratorAxis: [number, number] = [Math.cos(AERATOR.turn), -Math.sin(AERATOR.turn)]
export const aeratorWake: [number, number] = [Math.sin(AERATOR.turn), Math.cos(AERATOR.turn)]

/** A point in the aerator's own frame, on the water's plane. */
export const onWater = (x: number, z: number): [number, number] => [
  AERATOR.x + (aeratorAxis[0] * x + aeratorWake[0] * z) * AERATOR.size,
  AERATOR.z + (aeratorAxis[1] * x + aeratorWake[1] * z) * AERATOR.size,
]
/** Each wheel's place on the water. */
export const wheelSpots = WHEELS.map((x) => onWater(x, 0))

export function buildAerator(model: THREE.Group) {
  const group = new THREE.Group()
  group.position.set(AERATOR.x, 0, AERATOR.z)
  group.rotation.order = 'YXZ'
  group.rotation.y = AERATOR.turn
  group.scale.setScalar(AERATOR.size)
  group.add(model)
  const wheels = WHEELS.map((_, i) => {
    const wheel = model.getObjectByName(`wheel_${i}`)
    if (!wheel) throw new Error(`Missing aerator wheel_${i}`)
    return wheel
  })

  // spray thrown back off the paddles, each drop on its own short arc
  const count = WHEELS.length * SPRAY_PER_WHEEL,
    positions = new Float32Array(count * 3),
    fade = new Float32Array(count)
  const drops = Array.from({ length: count }, (_, i) => ({
    wheel: Math.floor(i / SPRAY_PER_WHEEL),
    phase: Math.random(),
    side: (Math.random() - 0.5) * WHEEL_WIDTH,
    up: 0.8 + Math.random() * 0.7,
    back: 0.3 + Math.random() * 0.5,
  }))
  const sprayGeometry = new THREE.BufferGeometry()
  sprayGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  sprayGeometry.setAttribute('fade', new THREE.BufferAttribute(fade, 1))
  const sprayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { size: { value: 3 }, foam: { value: new THREE.Vector3(1, 1, 1) } },
    vertexShader: `uniform float size;attribute float fade;varying float vFade;void main(){vFade=fade;gl_PointSize=size*(.5+fade*.7);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `precision highp float;uniform vec3 foam;varying float vFade;void main(){vec2 c=gl_PointCoord-.5;float a=smoothstep(.5,.15,length(c))*vFade;if(a<.01)discard;gl_FragColor=vec4(foam,a*.8);}`,
  })
  const spray = new THREE.Points(sprayGeometry, sprayMaterial)
  spray.frustumCulled = false
  group.add(spray)

  const solids = group.children.filter((c) => c !== spray)
  return {
    group,
    sprayMaterial,
    /** True when the ray from the visitor's pointer falls on the machine. */
    hit(ray: THREE.Raycaster) {
      return ray.intersectObjects(solids, true).length > 0
    },
    /** A perch, as a point in the world: it rides with the pontoons. */
    perch(i: number, out = new THREE.Vector3()) {
      return group.localToWorld(out.set(...PERCHES[i]))
    },
    /** Turns the wheels and throws the spray; `running` 0..1; the pontoons ride the swell's height, pitch and roll. */
    update(time: number, dt: number, running: number, ride: { height: number; pitch: number; roll: number }) {
      group.position.y = ride.height - 0.015
      group.rotation.x = ride.pitch
      group.rotation.z = ride.roll
      for (const wheel of wheels) wheel.rotation.x -= dt * SPIN * Math.PI * 2 * running
      const throwing = running > 0.15 ? Math.min(1, running * 1.5) : 0
      drops.forEach((d, i) => {
        const age = ((time / SPRAY_LIFE + d.phase) % 1) * SPRAY_LIFE
        positions[i * 3] = WHEELS[d.wheel] + d.side
        positions[i * 3 + 1] = Math.max(-0.02, -0.01 + d.up * age - 4.9 * age * age)
        positions[i * 3 + 2] = WHEEL_RADIUS * 0.7 + d.back * age
        fade[i] = (1 - age / SPRAY_LIFE) * throwing
      })
      sprayGeometry.attributes.position.needsUpdate = true
      sprayGeometry.attributes.fade.needsUpdate = true
    },
  }
}
