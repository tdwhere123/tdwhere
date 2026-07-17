import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useLang } from '@/context/LangContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { useCubeScroll } from '@/hooks/useCubeScroll'
import { cubeProjects, cubeRotations, type CubeStageId } from './cube-data'
import ProjectCube from './ProjectCube'
import ProjectInfo from './ProjectInfo'
import CubeNavigation from './CubeNavigation'
import BrassCrosshair from './svg/BrassCrosshair'
import MuseumPlinth from './svg/MuseumPlinth'
import { useHasScrolledOnce } from './HomeCoda'
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
        { threshold: 0.55 },
      )
      io.observe(el)
      observers.push(io)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const goToStage = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="relative pb-16">
      {cubeProjects.map((project, index) => {
        const rot = cubeRotations[project.id]
        return (
          <section
            key={project.id}
            ref={(el) => {
              sectionRefs.current[index] = el
            }}
            className="flex min-h-[100svh] flex-col justify-center px-5 py-20"
          >
            <ProjectInfo
              project={project}
              lang={lang}
              showScrollHint={project.id === 'home'}
            />
            <div className="relative mx-auto mt-10 w-full max-w-[340px]">
              <BrassCrosshair className="pointer-events-none absolute inset-[-8%] opacity-60" />
              <div
                className="relative transition-transform duration-500 ease-zen"
                style={{
                  transform: `perspective(900px) rotateY(${index === activeIndex ? rot.rotateY * 0.05 : 8}deg)`,
                }}
              >
                <div className="relative aspect-square overflow-hidden">
                  <div className="cube-face__content !inset-[12%]">
                    <img src={project.image} alt={project.alt} className="h-full w-full object-cover" />
                  </div>
                  <div className="cube-face__inner-shadow !inset-[12%]" />
                  <img
                    src="/cube/shell.png"
                    alt=""
                    aria-hidden="true"
                    className="cube-face__shell"
                  />
                  <div className="cube-face__glass" />
                </div>
              </div>
              <MuseumPlinth className="mx-auto mt-2 w-[90%]" />
            </div>
          </section>
        )
      })}

      <div className="sticky bottom-6 z-20 flex justify-center px-5">
        <div className="rounded-full border border-museum-line bg-museum-bg/85 px-4 py-2 backdrop-blur-md">
          <CubeNavigation
            activeId={cubeProjects[activeIndex]?.id ?? 'home'}
            onSelect={goToStage}
          />
        </div>
      </div>
    </div>
  )
}

function DesktopCubeShowcase() {
  const { lang } = useLang()
  const rootRef = useRef<HTMLDivElement>(null)
  const cubeRef = useRef<HTMLDivElement>(null)
  const stageInnerRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const hasScrolled = useHasScrolledOnce()
  const scroll = useCubeScroll({
    enabled: introDone,
    rootRef,
    cubeRef,
  })

  const project = cubeProjects[scroll.activeIndex] ?? cubeProjects[0]

  useEffect(() => {
    const cube = cubeRef.current
    const info = infoRef.current
    if (!cube || !info) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      gsap.set(cube, {
        rotateX: cubeRotations.home.rotateX,
        rotateY: cubeRotations.home.rotateY,
        scale: 1,
        filter: 'blur(0px)',
      })
      gsap.set(info, { opacity: 1, y: 0 })
      setIntroDone(true)
      return
    }

    gsap.set(cube, {
      rotateX: -18,
      rotateY: 28,
      scale: 0.88,
      filter: 'blur(8px)',
    })
    gsap.set(info, { opacity: 0, y: 22 })

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => setIntroDone(true),
    })
    tl.to(cube, {
      scale: 1,
      filter: 'blur(0px)',
      duration: 0.85,
    })
      .to(
        cube,
        {
          rotateX: cubeRotations.home.rotateX,
          rotateY: cubeRotations.home.rotateY,
          duration: 0.9,
          ease: 'power2.inOut',
        },
        '-=0.35',
      )
      .to(
        info,
        { opacity: 1, y: 0, duration: 0.55 },
        '-=0.35',
      )

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <div ref={rootRef} className="cube-showcase-scroll">
      <div className="cube-showcase-stage">
        <div
          ref={stageInnerRef}
          className="mx-auto flex h-full max-w-shell items-center gap-6 px-5 pt-16 md:gap-10 md:px-10 lg:gap-14"
        >
          <div
            className={cn(
              'relative flex w-[48%] max-w-[560px] shrink-0 flex-col items-center transition-transform duration-500 ease-zen',
              hovered && '-translate-y-1',
            )}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <BrassCrosshair className="pointer-events-none absolute left-1/2 top-1/2 w-[118%] -translate-x-1/2 -translate-y-[52%] opacity-70" />
            <ProjectCube
              ref={cubeRef}
              activeId={scroll.activeId}
              interactive={introDone && scroll.isSettled && scroll.activeId !== 'home'}
              hovered={hovered}
              gsapOwned
            />
            <MuseumPlinth className="relative z-0 mt-[-2%] w-[92%]" />
          </div>

          <div ref={infoRef} className="min-w-0 flex-1 pr-10 lg:pr-16">
            <ProjectInfo
              project={project}
              lang={lang}
              showScrollHint={introDone && !hasScrolled}
            />
          </div>
        </div>

        <div className="pointer-events-none absolute right-5 top-1/2 z-20 -translate-y-1/2 md:right-8 lg:right-10">
          <CubeNavigation activeId={scroll.activeId} onSelect={scroll.goToStage} />
        </div>
      </div>
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
