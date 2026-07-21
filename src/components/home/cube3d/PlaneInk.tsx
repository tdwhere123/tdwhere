import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lang } from '@/context/LangContext'
import type { CubeProject } from '../cube-data'
import type { CubeScreenAnchor, CubeScreenRect } from './MuseumCubeCanvas'
import { cn } from '@/lib/utils'

type Phase = 'title' | 'erasing' | 'body'

type Props = {
  project: CubeProject
  lang: Lang
  anchor: CubeScreenAnchor
  writeKey: string
  onLockChange?: (locked: boolean) => void
}

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]
const ERASE_MS = 560

/** Viewport edge padding as a fraction of width/height. */
const EDGE = 0.045
/** Clearance between cube silhouette and ink (fraction of viewport). */
const CLEAR = 0.008

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/**
 * Measured AABB pads brass / perspective; inset so ink hugs the visible mass.
 */
function layoutCube(cube: CubeScreenRect, insetFrac = 0.08): CubeScreenRect {
  const dx = cube.width * insetFrac
  const dy = cube.height * insetFrac
  return {
    left: cube.left + dx,
    right: cube.right - dx,
    top: cube.top + dy,
    bottom: cube.bottom - dy,
    cx: cube.cx,
    cy: cube.cy,
    width: Math.max(0.08, cube.width - 2 * dx),
    height: Math.max(0.08, cube.height - 2 * dy),
  }
}

/** Layout ink from the measured cube screen rect. */
function layoutFromCube(
  cubeIn: CubeScreenRect,
  side: 'left' | 'right',
  mode: 'title' | 'body',
) {
  const cube = layoutCube(cubeIn)
  const gutterRight = 1 - EDGE - cube.right
  const gutterLeft = cube.left - EDGE
  const useRight =
    side === 'right'
      ? gutterRight >= 0.14 || gutterRight >= gutterLeft
      : gutterLeft >= 0.14 && gutterLeft > gutterRight
        ? false
        : gutterRight >= gutterLeft

  const avail = useRight ? Math.max(0.22, gutterRight) : Math.max(0.22, gutterLeft)
  const widthFrac = clamp(
    mode === 'body' ? avail - CLEAR : Math.min(avail - CLEAR, 0.42),
    0.24,
    mode === 'body' ? 0.42 : 0.4,
  )

  // Sit near the cube’s upper third — reads as a label beside the exhibit.
  const topFrac = clamp(
    mode === 'body' ? cube.top + cube.height * 0.02 : cube.top + cube.height * 0.04,
    0.15,
    0.36,
  )

  const titlePx = clamp(Math.round(widthFrac * 100 * 1.35), 36, 58)

  // Small positive gap after AABB inset (~2–4% viewport ≈ 25–50px).
  const gap = 0.014
  const leftFrac = useRight
    ? clamp(cube.right + gap, EDGE, 1 - EDGE - widthFrac)
    : clamp(cube.left - gap - widthFrac, EDGE, 1 - EDGE - widthFrac)

  return {
    top: `${topFrac * 100}%`,
    left: `${leftFrac * 100}%`,
    right: 'auto' as const,
    width: `${widthFrac * 100}%`,
    maxWidth: `min(${Math.round(widthFrac * 1300)}px, 460px)`,
    titlePx,
    useRight,
  }
}

