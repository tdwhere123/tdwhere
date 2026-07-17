import { useEffect, useState } from 'react'

type Options = {
  /** ms per character (zh 55, en 22 per design) */
  typeMs?: number
  /** delay before the first character */
  startDelayMs?: number
}

/**
 * Type-once typewriter (about-page signature): types the line once, then holds
 * it forever — no delete/loop. With prefers-reduced-motion the full line is
 * shown immediately.
 */
export default function useTypeOnce(text: string, opts: Options = {}): string {
  const { typeMs = 55, startDelayMs = 0 } = opts
  const [reduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [typed, setTyped] = useState(() => (reduced ? text : ''))

  useEffect(() => {
    if (reduced) return undefined

    const chars = Array.from(text)
    let i = 0
    let timer = 0

    const tick = () => {
      i += 1
      setTyped(chars.slice(0, i).join(''))
      if (i >= chars.length) return
      timer = window.setTimeout(tick, typeMs)
    }

    timer = window.setTimeout(tick, startDelayMs + typeMs)
    return () => window.clearTimeout(timer)
  }, [text, typeMs, startDelayMs, reduced])

  return reduced ? text : typed
}
