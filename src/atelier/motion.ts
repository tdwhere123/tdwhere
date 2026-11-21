import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger, SplitText)

export { gsap, ScrollTrigger }

/**
 * One curve and three lengths for every entrance on the site, so that whatever moves
 * moves to the same beat. CSS mirrors them as --a-ease and --a-t-*.
 */
export const EASE = 'expo.out'
export const T = { quick: 0.45, base: 0.95, slow: 1.5 }

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis: Lenis | null = null

/**
 * Inertial scrolling for the whole site. Nested scrolling areas (the reading list, the desk,
 * the ledger) keep their own native scroll; anything marked data-lenis-prevent is left alone.
 */
export function startSmoothScroll() {
  if (lenis || reducedMotion()) return () => {}
  const instance = new Lenis({ autoRaf: false, lerp: 0.085, allowNestedScroll: true })
  lenis = instance
  instance.on('scroll', ScrollTrigger.update)
  const tick = (time: number) => instance.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  document.documentElement.classList.add('a-motion')
  return () => {
    gsap.ticker.remove(tick)
    instance.destroy()
    if (lenis === instance) lenis = null
    document.documentElement.classList.remove('a-motion')
  }
}

/** Jump without easing (a new page starts at its top). */
export function jumpTo(y: number) {
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
  else window.scrollTo({ top: y, behavior: 'auto' })
}

/** Glide to a place on the page, or to an element. */
export function glideTo(target: number | HTMLElement) {
  if (lenis) lenis.scrollTo(target, { duration: 1.4 })
  else if (typeof target === 'number') window.scrollTo({ top: target, behavior: reducedMotion() ? 'auto' : 'smooth' })
  else target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' })
}

/** Hold the page still under a full-screen layer (the opening, the desk). */
export function holdScroll(hold: boolean) {
  if (hold) lenis?.stop()
  else lenis?.start()
}

/**
 * Entrances for one page: headings marked data-rise come up line by line out of a slot,
 * blocks marked data-fade settle into place. Each runs once, when it first comes into view.
 * Returns a cleanup that puts the text back as it was.
 */
export function enter(root: HTMLElement) {
  if (reducedMotion()) return () => {}
  const splits: SplitText[] = []
  const ctx = gsap.context(() => {
    root.querySelectorAll<HTMLElement>('[data-rise]:not([data-risen])').forEach((el) => {
      el.dataset.risen = ''
      const split = SplitText.create(el, { type: 'chars,lines', mask: 'lines', linesClass: 'a-line' })
      splits.push(split)
      gsap.set(el, { autoAlpha: 1 })
      gsap.from(split.lines, {
        yPercent: 108,
        duration: T.slow,
        ease: EASE,
        stagger: 0.09,
        delay: Number(el.dataset.rise) || 0,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      })
    })
    root.querySelectorAll<HTMLElement>('[data-fade]:not([data-risen])').forEach((el) => {
      el.dataset.risen = ''
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: T.base,
          ease: EASE,
          delay: Number(el.dataset.fade) || 0,
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        },
      )
    })
  }, root)
  ScrollTrigger.refresh()
  return () => {
    ctx.revert()
    splits.forEach((s) => s.revert())
    root.querySelectorAll<HTMLElement>('[data-risen]').forEach((el) => delete el.dataset.risen)
  }
}
