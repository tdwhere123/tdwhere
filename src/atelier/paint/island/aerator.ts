import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

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
const WHEELS = [-0.52, -0.17, 0.17, 0.52],
  FLOATS = [-0.34, 0.34]
/** The shaft's height over the water, and the wheels' size. */
const AXLE = 0.1,
  WHEEL_RADIUS = 0.17,
  WHEEL_WIDTH = 0.13,
  BLADES = 8,
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

/** How a part takes the light; `bare` parts never gather snow. */
export type Finish = { glow?: number; holes?: boolean; shine?: number; lamp?: boolean; bare?: boolean }

/** A rounded oblong, the plan of a pontoon; the bow narrows a little. */
function oblong(width: number, length: number, r: number) {
  const s = new THREE.Shape(),
    w = width / 2,
    l = length / 2
  s.moveTo(-w + r, -l)
  s.lineTo(w - r, -l)
  s.quadraticCurveTo(w, -l, w, -l + r)
  s.lineTo(w, l - r * 2)
  s.quadraticCurveTo(w, l, 0, l)
  s.quadraticCurveTo(-w, l, -w, l - r * 2)
  s.lineTo(-w, -l + r)
  s.quadraticCurveTo(-w, -l, -w + r, -l)
  return s
}

/** A tube between two points. */
function tube(a: THREE.Vector3, b: THREE.Vector3, r: number) {
  const length = a.distanceTo(b),
    g = new THREE.CylinderGeometry(r, r, length, 8)
  g.translate(0, length / 2, 0)
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()))
  g.translate(a.x, a.y, a.z)
  return g
}

