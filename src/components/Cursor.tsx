import { useEffect, useRef } from 'react'

/**
 * Custom desktop cursor (design 7.4): 8px tea ink dot + 36px stroked ring, lerp 0.15.
 * Ring grows to 56px and dot turns seal over interactive elements.
 * Native cursor returns inside inputs/terminals. Disabled on touch devices.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    document.body.classList.add('custom-cursor')

    const target = { x: -100, y: -100 }
    const ring = { x: -100, y: -100 }
    let hovering = false
    let native = false
    let raf = 0

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX
      target.y = e.clientY
      const el = e.target as HTMLElement | null
      hovering = !!el?.closest('a, button, [role="button"], [data-cursor="hover"]')
      native = !!el?.closest('input, textarea, [contenteditable="true"], [data-native-cursor]')
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%) scale(${native ? 0 : 1})`
        dotRef.current.style.backgroundColor = hovering ? 'var(--seal)' : 'var(--tea)'
      }
    }

    const loop = () => {
      ring.x += (target.x - ring.x) * 0.15
      ring.y += (target.y - ring.y) * 0.15
      if (ringRef.current) {
        const size = hovering ? 56 : 36
        ringRef.current.style.width = `${size}px`
        ringRef.current.style.height = `${size}px`
        ringRef.current.style.opacity = native ? '0' : hovering ? '0.55' : '1'
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      document.body.classList.remove('custom-cursor')
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[95] hidden h-2 w-2 rounded-full bg-tea md:block"
        style={{ transition: 'background-color 0.3s' }}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[95] hidden h-9 w-9 rounded-full border border-tea md:block"
        style={{ transition: 'width 0.25s, height 0.25s, opacity 0.25s' }}
      />
    </>
  )
}
