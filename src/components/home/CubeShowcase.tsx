import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLang } from '@/context/LangContext'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  cubeProjects,
  cubeRotations,
  type CubeStageId,
} from './cube-data'
import ProjectInfo from './ProjectInfo'
import MuseumCubeCanvas, { type CubeScreenAnchor } from './cube3d/MuseumCubeCanvas'
import PlaneInk from './cube3d/PlaneInk'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/utils'

function MobileCubeShowcase() {
  const { lang } = useLang()
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    sectionRefs.current.forEach((el, index) => {
      if (!el) return
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveIndex(index)
        },
        { threshold: 0.45, rootMargin: '-10% 0px -10% 0px' },
      )
      io.observe(el)
      observers.push(io)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <div className="relative touch-pan-y pb-16">
      {cubeProjects.map((project, index) => {
        const rot = cubeRotations[project.id]
        return (
          <section
            key={project.id}
            ref={(el) => {
              sectionRefs.current[index] = el
            }}
            className="flex min-h-[100svh] flex-col justify-center px-7 py-16 sm:px-8"
          >
            <ProjectInfo
              project={project}
              lang={lang}
              showScrollHint={project.id === 'home'}
              compact
            />
            <div className="relative mx-auto mt-5 w-full max-w-[min(300px,78vw)]">
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
          </section>
        )
      })}
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
