import { useEffect, useRef, useState } from 'react'

type Options = {
  /** ms per character while typing (zh 55, en 22 per design) */
  typeMs?: number
  /** ms per character while deleting */
  deleteMs?: number
  /** pause after a line completes */
  holdMs?: number
  /** delay before the first character */
  startDelayMs?: number
}

/**
 * Looping typewriter: types each line, holds, deletes, moves to the next.
 * With prefers-reduced-motion the first line is shown in full, statically.
 * `lines` is compared by content, so inline arrays are safe.
 */
export default function useTypewriter(lines: string[], opts: Options = {}): string {
  const { typeMs = 55, deleteMs = 26, holdMs = 3200, startDelayMs = 0 } = opts
  const [text, setText] = useState('')
  const linesRef = useRef(lines)
  const linesKey = JSON.stringify(lines)

  /* keep the latest lines available to the loop without touching refs in render */
  useEffect(() => {
    linesRef.current = lines
  })

  useEffect(() => {
    const source = linesRef.current
    if (source.length === 0) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setText(source[0])
      return undefined
    }

    const state = { line: 0, char: 0, phase: 'typing' as 'typing' | 'holding' | 'deleting' }
    setText('')
    let timer = 0

    const tick = () => {
      const current = Array.from(source[state.line] ?? '')

      if (state.phase === 'typing') {
        state.char += 1
        setText(current.slice(0, state.char).join(''))
        if (state.char >= current.length) {
          state.phase = 'holding'
          timer = window.setTimeout(tick, holdMs)
          return
        }
        timer = window.setTimeout(tick, typeMs)
      } else if (state.phase === 'holding') {
        state.phase = 'deleting'
        timer = window.setTimeout(tick, deleteMs)
      } else {
        state.char -= 1
        setText(current.slice(0, Math.max(0, state.char)).join(''))
        if (state.char <= 0) {
          state.line = (state.line + 1) % source.length
          state.phase = 'typing'
          timer = window.setTimeout(tick, typeMs * 6)
          return
        }
        timer = window.setTimeout(tick, deleteMs)
      }
    }

    timer = window.setTimeout(tick, startDelayMs + typeMs)
    return () => window.clearTimeout(timer)
  }, [linesKey, typeMs, deleteMs, holdMs, startDelayMs])

  return text
}