export default function PlaneInk({
  project,
  lang,
  anchor,
  writeKey,
  onLockChange,
}: Props) {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('title')
  const [titleSide, setTitleSide] = useState<'left' | 'right'>(
    anchor.preferRight ? 'right' : 'left',
  )
  /** Freeze cube silhouette when the face changes — orbit must not jitter ink. */
  const [parkedCube, setParkedCube] = useState<CubeScreenRect>(anchor.cube)
  const preferRightRef = useRef(anchor.preferRight)
  preferRightRef.current = anchor.preferRight
  const cubeRef = useRef(anchor.cube)
  cubeRef.current = anchor.cube
  const seededRef = useRef(false)

  const statement = lang === 'zh' ? project.statementZh : project.statementEn
  const description = lang === 'zh' ? project.descriptionZh : project.descriptionEn

  const hint =
    lang === 'zh'
      ? phase === 'title'
        ? '点击名称 · 展开介绍'
        : phase === 'erasing'
          ? '墨迹擦除中…'
          : project.route
            ? '再点一次 · 进入项目'
            : project.github
              ? '再点一次 · 打开 GitHub'
              : '翻面继续逛'
      : phase === 'title'
        ? 'Click the name · expand'
        : phase === 'erasing'
          ? 'Erasing…'
          : project.route
            ? 'Click again · open project'
            : project.github
              ? 'Click again · open GitHub'
              : 'Roll to keep exploring'

  useEffect(() => {
    setPhase('title')
    setTitleSide(preferRightRef.current ? 'right' : 'left')
    setParkedCube(cubeRef.current)
    seededRef.current = false
    onLockChange?.(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- park only on face/write cycle
  }, [writeKey, onLockChange])

  // After load / face change, lock layout to the first measured cube silhouette
  useEffect(() => {
    if (seededRef.current) return
    if (anchor.cube.width < 0.12) return
    setParkedCube(anchor.cube)
    seededRef.current = true
  }, [anchor.cube])

  useEffect(() => {
    if (phase !== 'erasing') return
    onLockChange?.(true)
    const t = window.setTimeout(() => {
      setPhase('body')
      onLockChange?.(false)
    }, ERASE_MS)
    return () => window.clearTimeout(t)
  }, [phase, onLockChange])

  const onActivate = () => {
    if (phase === 'erasing') return
    if (phase === 'title') {
      setPhase('erasing')
      return
    }
    if (project.route) {
      navigate(project.route)
      return
    }
    if (project.github) {
      window.open(project.github, '_blank', 'noreferrer')
    }
  }

  const isBody = phase === 'body'
  const panelSide = isBody ? 'right' : titleSide

  const layout = useMemo(
    () => layoutFromCube(parkedCube, panelSide, isBody ? 'body' : 'title'),
    [parkedCube, panelSide, isBody],
  )

  const panelStyle = useMemo(
    () => ({
      top: layout.top,
      left: layout.left,
      right: layout.right,
      width: layout.width,
      maxWidth: layout.maxWidth,
    }),
    [layout],
  )

  return (
    <div
      className={cn(
        'pointer-events-none absolute z-10 overflow-visible',
        isBody && 'z-[12]',
      )}
      style={panelStyle}
      data-testid="plane-ink"
      data-cube-left={parkedCube.left.toFixed(3)}
      data-cube-right={parkedCube.right.toFixed(3)}
    >
      <button
        type="button"
        onClick={onActivate}
        data-cursor="hover"
        disabled={phase === 'erasing'}
        className="pointer-events-auto block w-full max-w-full cursor-pointer overflow-visible text-left disabled:cursor-wait"
        aria-label={hint}
      >
        <AnimatePresence mode="wait">
          {(phase === 'title' || phase === 'erasing') && (
            <motion.div
              key={`${writeKey}-title`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.25 }}
              className="overflow-visible"
            >
              <p
                className={cn(
                  'plane-ink-title font-hand font-normal leading-[1.2] text-museum-ink',
                  phase === 'erasing' && 'plane-ink-erase',
                )}
                style={{ fontSize: `${layout.titlePx}px` }}
              >
                <span className="plane-ink-write">{project.title}</span>
              </p>
              {phase === 'title' && (
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-museum-muted/80">
                  {hint}
                </p>
              )}
            </motion.div>
          )}

          {phase === 'body' && (
            <motion.div
              key={`${writeKey}-body`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: ZEN }}
              className="space-y-3 overflow-visible"
            >
              <p
                className="font-hand leading-[1.15] text-museum-ink"
                style={{ fontSize: `${Math.max(32, layout.titlePx - 2)}px` }}
              >
                {project.title}
              </p>
              <p className="plane-ink-body font-serif text-[clamp(17px,1.7vw,22px)] leading-relaxed text-ink-2">
                {statement}
              </p>
              <p className="plane-ink-body font-serif text-[15px] leading-relaxed text-museum-muted md:text-[17px]">
                {description}
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-museum-muted/80">
                {hint}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  )
}