export function buildAerator(paint: (color: THREE.ColorRepresentation, finish?: Finish) => THREE.Material) {
  const group = new THREE.Group()
  group.position.set(AERATOR.x, 0, AERATOR.z)
  // turned first, then pitched and rolled on the swell about its own axes
  group.rotation.order = 'YXZ'
  group.rotation.y = AERATOR.turn
  group.scale.setScalar(AERATOR.size)
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D = group) => {
    const mesh = new THREE.Mesh(geometry, material)
    parent.add(mesh)
    return mesh
  }
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
  const white = paint('#eceee9', { shine: 0.5 }),
    seam = paint('#aeb5b9'),
    label = paint('#3b4a5c'),
    hood = paint('#3a6dae', { shine: 0.8 }),
    skirt = paint('#2b5287', { shine: 0.5 }),
    slot = paint('#1d2c40'),
    badge = paint('#f1f0ea', { shine: 0.6 }),
    cast = paint('#7c868e', { shine: 0.6 }),
    steel = paint('#a3abb0', { shine: 1 }),
    yellow = paint('#f3c21a', { glow: 0.75, shine: 0.35 }),
    blades = paint('#f3c21a', { glow: 0.9, holes: true, shine: 0.3 }),
    lamp = paint('#ffd889', { lamp: true, bare: true })

  // pontoons: deep, rounded, flat-decked, a grey band at the waterline and a maker's plate on each side
  const hull = new THREE.ExtrudeGeometry(oblong(0.16, 0.72, 0.055), { depth: 0.08, bevelEnabled: true, bevelThickness: 0.016, bevelSize: 0.016, bevelSegments: 4, curveSegments: 10 })
  hull.rotateX(-Math.PI / 2)
  hull.translate(0, -0.036, 0)
  const band = new THREE.ExtrudeGeometry(oblong(0.196, 0.756, 0.06), { depth: 0.008, bevelEnabled: false, curveSegments: 10 })
  band.rotateX(-Math.PI / 2)
  band.translate(0, -0.002, 0)
  const plate = new THREE.BoxGeometry(0.004, 0.03, 0.15)
  for (const x of FLOATS) {
    add(hull, white).position.x = x
    add(band, seam).position.x = x
    for (const side of [-1, 1]) add(plate, label).position.set(x + side * 0.097, 0.032, 0.05)
  }

  // the stainless frame across the pontoons, braced in to the gearbox
  const frame: [THREE.Vector3, THREE.Vector3, number][] = [
    [v(-0.42, 0.085, -0.22), v(0.42, 0.085, -0.22), 0.01],
    [v(-0.42, 0.085, 0.22), v(0.42, 0.085, 0.22), 0.01],
    [v(-0.1, 0.085, -0.22), v(-0.065, 0.1, -0.06), 0.008],
    [v(0.1, 0.085, -0.22), v(0.065, 0.1, -0.06), 0.008],
    [v(-0.1, 0.085, 0.22), v(-0.065, 0.1, 0.06), 0.008],
    [v(0.1, 0.085, 0.22), v(0.065, 0.1, 0.06), 0.008],
  ]
  for (const [a, b, r] of frame) add(tube(a, b, r), steel)
  const clamp = new THREE.CylinderGeometry(0.016, 0.018, 0.022, 12)
  for (const x of FLOATS) for (const z of [-0.22, 0.22]) add(clamp, steel).position.set(x, 0.075, z)

  // the cast bevel gearbox on the shaft, and the motor lying on it, back from the shaft, under a
  // rounded blue moulded hood with vents along its flanks and a maker's badge on top
  add(new RoundedBoxGeometry(0.15, 0.085, 0.13, 3, 0.02), cast).position.set(0, AXLE + 0.005, 0)
  add(new RoundedBoxGeometry(0.16, 0.022, 0.27, 2, 0.008), skirt).position.set(0, AXLE + 0.05, -0.03)
  const cover = new THREE.CapsuleGeometry(0.062, 0.13, 8, 20)
  cover.rotateX(Math.PI / 2)
  cover.scale(1, 0.82, 1)
  add(cover, hood).position.set(0, AXLE + 0.1, -0.03)
  const vent = new THREE.BoxGeometry(0.004, 0.007, 0.075)
  for (const side of [-1, 1]) for (let k = 0; k < 3; k++) add(vent, slot).position.set(side * 0.06, AXLE + 0.088 + k * 0.014, -0.05)
  add(new RoundedBoxGeometry(0.05, 0.006, 0.04, 2, 0.002), badge).position.set(0, AXLE + 0.153, 0.01)
  add(new RoundedBoxGeometry(0.035, 0.035, 0.03, 2, 0.005), steel).position.set(0.085, AXLE + 0.07, -0.1)

  // the mast at the back, and its lamp
  add(tube(v(LAMP[0], AXLE + 0.06, LAMP[2]), v(LAMP[0], LAMP[1] - 0.014, LAMP[2]), 0.005), steel)
  add(new THREE.SphereGeometry(0.015, 12, 8), lamp).position.set(...LAMP)

  // the shaft, through a bearing block bolted on each pontoon
  add(tube(v(-0.62, AXLE, 0), v(0.62, AXLE, 0), 0.012), steel)
  const block = new RoundedBoxGeometry(0.05, 0.028, 0.06, 2, 0.006),
    housing = new THREE.CylinderGeometry(0.026, 0.026, 0.045, 14)
  housing.rotateZ(Math.PI / 2)
  for (const x of FLOATS) {
    add(block, steel).position.set(x, 0.082, 0)
    add(housing, steel).position.set(x, AXLE, 0)
  }

  // each wheel: a hub, two rims, and eight perforated blades on paired spokes, each cupped with a lip
  const hub = new THREE.CylinderGeometry(0.036, 0.036, WHEEL_WIDTH * 0.85, 16)
  hub.rotateZ(Math.PI / 2)
  const rim = new THREE.TorusGeometry(WHEEL_RADIUS - 0.07, 0.0045, 6, 32)
  rim.rotateY(Math.PI / 2)
  const spoke = new THREE.BoxGeometry(0.009, WHEEL_RADIUS - 0.085, 0.009)
  spoke.translate(0, 0.03 + (WHEEL_RADIUS - 0.085) / 2, 0)
  const blade = new THREE.BoxGeometry(WHEEL_WIDTH, 0.085, 0.007)
  blade.translate(0, WHEEL_RADIUS - 0.045, 0)
  const lip = new THREE.BoxGeometry(WHEEL_WIDTH, 0.007, 0.026)
  lip.translate(0, WHEEL_RADIUS - 0.003, 0.009)
  const wheels = WHEELS.map((x) => {
    const wheel = new THREE.Group()
    wheel.position.set(x, AXLE, 0)
    group.add(wheel)
    add(hub, yellow, wheel)
    for (const side of [-1, 1]) add(rim, yellow, wheel).position.x = side * WHEEL_WIDTH * 0.42
    for (let i = 0; i < BLADES; i++) {
      const arm = new THREE.Group()
      arm.rotation.x = (i / BLADES) * Math.PI * 2
      wheel.add(arm)
      for (const side of [-1, 1]) add(spoke, yellow, arm).position.x = side * WHEEL_WIDTH * 0.38
      add(blade, blades, arm).rotation.x = 0.12
      add(lip, yellow, arm)
    }
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
