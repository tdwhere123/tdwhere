import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/context/LangContext'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  cubeProjects,
  cubeRotations,
  type CubeStageId,
} from './cube-data'
import MuseumCubeCanvas, { type CubeScreenAnchor } from './cube3d/MuseumCubeCanvas'
import PlaneInk from './cube3d/PlaneInk'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/utils'

function SwipeHintMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="16"
      viewBox="0 0 28 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 8h18M5 5l-3 3 3 3M26 8H8M23 5l3 3-3 3"
        stroke="var(--museum-brass)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  )
}

function MobileCubeShowcase() {
  const { lang } = useLang()
  const [activeIndex, setActiveIndex] = useState(0)
  const [hasSwiped, setHasSwiped] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const root = scrollerRef.current
    if (!root) return

    const observers: IntersectionObserver[] = []
    slideRefs.current.forEach((el, index) => {
      if (!el) return
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveIndex(index)
        },
        { root, threshold: 0.55 },
      )
      io.observe(el)
      observers.push(io)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => {
      if (el.scrollLeft > 8) setHasSwiped(true)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToSlide = useCallback((index: number) => {
    slideRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [])

  return (
    <div className="relative h-[100svh] w-full overflow-hidden">
      <div
        ref={scrollerRef}
        data-lenis-prevent-touch
        className={cn(
          'flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden',
          'touch-pan-x overscroll-x-contain overscroll-y-none',
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        )}
        aria-label={lang === 'zh' ? '项目立方体面' : 'Project cube faces'}
      >
        {cubeProjects.map((project, index) => {
          const rot = cubeRotations[project.id]
          const category = lang === 'zh' ? project.categoryZh : project.categoryEn
          const statement = lang === 'zh' ? project.statementZh : project.statementEn
          const description = lang === 'zh' ? project.descriptionZh : project.descriptionEn
          const cta = lang === 'zh' ? project.ctaZh : project.ctaEn
          const homeSwipeCta =
            lang === 'zh' ? '左右滑动翻面' : 'SWIPE TO ROLL'

          return (
            <section
              key={project.id}
              ref={(el) => {
                slideRefs.current[index] = el
              }}
              className="flex h-full w-full min-w-full shrink-0 snap-center flex-col justify-center px-10 py-14"
              aria-current={index === activeIndex ? 'true' : undefined}
            >
              <div className="mx-auto w-full max-w-[min(300px,78vw)]">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-museum-muted">
                  {project.shortName} · {category}
                </p>
                <h2 className="mt-2 font-serif text-[26px] font-semibold leading-[1.15] text-museum-ink">
                  {project.title}
                </h2>

                <div className="relative mx-auto mt-3 w-full">
                  <div
                    className="relative transition-transform duration-500 ease-zen"
                    style={{
                      transform: `perspective(900px) rotateY(${index === activeIndex ? rot.rotateY * 0.05 : 8}deg)`,
                    }}
                  >
                    <div className="relative aspect-square overflow-hidden bg-[#d6cdc0]">
                      <div
                        className={cn(
                          'cube-face__content',
                          (project.fill ?? 'rect') === 'circle' && 'cube-face__content--circle',
                        )}
                        style={
                          {
                            '--face-fill-scale':
                              project.fillScale ??
                              ((project.fill ?? 'rect') === 'circle' ? 1.42 : 1.14),
                          } as CSSProperties
                        }
                      >
                        <img src={project.image} alt={project.alt} />
                      </div>
                      <img
                        src={asset('cube/shell.png')}
                        alt=""
                        aria-hidden="true"
                        className="cube-face__shell"
                        style={{ mixBlendMode: 'multiply' }}
                      />
                    </div>
                  </div>
                </div>

                <p className="mt-5 font-serif text-[17px] leading-snug text-ink-2">{statement}</p>
                <p className="mt-3 text-[14px] leading-relaxed text-museum-muted">{description}</p>

                {project.tags.length > 0 && (
                  <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-museum-brass">
                    {project.tags.join(' · ')}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  {project.id === 'home' ? (
                    <div className="flex items-center gap-3 text-museum-muted">
                      <SwipeHintMark />
                      <div className="font-mono text-[11px] uppercase tracking-[0.14em]">
                        {homeSwipeCta}
                      </div>
                    </div>
                  ) : project.route ? (
                    <>
                      <Link
                        to={project.route}
                        className="font-mono text-xs uppercase tracking-[0.14em] text-museum-ink"
                      >
                        {cta} ↗
                      </Link>
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs uppercase tracking-[0.14em] text-museum-muted"
                        >
                          GITHUB ↗
                        </a>
                      )}
                    </>
                  ) : project.github ? (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs uppercase tracking-[0.14em] text-museum-ink"
                    >
                      {cta} ↗
                    </a>
                  ) : null}
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-3"
        aria-hidden="true"
      >
        <div
          className={cn(
            'flex items-center gap-2 transition-opacity duration-500',
            hasSwiped ? 'opacity-0' : 'opacity-70',
          )}
        >
          <SwipeHintMark className="animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-museum-muted">
            {lang === 'zh' ? '左右滑动' : 'Swipe sideways'}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {cubeProjects.map((project, index) => (
            <button
              key={project.id}
              type="button"
              aria-label={`${project.shortName} (${index + 1}/${cubeProjects.length})`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => scrollToSlide(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300 ease-zen',
                index === activeIndex
                  ? 'w-5 bg-museum-brass'
                  : 'w-2 bg-museum-line hover:bg-museum-muted',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function RollDownHint({
  anchor,
  lang,
}: {
  anchor: CubeScreenAnchor
  lang: 'zh' | 'en'
}) {
  // Caption only — the hand-ink arrow lives on the museum floor in the canvas.
  return (
    <div
      className="pointer-events-none absolute z-[5] -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${anchor.rollHintX * 100}%`,
        top: `${anchor.rollHintY * 100}%`,
      }}
      aria-hidden="true"
      data-testid="roll-s-label"
    >
      <span className="font-hand text-[11px] leading-none text-museum-ink/55">
        {lang === 'zh' ? 'S · 此向滚' : 'S · this way'}
      </span>
    </div>
  )
}

function DesktopCubeShowcase() {
  const { lang } = useLang()
  const [activeId, setActiveId] = useState<CubeStageId>('home')
  const [writeKey, setWriteKey] = useState(0)
  const [inkLocked, setInkLocked] = useState(false)
  const [anchor, setAnchor] = useState<CubeScreenAnchor>({
    x: 0.5,
    y: 0.62,
    preferRight: true,
    rollHintX: 0.5,
    rollHintY: 0.78,
    rollAngleDeg: 0,
  })

  const project = cubeProjects.find((p) => p.id === activeId) ?? cubeProjects[0]

  const onFaceChange = useCallback((id: CubeStageId) => {
    setActiveId((prev) => {
      if (prev === id) return prev
      setWriteKey((k) => k + 1)
      return id
    })
  }, [])

  const onAnchor = useCallback((a: CubeScreenAnchor) => {
    setAnchor(a)
  }, [])

  const onInkLockChange = useCallback((locked: boolean) => {
    setInkLocked(locked)
  }, [])

  return (
    <div className="relative min-h-[100svh] w-full touch-pan-y">
      <MuseumCubeCanvas
        className="absolute inset-0 z-0 h-[100svh] w-full"
        enabled
        locked={inkLocked}
        onFaceChange={onFaceChange}
        onAnchor={onAnchor}
      />

      <RollDownHint anchor={anchor} lang={lang} />

      <PlaneInk
        project={project}
        lang={lang}
        anchor={anchor}
        writeKey={`${activeId}-${writeKey}`}
        onLockChange={onInkLockChange}
      />

      <p className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 px-6 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-museum-muted">
        {lang === 'zh'
          ? '方向键翻滚 · 拖拽转视角 · 点击手写字'
          : 'Arrows roll · drag to orbit · click the ink'}
      </p>
    </div>
  )
}

export default function CubeShowcase() {
  const isMobile = useIsMobile()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) {
    return <div className="min-h-[100svh]" aria-hidden="true" />
  }

  return isMobile ? <MobileCubeShowcase /> : <DesktopCubeShowcase />
}

export type { CubeStageId }
