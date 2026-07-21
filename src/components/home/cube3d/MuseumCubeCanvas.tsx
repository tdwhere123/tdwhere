import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { CubeFacePosition, CubeStageId } from '../cube-data'
import { CUBE_SIZE, useRollingCube } from './useRollingCube'
import { asset } from '@/lib/asset'

const MATERIAL_FACES: CubeFacePosition[] = [
  'right',
  'left',
  'top',
  'bottom',
  'front',
  'back',
]

const FACE_URLS = MATERIAL_FACES.map((face) => asset(`cube/faces/${face}.png`))

/** Near-top view (~80°): cube reads upright on the plane. */
const INITIAL_CAM = new THREE.Vector3(0, 9.2, 1.65)

export type CubeScreenAnchor = {
  /** Park point beside the cube for PlaneInk (normalized 0–1). */
  x: number
  y: number
  preferRight: boolean
  /** Tip of the S-roll hint in screen space (normalized 0–1). */
  rollHintX: number
  rollHintY: number
  /**
   * CSS degrees to rotate a down-pointing arrow so it aligns with the
   * camera-relative S roll direction (toward the viewer on the floor).
   */
  rollAngleDeg: number
}

function CubeMesh({ textures }: { textures: THREE.Texture[] }) {
  const materials = useMemo(
    () =>
      textures.map((map) => {
        map.colorSpace = THREE.SRGBColorSpace
        map.anisotropy = 4
        map.needsUpdate = true
        return new THREE.MeshBasicMaterial({ map, toneMapped: false })
      }),
    [textures],
  )

  useEffect(() => {
    return () => {
      materials.forEach((m) => {
        m.map = null
        m.dispose()
      })
    }
  }, [materials])

  return (
    <mesh material={materials}>
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
    </mesh>
  )
}

function FollowControls({
  targetRef,
  controlsRef,
  busyRef,
}: {
  targetRef: React.RefObject<THREE.Group | null>
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  busyRef: React.RefObject<boolean>
}) {
  const desired = useRef(new THREE.Vector3())
  const orbiting = useRef(false)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const onStart = () => {
      orbiting.current = true
    }
    const onEnd = () => {
      orbiting.current = false
    }
    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)
    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
    }
  }, [controlsRef])

  useFrame((_, dt) => {
    const g = targetRef.current
    const controls = controlsRef.current
    if (!g || !controls) return
    // Don't fight the user mid-drag; only chase the cube while rolling / idle.
    if (orbiting.current && !busyRef.current) return
    // World position — during a roll the cube is parented under a pivot.
    g.getWorldPosition(desired.current)
    desired.current.y = CUBE_SIZE * 0.2
    const speed = busyRef.current ? 5.5 : 1.4
    controls.target.lerp(desired.current, Math.min(1, dt * speed))
  })

  return null
}

declare global {
  interface Window {
    /** Live S-roll arrow pose for E2E (world + screen + face normal). */
    __tdwhereRollArrow?: {
      wx: number
      wy: number
      wz: number
      sx: number
      sy: number
      faceNx: number
      faceNz: number
    }
    /** Programmatic orbit for E2E — azimuth/polar around the cube (radians). */
    __tdwhereSetOrbit?: (azimuthRad: number, polarRad?: number) => void
  }
}

/**
 * S-roll arrow lying on the TOP face of the cube, pointing toward the camera
 * on XZ (KeyS = roll toward viewer).
 *
 * Why top face (not vertical near face): the product camera is near-top-down,
 * so a vertical-face shaft foreshortens to a stray tip under the cube. A flat
 * top-face chevron stays readable and clearly rotates when you orbit.
 */
