import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import type { CubeFacePosition, CubeStageId } from '../cube-data'
import { cubeProjects } from '../cube-data'

export const CUBE_SIZE = 1.85
/** Snappier roll so chained faces (e.g. do-it) feel reachable. */
const ROLL_SEC = 0.52
/** Soft recenter after a roll so the cube never paints itself into a corner. */
const RECENTER_SEC = 0.28
/** Queue depth while a roll / recenter is in flight. */
const QUEUE_MAX = 2

export type RollDir = 'px' | 'nx' | 'pz' | 'nz'

/**
 * World-fixed roll axes (XZ floor). Matches the floor S-arrow mark:
 * S / ↓ → +Z (recipe pz), W / ↑ → −Z (recipe nz), D → +X, A → −X.
 * Camera orbit does not remap these — the arrow on the plane stays the truth.
 */
export const WORLD_ROLL_DIR: Record<RollDir, THREE.Vector3> = {
  pz: new THREE.Vector3(0, 0, 1),
  nz: new THREE.Vector3(0, 0, -1),
  px: new THREE.Vector3(1, 0, 0),
  nx: new THREE.Vector3(-1, 0, 0),
}

const FACE_LOCAL: Record<CubeFacePosition, THREE.Vector3> = {
  right: new THREE.Vector3(1, 0, 0),
  left: new THREE.Vector3(-1, 0, 0),
  top: new THREE.Vector3(0, 1, 0),
  bottom: new THREE.Vector3(0, -1, 0),
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
}

const FACE_TO_ID = Object.fromEntries(
  cubeProjects.map((p) => [p.face, p.id]),
) as Record<CubeFacePosition, CubeStageId>

const UP = new THREE.Vector3(0, 1, 0)
const _pivot = new THREE.Vector3()
const _offset = new THREE.Vector3()
const _axis = new THREE.Vector3()
const _qDelta = new THREE.Quaternion()

/**
 * Edge-pivot recipes (Y-up, XZ floor).
 * Pivot = centre + (half toward move, half down); rotate ±90° about rim axis.
 */
const ROLL: Record<
  RollDir,
  { move: THREE.Vector3; pivot: THREE.Vector3; axis: THREE.Vector3; angle: number }
> = {
  px: {
    move: new THREE.Vector3(1, 0, 0),
    pivot: new THREE.Vector3(0.5, -0.5, 0),
    axis: new THREE.Vector3(0, 0, -1),
    angle: Math.PI / 2,
  },
  nx: {
    move: new THREE.Vector3(-1, 0, 0),
    pivot: new THREE.Vector3(-0.5, -0.5, 0),
    axis: new THREE.Vector3(0, 0, 1),
    angle: Math.PI / 2,
  },
  pz: {
    move: new THREE.Vector3(0, 0, 1),
    pivot: new THREE.Vector3(0, -0.5, 0.5),
    axis: new THREE.Vector3(1, 0, 0),
    angle: Math.PI / 2,
  },
  nz: {
    move: new THREE.Vector3(0, 0, -1),
    pivot: new THREE.Vector3(0, -0.5, -0.5),
    axis: new THREE.Vector3(-1, 0, 0),
    angle: Math.PI / 2,
  },
}

function snapToCardinal(v: THREE.Vector3) {
  if (Math.abs(v.x) >= Math.abs(v.z)) {
    return new THREE.Vector3(Math.sign(v.x) || 1, 0, 0)
  }
  return new THREE.Vector3(0, 0, Math.sign(v.z) || 1)
}

function pickUpFace(quaternion: THREE.Quaternion): CubeFacePosition {
  let best: CubeFacePosition = 'top'
  let bestDot = -Infinity
  const world = new THREE.Vector3()

  for (const [face, local] of Object.entries(FACE_LOCAL) as [
    CubeFacePosition,
    THREE.Vector3,
  ][]) {
    world.copy(local).applyQuaternion(quaternion)
    const d = world.dot(UP)
    if (d > bestDot) {
      bestDot = d
      best = face
    }
  }
  return best
}

function snapQuatToAxes(q: THREE.Quaternion) {
  const m = new THREE.Matrix4().makeRotationFromQuaternion(q)
  const x = new THREE.Vector3()
  const y = new THREE.Vector3()
  const z = new THREE.Vector3()
  m.extractBasis(x, y, z)

  const snap = (v: THREE.Vector3) => {
    const ax = Math.abs(v.x)
    const ay = Math.abs(v.y)
    const az = Math.abs(v.z)
    if (ax >= ay && ax >= az) v.set(Math.sign(v.x) || 1, 0, 0)
    else if (ay >= ax && ay >= az) v.set(0, Math.sign(v.y) || 1, 0)
    else v.set(0, 0, Math.sign(v.z) || 1)
  }

  snap(x)
  snap(y)
  z.crossVectors(x, y)
  if (z.lengthSq() < 0.5) {
    snap(z)
    y.crossVectors(z, x)
  }
  x.normalize()
  y.normalize()
  z.normalize()
  m.makeBasis(x, y, z)
  return new THREE.Quaternion().setFromRotationMatrix(m)
}

function moveToRollKey(move: THREE.Vector3): RollDir | null {
  const x = Math.round(move.x)
  const z = Math.round(move.z)
  if (x === 1 && z === 0) return 'px'
  if (x === -1 && z === 0) return 'nx'
  if (x === 0 && z === 1) return 'pz'
  if (x === 0 && z === -1) return 'nz'
  return null
}

