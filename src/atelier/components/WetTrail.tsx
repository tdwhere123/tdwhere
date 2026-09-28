import { useEffect, useRef } from 'react'
import { useQuiet } from '../hooks'

const washes = {
  paper: ['111, 129, 153', '200, 154, 79', '164, 98, 60', '111, 127, 79'],
  night: ['231, 201, 130', '159, 192, 205', '216, 179, 110'],
}
type Drop = {
  x: number
  y: number
  r0: number
  spread: number
  born: number
  life: number
  rgb: string
  alpha: number
  squash: number
  tilt: number
  lumps: [number, number, number][]
}

/**
 * Pointer movement leaves a wet wash that bleeds outward into the paper,
 * darkens at its edge like watercolor, and dries away. No cursor shape.
 */
export default function WetTrail({ tone }: { tone: 'paper' | 'night' }) {
  const ref = useRef<HTMLCanvasElement>(null),
    toneRef = useRef(tone)
  const quiet = useQuiet()
  useEffect(() => {
    toneRef.current = tone
  }, [tone])
  useEffect(() => {
    const canvas = ref.current,
      ctx = canvas?.getContext('2d')
    if (quiet || !matchMedia('(pointer: fine)').matches || !canvas || !ctx)
      return
    const drops: Drop[] = []
    let raf = 0,
      last: { x: number; y: number; t: number } | null = null,
      rgb = washes.paper[0]
    const resize = () => {
      canvas.width = Math.round(innerWidth * 0.5)
      canvas.height = Math.round(innerHeight * 0.5)
      ctx.setTransform(0.5, 0, 0, 0.5, 0, 0)
    }
    const drop = (x: number, y: number, r0: number, spread: number, alpha: number, life: number) => {
      if (drops.length > 160) drops.shift()
      drops.push({
        x,
        y,
        r0,
        spread,
        born: performance.now(),
        life,
        rgb,
        alpha,
        squash: 0.7 + Math.random() * 0.5,
        tilt: Math.random() * Math.PI,
        lumps: Array.from({ length: 3 }, () => [
          (Math.random() - 0.5) * 0.9,
          (Math.random() - 0.5) * 0.9,
          0.45 + Math.random() * 0.45,
        ]),
      })
    }
    const frame = (now: number) => {
      raf = 0
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i],
          age = now - d.born
        if (age > d.life) {
          drops.splice(i, 1)
          continue
        }
        const t = age / d.life
        const r = d.r0 + d.spread * (1 - Math.exp(-age / 380))
        const a = d.alpha * (1 - t) ** 1.6
        ctx.save()
        ctx.translate(d.x, d.y)
        ctx.rotate(d.tilt)
        ctx.scale(1, d.squash)
        for (const [lx, ly, lr] of [[0, 0, 1] as const, ...d.lumps]) {
          const rr = r * lr
          const g = ctx.createRadialGradient(lx * r, ly * r, 0, lx * r, ly * r, rr)
          g.addColorStop(0, `rgba(${d.rgb}, ${a * 0.7})`)
          g.addColorStop(0.8, `rgba(${d.rgb}, ${a * 0.9})`)
          g.addColorStop(1, `rgba(${d.rgb}, 0)`)
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(lx * r, ly * r, rr, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
      if (drops.length) raf = requestAnimationFrame(frame)
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const p = { x: e.clientX, y: e.clientY, t: e.timeStamp }
      if (!last || p.t - last.t > 300) {
        const set = washes[toneRef.current]
        rgb = set[Math.floor(Math.random() * set.length)]
        last = p
        return
      }
      const dist = Math.hypot(p.x - last.x, p.y - last.y)
      if (dist < 14) return
      const speed = dist / Math.max(8, p.t - last.t)
      const pooled = Math.max(0, 1 - speed * 0.6)
      drop(
        p.x + (Math.random() - 0.5) * 6,
        p.y + (Math.random() - 0.5) * 6,
        4 + pooled * 6,
        14 + pooled * 26 + Math.random() * 10,
        0.07 + pooled * 0.06,
        1300 + pooled * 900,
      )
      last = p
      wake()
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      drop(e.clientX, e.clientY, 8, 70 + Math.random() * 30, 0.2, 2600)
      wake()
    }
    resize()
    addEventListener('resize', resize)
    addEventListener('pointermove', onMove, { passive: true })
    addEventListener('pointerdown', onDown, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize)
      removeEventListener('pointermove', onMove)
      removeEventListener('pointerdown', onDown)
      ctx.clearRect(0, 0, innerWidth, innerHeight)
    }
  }, [quiet])
  if (quiet) return null
  return (
    <canvas ref={ref} className="a-wet" data-tone={tone} aria-hidden="true" />
  )
}