function RollSArrow3D({ targetRef }: { targetRef: React.RefObject<THREE.Group | null> }) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera, size } = useThree()
  const center = useRef(new THREE.Vector3())
  const towardCam = useRef(new THREE.Vector3())
  const tipWorld = useRef(new THREE.Vector3())
  const ndc = useRef(new THREE.Vector3())
  const brass = useMemo(() => new THREE.Color('#8a6a2a'), [])
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: brass,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 0.9,
      }),
    [brass],
  )

  useEffect(() => () => mat.dispose(), [mat])

  useFrame(() => {
    const cube = targetRef.current
    const g = groupRef.current
    if (!cube || !g) return

    cube.getWorldPosition(center.current)

    towardCam.current.set(
      camera.position.x - center.current.x,
      0,
      camera.position.z - center.current.z,
    )
    if (towardCam.current.lengthSq() < 1e-6) towardCam.current.set(0, 0, 1)
    else towardCam.current.normalize()

    // Sit on the top face, toward the S (near) edge so orbit motion is obvious
    g.position.copy(center.current)
    g.position.y = center.current.y + CUBE_SIZE * 0.5 + 0.04
    g.position.addScaledVector(towardCam.current, CUBE_SIZE * 0.22)

    // Local +Z = toward camera (S). Yaw only — stays flat on the top face.
    const yaw = Math.atan2(towardCam.current.x, towardCam.current.z)
    g.rotation.set(0, yaw, 0)
    g.updateWorldMatrix(true, false)

    // Tip of chevron (local +Z)
    tipWorld.current.set(0, 0.02, 0.42).applyMatrix4(g.matrixWorld)
    ndc.current.copy(tipWorld.current).project(camera)
    window.__tdwhereRollArrow = {
      wx: tipWorld.current.x,
      wy: tipWorld.current.y,
      wz: tipWorld.current.z,
      sx: ((ndc.current.x + 1) / 2) * size.width,
      sy: ((1 - ndc.current.y) / 2) * size.height,
      faceNx: towardCam.current.x,
      faceNz: towardCam.current.z,
    }
  })

  return (
    <group ref={groupRef} userData={{ rollHint: 's-top' }}>
      {/* Flat on top face; local +Z = toward camera (S) */}
      <mesh position={[0, 0.02, 0.06]} material={mat}>
        <boxGeometry args={[0.1, 0.04, 0.4]} />
      </mesh>
      <mesh position={[0, 0.02, 0.36]} rotation={[-Math.PI / 2, 0, 0]} material={mat}>
        <coneGeometry args={[0.16, 0.3, 3]} />
      </mesh>
    </group>
  )
}

function ScreenAnchorReporter({
  targetRef,
  onAnchor,
}: {
  targetRef: React.RefObject<THREE.Group | null>
  onAnchor?: (a: CubeScreenAnchor) => void
}) {
  const { camera } = useThree()
  const center = useRef(new THREE.Vector3())
  const tip = useRef(new THREE.Vector3())
  const park = useRef(new THREE.Vector3())
  const forward = useRef(new THREE.Vector3())
  const ndc = useRef(new THREE.Vector3())
  const last = useRef({ x: -1, y: -1, hx: -1, hy: -1 })

  useFrame(() => {
    if (!onAnchor || !targetRef.current) return

    targetRef.current.getWorldPosition(center.current)

    // Toward camera on XZ = face that hosts the 3D S-arrow; tip near arrow tip
    forward.current.set(
      camera.position.x - center.current.x,
      0,
      camera.position.z - center.current.z,
    )
    if (forward.current.lengthSq() < 1e-6) forward.current.set(0, 0, 1)
    else forward.current.normalize()

    tip.current
      .copy(center.current)
      .addScaledVector(forward.current, CUBE_SIZE * 0.32)
    tip.current.y = center.current.y + CUBE_SIZE * 0.52

    // Ink park: slightly to the free side of the cube (screen-stable-ish)
    const preferRight = (() => {
      ndc.current.copy(center.current).project(camera)
      return (ndc.current.x + 1) / 2 < 0.55
    })()
    park.current.copy(center.current)
    park.current.x += preferRight ? CUBE_SIZE * 0.55 : -CUBE_SIZE * 0.55
    park.current.y = 0.2

    ndc.current.copy(park.current).project(camera)
    const x = THREE.MathUtils.clamp((ndc.current.x + 1) / 2, 0.1, 0.9)
    const y = THREE.MathUtils.clamp((1 - ndc.current.y) / 2, 0.2, 0.86)

    ndc.current.copy(tip.current).project(camera)
    const hx = THREE.MathUtils.clamp((ndc.current.x + 1) / 2, 0.06, 0.94)
    const hy = THREE.MathUtils.clamp((1 - ndc.current.y) / 2, 0.12, 0.92)

    const L = last.current
    if (
      Math.abs(x - L.x) < 0.01 &&
      Math.abs(y - L.y) < 0.01 &&
      Math.abs(hx - L.hx) < 0.01 &&
      Math.abs(hy - L.hy) < 0.01
    ) {
      return
    }
    last.current = { x, y, hx, hy }

    onAnchor({
      x,
      y,
      preferRight,
      rollHintX: hx,
      rollHintY: hy,
      // kept for API compat; 3D arrow owns orientation now
      rollAngleDeg: 0,
    })
  })

  return null
}

