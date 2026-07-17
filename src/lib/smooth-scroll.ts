import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null
let rafCallback: ((time: number) => void) | null = null

/** Site-wide Lenis smooth scroll (lerp 0.09, smoothWheel). Synced with GSAP ScrollTrigger. */
export function initSmoothScroll(): () => void {
  if (lenis) return () => undefined

  lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)

  rafCallback = (time: number) => {
    lenis?.raf(time * 1000)
  }
  gsap.ticker.add(rafCallback)
  gsap.ticker.lagSmoothing(0)

  return () => {
    if (rafCallback) gsap.ticker.remove(rafCallback)
    rafCallback = null
    lenis?.destroy()
    lenis = null
  }
}

export function getLenis(): Lenis | null {
  return lenis
}

/** Jump back to the top instantly (used on route change + footer button). */
export function scrollToTop(immediate = true) {
  if (lenis) {
    lenis.scrollTo(0, { immediate })
  } else {
    window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' })
  }
}
