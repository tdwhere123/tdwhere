import { useCallback, useEffect, useRef, useState } from 'react'

const GLYPHS = '!<>-_/[]{}=+*^?#01'

type Props = {
  text: string
  className?: string
}

/**
 * Hover text-scramble for nav links: letters shuffle through glyphs and
 * decode left to right. Visual only; callers keep the real label in an
 * aria-label (this span is aria-hidden). Runs only on fine-pointer devices
 * and freezes under prefers-reduced-motion. All rAF timers are cleaned up
 * on unmount, text change, and mouseleave.
 */
export default function NavScramble({ text, className }: Props) {
  const [display, setDisplay] = useState(text)
  const [prevText, setPrevText] = useState(text)
  const rafRef = useRef(0)

  // Adjust state when the text prop changes (React-recommended render-phase pattern).
  if (text !== prevText) {
    setPrevText(text)
    setDisplay(text)
  }

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
  }, [])

  // Cancel any in-flight scramble when text changes or on unmount — no setState.
  useEffect(() => () => stop(), [text, stop])

  const start = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    stop()

    const chars = Array.from(text)
    // Each char shuffles for a staggered window, then resolves left to right.
    const perChar = 4
    const tail = 10
    const total = chars.length * perChar + tail
    let frame = 0

    const tick = () => {
      frame += 1
      let done = true
      const next = chars
        .map((ch, i) => {
          if (ch === ' ') return ch
          if (frame >= i * perChar + tail) return ch
          done = false
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        })
        .join('')
      setDisplay(done ? text : next)
      if (!done && frame < total) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = 0
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [text, stop])

  const restore = useCallback(() => {
    stop()
    setDisplay(text)
  }, [stop, text])

  return (
    <span aria-hidden="true" className={className} onMouseEnter={start} onMouseLeave={restore}>
      {display}
    </span>
  )
}
