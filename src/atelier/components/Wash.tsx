import { useEffect, useRef } from 'react'

// paper tones, with a little of the pond's blue and green so the edge belongs to the painting
/** How far the wash canvas reaches past the copy, in CSS px; matches `.a-wash`. */
const REACH = 110
const paper = ['#f7f3ea', '#f2ede1', '#ece7db', '#f5f0e5', '#e8e6de', '#efeadf', '#e4ebec', '#e7ebe0']

/**
 * A pale wash brushed behind a block of copy, so it reads as paint laid on
 * the painting rather than a card placed over it. Fills its positioned parent
 * and overflows it, so the ragged edge falls outside the copy.
 */
export default function Wash({ colors = paper }: { colors?: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let raf = 0,
      cancelled = false,
      painted = ''
    const draw = () => {
      raf = 0
      const { width, height } = canvas.getBoundingClientRect()
      const unit = Math.min(devicePixelRatio || 1, 2)
      const size = `${Math.round(width * unit)}x${Math.round(height * unit)}`
      if (width < 2 || size === painted) return
      void import('../paint/painter').then(({ paintWash }) => {
        if (cancelled) return
        canvas.width = Math.round(width * unit)
        canvas.height = Math.round(height * unit)
        paintWash(canvas, colors, unit, REACH * unit)
        painted = size
      })
    }
    const ro = new ResizeObserver(() => {
      if (!raf) raf = requestAnimationFrame(draw)
    })
    ro.observe(canvas)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [colors])
  return <canvas ref={ref} className="a-wash" aria-hidden="true" />
}
