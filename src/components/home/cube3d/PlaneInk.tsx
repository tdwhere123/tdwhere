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

/** Keep ink panels away from the viewport edge. */
const EDGE_PAD_PCT = 7
/**
 * Extra gap past the cube silhouette (anchor already sits just outside).
 * Title needs less; expanded body needs a clearer side column.
 */
const TITLE_GAP_PCT = 4

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
  /** Park the panel beside the cube only when the face changes — live orbit must not jitter the ink. */
  const [parked, setParked] = useState({ x: anchor.x, y: anchor.y })
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
    setParked({ x: anchor.x, y: anchor.y })
    onLockChange?.(false)
    // Only re-park when the face / write cycle changes — not on every orbit frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: ignore live anchor
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
  const isBody = phase === 'body'

  /**
   * Title: beside the cube, clear of its silhouette.
   * Body: a calmer right-side reading column — not glued to the cube edge.
   */
  const panelStyle = useMemo(() => {
    if (isBody) {
      // Dedicated side column — clear of cube + S-arrow zone
      return {
        top: '22%',
        left: 'auto',
        right: `${EDGE_PAD_PCT}%`,
        width: 'min(340px, 32vw)',
        maxWidth: `min(340px, calc(100vw - ${EDGE_PAD_PCT * 2}vw))`,
      } as const
    }

    const top = clamp(parked.y * 100 - 4, 26, 48)
    const gap = TITLE_GAP_PCT
    const maxWidth = `min(300px, calc(100vw - ${EDGE_PAD_PCT * 2}vw))`
    const maxStart = 100 - EDGE_PAD_PCT - 22

    if (panelSide === 'right') {
      const left = clamp(parked.x * 100 + gap, EDGE_PAD_PCT, maxStart)
      return {
        top: `${top}%`,
        left: `${left}%`,
        right: 'auto',
        width: 'min(300px, 34vw)',
        maxWidth,
      } as const
    }

    const right = clamp((1 - parked.x) * 100 + gap, EDGE_PAD_PCT, maxStart)
    return {
      top: `${top}%`,
      right: `${right}%`,
      left: 'auto',
      width: 'min(300px, 34vw)',
      maxWidth,
    } as const
  }, [parked.x, parked.y, panelSide, isBody])

  return (
    <div
      className={cn(
        'pointer-events-none absolute z-10 overflow-visible',
        isBody && 'z-[12]',
      )}
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
                  'plane-ink-title font-hand text-[clamp(26px,2.8vw,40px)] font-normal leading-[1.2] text-museum-ink',
                  phase === 'erasing' && 'plane-ink-erase',
                )}
              >
                <span className="plane-ink-write">{project.title}</span>
              </p>
              {phase === 'title' && (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-museum-muted/80">
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
              <p className="font-hand text-[clamp(24px,2.6vw,36px)] leading-[1.2] text-museum-ink">
                {project.title}
              </p>
              <p className="plane-ink-body font-serif text-[clamp(14px,1.35vw,17px)] leading-relaxed text-ink-2">
                {statement}
              </p>
              <p className="plane-ink-body font-serif text-[13px] leading-relaxed text-museum-muted md:text-[14px]">
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
