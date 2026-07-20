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
  const forward = useRef(new THREE.Vector3())
  const ndcCenter = useRef(new THREE.Vector3())
  const ndcTip = useRef(new THREE.Vector3())
  const last = useRef({ x: -1, y: -1, hx: -1, hy: -1, ang: 0 })

  useFrame(() => {
    if (!onAnchor || !targetRef.current) return

    targetRef.current.getWorldPosition(center.current)

    // Same camera-relative "S" direction as useRollingCube KeyS → nz:
    // opposite of camera look on the museum floor (toward the viewer).
    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    if (forward.current.lengthSq() < 1e-6) forward.current.set(0, 0, -1)
    forward.current.normalize()
    // Snap to cardinal so the hint stays stable while orbiting slightly.
    if (Math.abs(forward.current.x) >= Math.abs(forward.current.z)) {
      forward.current.set(Math.sign(forward.current.x) || 1, 0, 0)
    } else {
      forward.current.set(0, 0, Math.sign(forward.current.z) || 1)
    }
    // S rolls opposite camera-forward → toward viewer
    tip.current
      .copy(center.current)
      .addScaledVector(forward.current, -CUBE_SIZE * 0.72)
    tip.current.y = 0.06

    ndcCenter.current.copy(center.current).project(camera)
    ndcTip.current.copy(tip.current).project(camera)

    const cx = (ndcCenter.current.x + 1) / 2
    const cy = (1 - ndcCenter.current.y) / 2
    const hx = (ndcTip.current.x + 1) / 2
    const hy = (1 - ndcTip.current.y) / 2

    // Screen delta; SVG arrow defaults to pointing down (+Y).
    const dx = hx - cx
    const dy = hy - cy
    const rollAngleDeg = (Math.atan2(dx, dy) * 180) / Math.PI

    // Ink park point: slightly toward free side of the tip
    const parkX = THREE.MathUtils.clamp(hx, 0.1, 0.9)
    const parkY = THREE.MathUtils.clamp(hy, 0.2, 0.86)

    const L = last.current
    if (
      Math.abs(parkX - L.x) < 0.01 &&
      Math.abs(parkY - L.y) < 0.01 &&
      Math.abs(hx - L.hx) < 0.01 &&
      Math.abs(hy - L.hy) < 0.01 &&
      Math.abs(rollAngleDeg - L.ang) < 2.5
    ) {
      return
    }
    last.current = { x: parkX, y: parkY, hx, hy, ang: rollAngleDeg }

    onAnchor({
      x: parkX,
      y: parkY,
      preferRight: parkX < 0.55,
      rollHintX: THREE.MathUtils.clamp(hx, 0.06, 0.94),
      rollHintY: THREE.MathUtils.clamp(hy, 0.12, 0.92),
      rollAngleDeg,
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
