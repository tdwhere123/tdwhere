import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null
let rafCallback: ((time: number) => void) | null = null
/** Desired Lenis on/off — applied when init runs and when routes change. */
let desiredActive = true

/** Site-wide Lenis smooth scroll (lerp 0.09, smoothWheel). Synced with GSAP ScrollTrigger. */
export function initSmoothScroll(): () => void {
  if (lenis) return () => undefined

  // Keep touch native (syncTouch: false) so phones can freely pan-scroll;
  // only smooth the wheel path on desktop.
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

  if (!desiredActive) lenis.stop()

  return () => {
    if (rafCallback) gsap.ticker.remove(rafCallback)
    rafCallback = null
    lenis?.destroy()
    lenis = null
  }
}

/** Pause Lenis (native scroll) or resume smoothing — used to keep `/` snappy. */
export function setSmoothScrollActive(active: boolean) {
  desiredActive = active
  if (!lenis) return
  if (active) lenis.start()
  else lenis.stop()
}

/** Resume Lenis only when the current route wants smoothing (home stays native). */
export function resumeSmoothScroll() {
  if (!lenis) return
  if (desiredActive) lenis.start()
  else lenis.stop()
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
