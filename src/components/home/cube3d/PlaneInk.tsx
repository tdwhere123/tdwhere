import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lang } from '@/context/LangContext'
import type { CubeProject } from '../cube-data'
import type { CubeScreenAnchor } from './MuseumCubeCanvas'
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

/** Keep ink panels away from the viewport edge (was 3.5% — too tight). */
const EDGE_PAD_PCT = 8
/**
 * Offset from the cube's projected center toward the free side.
 * Clears most of the cube face while keeping the title visually paired.
 */
const CUBE_GAP_PCT = 12

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
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
  /** Freeze side per face so orbiting doesn't shove the title mid-write. */
  const [titleSide, setTitleSide] = useState<'left' | 'right'>(
    anchor.preferRight ? 'right' : 'left',
  )
  const preferRightRef = useRef(anchor.preferRight)
  preferRightRef.current = anchor.preferRight

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
    onLockChange?.(false)
  }, [writeKey, onLockChange])

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

  const panelSide = phase === 'body' ? 'right' : titleSide

  /** Sit beside the cube (anchor), not pinned to the far corner of the viewport. */
  const panelStyle = useMemo(() => {
    const top = clamp(anchor.y * 100 - 6, 24, 58)
    const maxWidth = `min(360px, calc(100vw - ${EDGE_PAD_PCT * 2}vw))`
    // Leave room for the panel itself so it never hugs the far edge.
    const maxStart = 100 - EDGE_PAD_PCT - 26

    if (panelSide === 'right') {
      const left = clamp(anchor.x * 100 + CUBE_GAP_PCT, EDGE_PAD_PCT, maxStart)
      return {
        top: `${top}%`,
        left: `${left}%`,
        right: 'auto',
        maxWidth,
      } as const
    }

    const right = clamp((1 - anchor.x) * 100 + CUBE_GAP_PCT, EDGE_PAD_PCT, maxStart)
    return {
      top: `${top}%`,
      right: `${right}%`,
      left: 'auto',
      maxWidth,
    } as const
  }, [anchor.x, anchor.y, panelSide])

  return (
    <div
      className="pointer-events-none absolute z-10 w-[min(360px,38vw)] overflow-visible transition-[top,left,right] duration-500 ease-zen"
      style={panelStyle}
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
                  'plane-ink-title font-hand text-[clamp(28px,3.2vw,44px)] font-normal leading-[1.25] text-museum-ink',
                  phase === 'erasing' && 'plane-ink-erase',
                )}
              >
                <span className="plane-ink-write">{project.title}</span>
              </p>
              {phase === 'title' && (
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-museum-muted/80">
                  {hint}
                </p>
              )}
            </motion.div>
          )}

          {phase === 'body' && (
            <motion.div
              key={`${writeKey}-body`}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: ZEN }}
              className="space-y-3 overflow-visible"
            >
              <p className="font-hand text-[clamp(26px,2.8vw,38px)] leading-[1.25] text-museum-ink">
                {project.title}
              </p>
              <p className="plane-ink-body font-serif text-[clamp(15px,1.5vw,19px)] leading-relaxed text-ink-2">
                {statement}
              </p>
              <p className="plane-ink-body font-serif text-[14px] leading-relaxed text-museum-muted md:text-[15px]">
                {description}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-museum-muted/80">
                {hint}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  )
}