type Options = {
  groupRef: React.RefObject<THREE.Group | null>
  cameraRef: React.RefObject<THREE.Camera | null>
  enabled: boolean
  locked?: boolean
  onFaceChange: (id: CubeStageId) => void
}

export function useRollingCube({
  groupRef,
  cameraRef: _cameraRef,
  enabled,
  locked: _locked = false,
  onFaceChange,
}: Options) {
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const recenterRef = useRef<gsap.core.Tween | null>(null)
  const queueRef = useRef<RollDir[]>([])
  const onFaceChangeRef = useRef(onFaceChange)
  onFaceChangeRef.current = onFaceChange
  const rollRef = useRef<(key: RollDir) => boolean>(() => false)

  const syncFacing = useCallback(() => {
    const group = groupRef.current
    if (!group) return
    const face = pickUpFace(group.quaternion)
    const id = FACE_TO_ID[face]
    queueMicrotask(() => onFaceChangeRef.current(id))
  }, [groupRef])

  const dirFromKey = useCallback((key: RollDir) => WORLD_ROLL_DIR[key].clone(), [])

  const flushQueue = useCallback(() => {
    const next = queueRef.current.shift()
    if (next) {
      // Defer one frame so busyRef is cleared before the next roll starts.
      requestAnimationFrame(() => rollRef.current(next))
    }
  }, [])

  const roll = useCallback(
    (key: RollDir): boolean => {
      if (!enabled) return false
      // Ink erase no longer blocks rolls — only orbit is gated via `locked` in the canvas.
      if (busyRef.current) {
        if (queueRef.current.length < QUEUE_MAX) {
          queueRef.current.push(key)
        }
        return false
      }
      const group = groupRef.current
      if (!group) return false

      const move = dirFromKey(key)
      if (move.lengthSq() < 1e-6) return false
      const recipeKey = moveToRollKey(snapToCardinal(move))
      if (!recipeKey) return false
      const recipe = ROLL[recipeKey]
      const s = CUBE_SIZE

      // Always roll from the exhibit centre — no floor bounds to paint into.
      recenterRef.current?.kill()
      group.position.set(0, s / 2, 0)
      const startPos = group.position.clone()
      const startQuat = group.quaternion.clone()
      const endX = startPos.x + recipe.move.x * s
      const endZ = startPos.z + recipe.move.z * s

      _pivot.set(
        startPos.x + recipe.pivot.x * s,
        startPos.y + recipe.pivot.y * s,
        startPos.z + recipe.pivot.z * s,
      )
      _offset.copy(startPos).sub(_pivot)
      _axis.copy(recipe.axis)

      const pivot = _pivot.clone()
      const offset0 = _offset.clone()
      const axis = _axis.clone()
      const angle = recipe.angle
      const endQuat = snapQuatToAxes(
        new THREE.Quaternion().setFromAxisAngle(axis, angle).multiply(startQuat),
      )

      busyRef.current = true
      setBusy(true)
      tweenRef.current?.kill()

      const proxy = { t: 0 }
      tweenRef.current = gsap.to(proxy, {
        t: 1,
        duration: ROLL_SEC,
        ease: 'power3.inOut',
        onUpdate: () => {
          const a = angle * proxy.t
          _qDelta.setFromAxisAngle(axis, a)
          group.position.copy(offset0).applyQuaternion(_qDelta).add(pivot)
          group.quaternion.copy(_qDelta).multiply(startQuat)
        },
        onComplete: () => {
          group.position.set(endX, s / 2, endZ)
          group.quaternion.copy(endQuat)
          syncFacing()
          busyRef.current = false
          setBusy(false)

          // Chained input: snap home and fire next roll immediately (do-it = S→S).
          if (queueRef.current.length > 0) {
            group.position.set(0, s / 2, 0)
            flushQueue()
            return
          }

          recenterRef.current = gsap.to(group.position, {
            x: 0,
            z: 0,
            duration: RECENTER_SEC,
            ease: 'power2.out',
            onComplete: () => {
              group.position.set(0, s / 2, 0)
            },
          })
        },
      })

      return true
    },
    [dirFromKey, enabled, flushQueue, groupRef, syncFacing],
  )

  rollRef.current = roll

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    group.position.set(0, CUBE_SIZE / 2, 0)
    group.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
    const id = requestAnimationFrame(() => syncFacing())
    return () => cancelAnimationFrame(id)
  }, [groupRef, syncFacing])

  useEffect(() => {
    if (!enabled) return

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const map: Record<string, RollDir> = {
        ArrowRight: 'px',
        KeyD: 'px',
        ArrowLeft: 'nx',
        KeyA: 'nx',
        ArrowUp: 'nz',
        KeyW: 'nz',
        ArrowDown: 'pz',
        KeyS: 'pz',
      }
      const dir = map[e.code]
      if (!dir) return
      e.preventDefault()
      roll(dir)
    }

    /** Mouse wheel → roll along world ±Z (same as S / W). */
    const onWheel = (e: WheelEvent) => {
      // Ignore tiny trackpad noise; prefer vertical intent.
      if (Math.abs(e.deltaY) < 8 && Math.abs(e.deltaX) < 8) return
      e.preventDefault()
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        roll(e.deltaY > 0 ? 'pz' : 'nz')
      } else {
        roll(e.deltaX > 0 ? 'px' : 'nx')
      }
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
    }
  }, [enabled, roll])

  useEffect(() => {
    return () => {
      tweenRef.current?.kill()
      recenterRef.current?.kill()
      busyRef.current = false
      queueRef.current = []
    }
  }, [])

  return { busy, roll }
}