function RollingScene({
  enabled,
  locked,
  onFaceChange,
  onAnchor,
  allowTouchOrbit = true,
}: {
  enabled: boolean
  locked: boolean
  onFaceChange: (id: CubeStageId) => void
  onAnchor?: (a: CubeScreenAnchor) => void
  /** When false (coarse pointer), one-finger gestures scroll the page instead of orbiting. */
  allowTouchOrbit?: boolean
}) {
  const textures = useLoader(THREE.TextureLoader, FACE_URLS)
  const groupRef = useRef<THREE.Group>(null)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const cameraRef = useRef<THREE.Camera | null>(null)
  const { camera } = useThree()
  cameraRef.current = camera

  const { busy } = useRollingCube({
    groupRef,
    cameraRef,
    enabled,
    locked,
    onFaceChange,
  })
  const busyRef = useRef(busy)
  busyRef.current = busy

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    controls.enableRotate = allowTouchOrbit && !busy && !locked
  }, [busy, locked, allowTouchOrbit])

  // E2E hook: set camera azimuth/polar around the cube without relying on mouse drag
  useEffect(() => {
    window.__tdwhereSetOrbit = (azimuthRad: number, polarRad?: number) => {
      const controls = controlsRef.current
      const cam = cameraRef.current
      if (!controls || !cam) return
      const target = controls.target
      const polar =
        polarRad ??
        THREE.MathUtils.clamp(controls.getPolarAngle(), controls.minPolarAngle, controls.maxPolarAngle)
      const radius = cam.position.distanceTo(target)
      const p = THREE.MathUtils.clamp(polar, controls.minPolarAngle, controls.maxPolarAngle)
      cam.position.set(
        target.x + radius * Math.sin(p) * Math.sin(azimuthRad),
        target.y + radius * Math.cos(p),
        target.z + radius * Math.sin(p) * Math.cos(azimuthRad),
      )
      cam.lookAt(target)
      controls.update()
    }
    return () => {
      delete window.__tdwhereSetOrbit
    }
  }, [])

  const maps = useMemo(
    () => (Array.isArray(textures) ? textures : [textures]),
    [textures],
  )

  return (
    <>
      <ambientLight intensity={1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <planeGeometry args={[28, 18]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={groupRef}>
        <mesh>
          <boxGeometry args={[CUBE_SIZE * 0.985, CUBE_SIZE * 0.985, CUBE_SIZE * 0.985]} />
          <meshBasicMaterial color="#1e1a16" />
        </mesh>
        <CubeMesh textures={maps} />
      </group>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableZoom={allowTouchOrbit}
        enableRotate={allowTouchOrbit}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        minDistance={5.5}
        maxDistance={14}
        minPolarAngle={0.12}
        maxPolarAngle={1.05}
        target={[0, CUBE_SIZE * 0.2, 0]}
      />
      <FollowControls targetRef={groupRef} controlsRef={controlsRef} busyRef={busyRef} />
      <RollSArrow3D targetRef={groupRef} />
      <ScreenAnchorReporter targetRef={groupRef} onAnchor={onAnchor} />
    </>
  )
}

type Props = {
  enabled?: boolean
  locked?: boolean
  onFaceChange: (id: CubeStageId) => void
  onAnchor?: (a: CubeScreenAnchor) => void
  className?: string
}

export default function MuseumCubeCanvas({
  enabled = true,
  locked = false,
  onFaceChange,
  onAnchor,
  className,
}: Props) {
  const [ready, setReady] = useState(false)
  /** One-finger drag orbits on mouse; on touch, let the page scroll instead. */
  const [touchOrbit, setTouchOrbit] = useState(false)

  useEffect(() => {
    setReady(true)
    const coarse = window.matchMedia('(pointer: coarse)')
    setTouchOrbit(coarse.matches)
    const onChange = () => setTouchOrbit(coarse.matches)
    coarse.addEventListener('change', onChange)
    return () => coarse.removeEventListener('change', onChange)
  }, [])

  if (!ready) {
    return (
      <div className={`${className ?? ''} flex items-center justify-center`}>
        <div className="h-12 w-12 animate-pulse rounded-sm bg-museum-stone/70" />
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{ touchAction: touchOrbit ? 'pan-y' : 'none' }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: INITIAL_CAM.toArray() as [number, number, number], fov: 32, near: 0.1, far: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.NoToneMapping,
          preserveDrawingBuffer: true,
        }}
        style={{ touchAction: touchOrbit ? 'pan-y' : 'none' }}
        onCreated={({ camera, gl }) => {
          camera.lookAt(0, CUBE_SIZE * 0.2, 0)
          gl.setClearColor(0x000000, 0)
        }}
      >
        <Suspense fallback={null}>
          <RollingScene
            enabled={enabled}
            locked={locked}
            onFaceChange={onFaceChange}
            onAnchor={onAnchor}
            allowTouchOrbit={!touchOrbit}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
