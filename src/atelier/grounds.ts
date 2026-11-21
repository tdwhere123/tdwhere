/** The authored ground is independent of the roll catalog and its derivative URLs. */
import homeStill from '../assets/ground/home.jpg'
import homePainted from '../assets/ground/home-painted.webp'
import homePaintedWide from '../assets/ground/home-painted-2560.webp'
import homeRelief from '../assets/ground/home-relief.webp'
import type { FilmFrame, Words } from './film'

function ground(name: string, src: string, focus: string, alt: Words): FilmFrame {
  return { id: `ground/${name}`, roll: 'ground', name, src, focus, alt }
}

/** The home page: a wave breaking at Zhujiajian, Zhoushan (Kodak Gold, November 2023). Not a roll. */
export const heroFrame = ground('home', homeStill, '50% 38%', {
  zh: '朱家尖的海：一道浪正在卷起，远处是山和一块礁石。',
  en: 'The sea at Zhujiajian: a wave breaking, a headland and a rock beyond.',
})

/** Where the sea meets the sky in the hero frame, from its top (paint/painter.ts bakes with the same line). */
export const HORIZON = 0.135

/**
 * The hero frame as painted (scripts/bake-home.mjs): one bake at two sizes, the larger
 * only for screens with the pixels to show it, and the paint's thickness for the live light.
 */
export function homePainting() {
  const pixels = (globalThis.devicePixelRatio || 1) * Math.max(globalThis.innerWidth || 0, (globalThis.innerHeight || 0) * 1.5)
  return { src: pixels > 1800 ? homePaintedWide : homePainted, relief: homeRelief }
}
