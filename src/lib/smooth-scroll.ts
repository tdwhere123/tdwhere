import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null
let rafCallback: ((time: number) => void) | null = null
/** Desired Lenis on/off — applied when init runs and when routes change. */
let desiredActive = true

/**
 * Site-wide Lenis smooth scroll (lerp 0.09, smoothWheel). Synced with GSAP ScrollTrigger.
 * Keep touch native (syncTouch: false) so phones can freely pan-scroll;
 * only smooth the wheel path on desktop.
 */
function createLenis() {
  if (lenis) return
  lenis = new Lenis({
    lerp: 0.09,
    smoothWheel: true,
    syncTouch: false,
    touchMultiplier: 1.15,
  })
  lenis.on('scroll', ScrollTrigger.update)

  rafCallback = (time: number) => {
    lenis?.raf(time * 1000)
  }
  gsap.ticker.add(rafCallback)
  gsap.ticker.lagSmoothing(0)
}

/**
 * Fully tear Lenis down. Never leave a stopped instance around:
 * Lenis registers a non-passive wheel listener on window, and a stopped
 * Lenis preventDefault()s every wheel event (it is meant as a modal lock),
 * which kills native page scroll entirely.
 */
function destroyLenis() {
  if (rafCallback) gsap.ticker.remove(rafCallback)
  rafCallback = null
  lenis?.destroy()
  lenis = null
}

export function initSmoothScroll(): () => void {
  if (desiredActive) createLenis()
  return destroyLenis
}

/** Native scroll on `/` (no Lenis instance); smoothing elsewhere. */
export function setSmoothScrollActive(active: boolean) {
  desiredActive = active
  if (active) createLenis()
  else destroyLenis()
}

/** Resume Lenis after a temporary stop (e.g. mobile menu lock) — only on routes that want smoothing. */
export function resumeSmoothScroll() {
  if (!lenis) return
  if (desiredActive) lenis.start()
}

export function getLenis(): Lenis | null {
  return lenis
}

/** Jump back to the top instantly (used on route change + footer button). */
export function scrollToTop(immediate = true) {
  if (lenis && desiredActive) {
    lenis.scrollTo(0, { immediate })
  } else {
    window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' })
  }
}
