import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getLenis } from '@/lib/smooth-scroll'
import {
  cubeProjects,
  cubeRotations,
  type CubeStageId,
} from '@/components/home/cube-data'
import { useNavigate } from 'react-router-dom'

gsap.registerPlugin(ScrollTrigger)

const SECTIONS = cubeProjects.length

export type CubeScrollState = {
  activeIndex: number
  activeId: CubeStageId
  rotateX: number
  rotateY: number
  progress: number
  isSettled: boolean
  goToStage: (index: number) => void
}

type Options = {
  enabled: boolean
  rootRef: React.RefObject<HTMLElement | null>
  cubeRef: React.RefObject<HTMLElement | null>
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

export function useCubeScroll({ enabled, rootRef, cubeRef }: Options): CubeScrollState {
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [rotation, setRotation] = useState(cubeRotations.home)
  const [isSettled, setIsSettled] = useState(true)
  const activeIndexRef = useRef(0)
  const settledRef = useRef(true)

  const activeId = cubeProjects[activeIndex]?.id ?? 'home'

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    settledRef.current = isSettled
  }, [isSettled])

  const goToStage = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(SECTIONS - 1, index))
      const root = rootRef.current
      const lenis = getLenis()

      if (!root || !enabled) {
        const id = cubeProjects[clamped]?.id ?? 'home'
        const target = cubeRotations[id]
        setActiveIndex(clamped)
        setRotation(target)
        if (cubeRef.current) {
          gsap.to(cubeRef.current, {
            rotateX: target.rotateX,
            rotateY: target.rotateY,
            duration: prefersReducedMotion() ? 0.25 : 0.7,
            ease: 'power2.inOut',
          })
        }
        return
      }

      const rect = root.getBoundingClientRect()
      const top = window.scrollY + rect.top
      const scrollable = Math.max(root.offsetHeight - window.innerHeight, 1)
      const targetY = top + (clamped / (SECTIONS - 1)) * scrollable

      if (lenis) {
        lenis.scrollTo(targetY, { duration: 1.05 })
      } else {
        window.scrollTo({ top: targetY, behavior: 'smooth' })
      }
    },
    [cubeRef, enabled, rootRef],
  )

  useEffect(() => {
    if (!enabled || !rootRef.current || !cubeRef.current) return

    const root = rootRef.current
    const cube = cubeRef.current
    const reduced = prefersReducedMotion()

    gsap.set(cube, {
      rotateX: cubeRotations.home.rotateX,
      rotateY: cubeRotations.home.rotateY,
      transformPerspective: 1400,
    })

    const stages = cubeProjects.map((p) => cubeRotations[p.id])
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: reduced ? true : 0.8,
        onUpdate(self) {
          const raw = self.progress * (SECTIONS - 1)
          const stage = Math.round(raw)
          const frac = Math.abs(raw - stage)
          setProgress(self.progress)
          setActiveIndex(stage)
          setIsSettled(frac < 0.12)
          setRotation({
            rotateX: Number(gsap.getProperty(cube, 'rotateX')),
            rotateY: Number(gsap.getProperty(cube, 'rotateY')),
          })
        },
      },
    })

    stages.forEach((stage, i) => {
      if (i === 0) {
        tl.set(cube, { rotateX: stage.rotateX, rotateY: stage.rotateY })
      } else {
        tl.to(cube, {
          rotateX: stage.rotateX,
          rotateY: stage.rotateY,
          ease: 'none',
          duration: 1,
        })
      }
    })

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [enabled, rootRef, cubeRef])

  useEffect(() => {
    if (!enabled) return

    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (
        el?.tagName === 'INPUT' ||
        el?.tagName === 'TEXTAREA' ||
        el?.isContentEditable
      ) {
        return
      }

      const idx = activeIndexRef.current

      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault()
        goToStage(idx + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        goToStage(idx - 1)
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        goToStage(idx + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        goToStage(idx - 1)
      } else if (e.key === 'Enter') {
        const project = cubeProjects[idx]
        if (!project || project.id === 'home' || !settledRef.current) return
        if (project.route) navigate(project.route)
        else if (project.github) window.open(project.github, '_blank', 'noreferrer')
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, goToStage, navigate])

  return useMemo(
    () => ({
      activeIndex,
      activeId,
      rotateX: rotation.rotateX,
      rotateY: rotation.rotateY,
      progress,
      isSettled,
      goToStage,
    }),
    [activeIndex, activeId, rotation, progress, isSettled, goToStage],
  )
}
