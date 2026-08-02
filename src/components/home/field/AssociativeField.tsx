import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * The field, redrawn as a memory domain （域） — from the UGAF sketch in
 * .do-it/brainstorm/do-soul-alaya-UGAF-math-core.md, but kept purely visual:
 *
 *   · memory objects arrive one by one — particles bloom into existence.
 *     All particles share one size; only colour speaks: ink for traces,
 *     clay for keys, seal for the five project anchors.
 *   · each arrival links to its nearest neighbours — the field weaves itself.
 *   · every few seconds a small region is activated: a wave walks the paths,
 *     hop by hop, and the traversed structure holds its light for a moment —
 *     a stable structure — before relaxing into a faint memory trace.
 *   · once in a while the wave starts from an anchor and ends in a governed
 *     Select_Γ: the reached structure burns clay-bright while the field dims.
 *
 * Timing and layout are stochastic — the field is different on every visit.
 * Canvas 2D driven by one rAF loop; pauses offscreen / when the tab hides;
 * a single still frame under prefers-reduced-motion.
 */

const INK_RGB = '23,24,28'
const CLAY_RGB = '150,104,74'
const SEAL_RGB = '143,74,50'

const PROJECT_IDS = ['do-it', 'alaya', 'write-right', 'sentinel', 'vegetarian'] as const

/** Spread zones for the five anchor particles (x, y relative; z depth). */
const ANCHOR_ZONES: ReadonlyArray<readonly [number, number, number]> = [
  [0.22, 0.26, -0.3],
  [0.78, 0.28, 0.25],
  [0.5, 0.52, 0],
  [0.24, 0.78, -0.15],
  [0.76, 0.8, 0.35],
]

type Particle = {
  /** relative position (x, y in 0..1) + depth (z in -0.5..0.5) */
  x: number
  y: number
  z: number
  born: number
  kind: 'trace' | 'key' | 'anchor'
  rgb: string
  phase: number
  glow: number
  trace: number
  hl: number
  dyingAt: number | null
  projectId: string | null
}

type Edge = { a: number; b: number; born: number }

type WaveEntry = { idx: number; at: number; level: number }
type Wave = { entries: WaveEntry[]; select: boolean; born: number; hold: number; decay: number }

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const smoothstep = (t: number) => {
  const x = Math.min(Math.max(t, 0), 1)
  return x * x * (3 - 2 * x)
}

const HOP_LEVELS = [1, 0.72, 0.5, 0.34, 0.24]

export type AssociativeFieldProps = {
  /** hero = sparse backdrop under the cube; section = full field beside the works index */
  variant?: 'hero' | 'section'
  /** project id to light up (hover from the works index) */
  highlight?: string | null
  className?: string
}

export default function AssociativeField({
  variant = 'section',
  highlight = null,
  className,
}: AssociativeFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()
  const hero = variant === 'hero'
  const highlightRef = useRef(highlight)
  useEffect(() => {
    highlightRef.current = highlight
  }, [highlight])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const ctx: CanvasRenderingContext2D = context

    const mobile = window.matchMedia('(max-width: 768px)').matches
    const CAP = hero ? (mobile ? 32 : 60) : mobile ? 68 : 120
    const alphaScale = hero ? 0.5 : 1
    const R = hero ? 2 : 3

    let W = 0
    let H = 0
    const particles: Particle[] = []
    const edges: Edge[] = []
    const waves: Wave[] = []
    // per-frame projection buffers (reused — no per-frame allocation)
    const projX: number[] = []
    const projY: number[] = []
    const projS: number[] = []

    let now = performance.now()
    let nextStoreAt = now + 300
    let nextWaveAt = now + rand(2600, 4200)
    let nextSelectAt = now + rand(17000, 24000)
    let anchorsPlaced = 0

    /** 3D distance in unit space — keeps the point cloud from clumping in depth too. */
    const dist3 = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) =>
      Math.hypot(ax - bx, ay - by, (az - bz) * 0.9)

    function store() {
      let x: number
      let y: number
      let z: number
      let kind: Particle['kind']
      let projectId: string | null = null

      if (anchorsPlaced < PROJECT_IDS.length) {
        const [zx, zy, zz] = ANCHOR_ZONES[anchorsPlaced]
        x = Math.min(Math.max(zx + rand(-0.07, 0.07), 0.08), 0.92)
        y = Math.min(Math.max(zy + rand(-0.07, 0.07), 0.1), 0.9)
        z = zz + rand(-0.06, 0.06)
        kind = 'anchor'
        projectId = PROJECT_IDS[anchorsPlaced]
        anchorsPlaced += 1
      } else {
        // rejection sampling keeps the cloud from clumping
        x = rand(0.06, 0.94)
        y = rand(0.08, 0.92)
        z = rand(-0.4, 0.4)
        for (let tries = 0; tries < 24; tries++) {
          const cx = rand(0.06, 0.94)
          const cy = rand(0.08, 0.92)
          const cz = rand(-0.4, 0.4)
          const clear = particles.every((p) => dist3(p.x, p.y, p.z, cx, cy, cz) > 0.08)
          x = cx
          y = cy
          z = cz
          if (clear) break
        }
        kind = Math.random() < 0.18 ? 'key' : 'trace'
      }

      const p: Particle = {
        x,
        y,
        z,
        born: now,
        kind,
        rgb: kind === 'anchor' ? SEAL_RGB : kind === 'key' ? CLAY_RGB : INK_RGB,
        phase: rand(0, Math.PI * 2),
        glow: 0,
        trace: 0,
        hl: 0,
        dyingAt: null,
        projectId,
      }
      particles.push(p)
      const ni = particles.length - 1

      // weave: link the arrival to its nearest neighbours (path 有界 — short hops only)
      const nearest = particles
        .map((q, j) => ({ j, d: dist3(p.x, p.y, p.z, q.x, q.y, q.z) }))
        .filter(({ j, d }) => j !== ni && d > 0.01 && d < 0.3)
        .sort((m, n) => m.d - n.d)
      const links = nearest.slice(0, Math.random() < 0.55 ? 2 : 1)
      links.forEach(({ j }) => edges.push({ a: ni, b: j, born: now }))

      // steady state: when the field is full, the oldest trace gently fades away
      if (particles.length > CAP) {
        const oldest = particles.findIndex((q) => q.kind !== 'anchor' && q.dyingAt === null)
        if (oldest >= 0) particles[oldest].dyingAt = now
      }
    }

    function wave(select: boolean) {
      const origins = select
        ? particles.map((p, i) => ({ p, i })).filter(({ p }) => p.kind === 'anchor')
        : particles.map((p, i) => ({ p, i })).filter(({ p }) => p.dyingAt === null)
      if (origins.length === 0) return
      const origin = origins[Math.floor(Math.random() * origins.length)].i

      // BFS along paths — activation 传播, bounded hops
      const hopMax = select ? 4 : 3
      const entries: WaveEntry[] = []
      const seen = new Set([origin])
      let frontier = [origin]
      for (let hop = 0; hop <= hopMax && frontier.length > 0; hop++) {
        const next: number[] = []
        for (const idx of frontier) {
          entries.push({ idx, at: now + hop * rand(170, 220), level: HOP_LEVELS[hop] })
          for (const e of edges) {
            const other = e.a === idx ? e.b : e.b === idx ? e.a : -1
            if (other >= 0 && !seen.has(other) && particles[other].dyingAt === null) {
              seen.add(other)
              next.push(other)
            }
          }
        }
        frontier = next
      }
      waves.push({
        entries,
        select,
        born: now,
        hold: select ? 2800 : 2100,
        decay: select ? 2200 : 1700,
      })
    }

    function drawFrame(t: number) {
      now = t
      ctx.clearRect(0, 0, W, H)

      // —— wave envelopes → per-particle glow ——
      let selectEnv = 0
      for (const w of waves) {
        const age = t - w.born
        const env =
          age < w.hold ? 1 : 1 - smoothstep((age - w.hold) / w.decay)
        if (w.select) selectEnv = Math.max(selectEnv, env)
        for (const en of w.entries) {
          const local = t - en.at
          if (local < 0) continue
          const attack = smoothstep(local / 300)
          const rel =
            local < w.hold ? 1 : 1 - smoothstep((local - w.hold) / w.decay)
          const g = en.level * attack * rel
          const p = particles[en.idx]
          if (g > p.glow) p.glow = g
          // a passing wave leaves a memory trace — the stable structure
          if (attack >= 1 && en.level > p.trace) p.trace = en.level * 0.55
        }
      }
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i]
        const last = Math.max(...w.entries.map((e) => e.at))
        if (t - last > w.hold + w.decay + 400) waves.splice(i, 1)
      }

      const hl = highlightRef.current

      // —— pseudo-3D projection: the cloud sways around Y, tilted on X,
      //    perspective-scaled. Cheap trig only — no WebGL, no per-frame alloc. ——
      const sway = 0.5 * Math.sin(t * 0.00005)
      const cosY = Math.cos(sway)
      const sinY = Math.sin(sway)
      const cosX = Math.cos(0.3)
      const sinX = Math.sin(0.3)
      // the field breathes — a slow swell, plus a deeper draw while a
      // Select_Γ holds the structure: the whole domain leans into the recall
      const breathe = 1 + 0.02 * Math.sin(t * 0.00042) + selectEnv * 0.045
      const drift = 0.018 * Math.sin(t * 0.00017)
      const cx = W / 2
      const cy = H / 2
      const unit = Math.min(W, H)
      const n = particles.length
      projX.length = n
      projY.length = n
      projS.length = n
      for (let i = 0; i < n; i++) {
        const p = particles[i]
        const X = p.x - 0.5
        const Y = p.y - 0.5
        const x1 = X * cosY + p.z * sinY
        const z1 = -X * sinY + p.z * cosY
        const y1 = Y * cosX - z1 * sinX
        const z2 = Y * sinX + z1 * cosX
        const s = (2.4 / (2.4 - z2)) * breathe // ~0.75 far … ~1.5 near
        projX[i] = cx + x1 * s * unit
        projY[i] = cy + (y1 + drift) * s * unit
        projS[i] = s
      }
      /** depth cue 0..1: farther particles are smaller and fainter */
      const depth = (s: number) => Math.min(Math.max((s - 0.75) / 0.75, 0), 1)

      // —— edges ——
      for (const e of edges) {
        const a = particles[e.a]
        const b = particles[e.b]
        if (!a || !b) continue
        const grow = smoothstep((t - e.born) / 750)
        if (grow <= 0) continue
        const pax = projX[e.a]
        const pay = projY[e.a]
        const glow = Math.max(a.glow, b.glow) * 0.85
        const trace = Math.max(a.trace, b.trace)
        const dying = a.dyingAt !== null || b.dyingAt !== null
        const edgeDepth = 0.6 + 0.4 * ((depth(projS[e.a]) + depth(projS[e.b])) / 2)
        let alpha = (0.12 + trace * 0.18 + glow * 0.6) * alphaScale * edgeDepth
        alpha *= 1 - selectEnv * (glow > 0.05 ? 0 : 0.55)
        if (dying) alpha *= 0.4
        if (alpha < 0.004) continue
        ctx.strokeStyle = `rgba(${glow > 0.05 ? CLAY_RGB : INK_RGB},${alpha.toFixed(3)})`
        ctx.lineWidth = 0.9
        ctx.beginPath()
        ctx.moveTo(pax, pay)
        ctx.lineTo(pax + (projX[e.b] - pax) * grow, pay + (projY[e.b] - pay) * grow)
        ctx.stroke()
      }

      // —— particles ——
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        // forgetting
        if (p.dyingAt !== null) {
          const fade = 1 - smoothstep((t - p.dyingAt) / 2400)
          if (fade <= 0) {
            particles.splice(i, 1)
            for (let k = edges.length - 1; k >= 0; k--) {
              if (edges[k].a === i || edges[k].b === i) edges.splice(k, 1)
              else {
                if (edges[k].a > i) edges[k].a -= 1
                if (edges[k].b > i) edges[k].b -= 1
              }
            }
            continue
          }
          p.glow *= fade
        }

        // hover highlight from the works index
        const target = hl !== null && p.projectId === hl ? 1 : 0
        p.hl += (target - p.hl) * 0.12
        const glow = Math.max(p.glow, p.hl)
        p.glow *= 0.86 // decay between wave contributions

        const bornIn = smoothstep((t - p.born) / 700)
        const bloom = 1 - smoothstep((t - p.born) / 1800)
        const shimmer =
          p.kind === 'trace' ? 1 : 1 + 0.14 * Math.sin(t / 1300 + p.phase)
        const base = p.kind === 'anchor' ? 0.9 : p.kind === 'key' ? 0.72 : 0.52
        let dim = 1 - selectEnv * (glow > 0.05 ? 0 : 0.55)
        if (p.dyingAt !== null) dim *= 1 - smoothstep((t - p.dyingAt) / 2400)

        const s = projS[i]
        const shade = 0.5 + 0.5 * depth(s)
        const scale = 0.7 + 0.6 * depth(s)
        const x = projX[i]
        const y = projY[i]

        const haloStrength =
          (bloom * 0.65 + glow * 0.75 + p.trace * 0.12) * dim * alphaScale * shade
        if (haloStrength > 0.01) {
          const hr = R * scale * (glow > 0.05 || p.hl > 0.05 ? 9 : 6.5)
          // lit halos warm to clay; resting ink halos stay whisper-faint
          const haloRgb = glow > 0.35 || p.hl > 0.35 ? CLAY_RGB : p.rgb
          const haloGain = p.kind === 'trace' && glow <= 0.35 ? 0.28 : 0.5
          const grad = ctx.createRadialGradient(x, y, 0, x, y, hr)
          grad.addColorStop(0, `rgba(${haloRgb},${(haloStrength * haloGain).toFixed(3)})`)
          grad.addColorStop(1, `rgba(${haloRgb},0)`)
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(x, y, hr, 0, Math.PI * 2)
          ctx.fill()
        }

        const dotAlpha = Math.min(
          1,
          (base * shimmer * bornIn + glow * 0.45) * dim * alphaScale * shade,
        )
        if (dotAlpha > 0.01) {
          ctx.fillStyle = `rgba(${glow > 0.4 ? CLAY_RGB : p.rgb},${dotAlpha.toFixed(3)})`
          ctx.beginPath()
          ctx.arc(x, y, R * scale * bornIn, 0, Math.PI * 2)
          ctx.fill()
        }

        // decay the trace very slowly — memories linger
        p.trace *= 0.9985
      }
    }

    function schedule(t: number) {
      while (t >= nextStoreAt) {
        store()
        nextStoreAt += rand(520, 1050)
      }
      if (t >= nextWaveAt) {
        wave(false)
        nextWaveAt = t + rand(3200, 5400)
      }
      if (t >= nextSelectAt) {
        wave(true)
        nextSelectAt = t + rand(19000, 27000)
      }
    }

    // —— sizing ——
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      W = rect.width
      H = rect.height
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // pre-seed: the field blooms in over the first seconds instead of
    // starting empty — staggered birth times keep the write-in legible
    const t0 = now
    const preseed = Math.floor(CAP * 0.55)
    for (let i = 0; i < preseed; i++) {
      now = t0 + i * 110
      store()
    }
    now = t0
    nextStoreAt = t0 + preseed * 110 + rand(500, 900)

    if (reduce) {
      // one still frame: the pre-seeded field fully born, mid-wave
      now = t0 + preseed * 110 + 900
      wave(false)
      now += 1300
      drawFrame(now)
      return () => ro.disconnect()
    }

    let raf = 0
    let running = false
    let visible = true
    const tick = (t: number) => {
      schedule(t)
      drawFrame(t)
      if (running) raf = requestAnimationFrame(tick)
    }
    const play = () => {
      if (running || !visible || document.hidden) return
      running = true
      raf = requestAnimationFrame(tick)
    }
    const pause = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) play()
      else pause()
    })
    io.observe(canvas)
    const onVisibility = () => (document.hidden ? pause() : play())
    document.addEventListener('visibilitychange', onVisibility)
    play()

    return () => {
      pause()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [hero, reduce])

  return (
    <canvas
      ref={canvasRef}
      className={cn(hero ? 'h-full w-full' : 'aspect-[8/5] w-full', className)}
      role="img"
      aria-label="Memory field: objects stored as particles, linked by paths, activated in waves"
    />
  )
}
