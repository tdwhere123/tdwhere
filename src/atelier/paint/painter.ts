import { evidence } from '../model'
import type { FilmFrame } from '../film'
import type { ArtName } from './presets'

type Hsl = [number, number, number]
type Rng = () => number

/** A painting described as fields over normalized (x, y), y pointing down. */
type Recipe = {
  ground: string
  color: (x: number, y: number, r: Rng) => string
  angle: (x: number, y: number, r: Rng) => number
  /** 0 leaves bare canvas, 1 is fully worked. */
  density: (x: number, y: number) => number
  highlights?: (r: Rng) => [number, number, string] | null
  accents?: (ctx: CanvasRenderingContext2D, w: number, h: number, r: Rng) => void
}

function rng(seed: number): Rng {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hsl(hex: string): Hsl {
  const n = parseInt(hex.slice(1), 16)
  return hslOf((n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

function hslOf(r: number, g: number, b: number): Hsl {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h =
    max === r
      ? (g - b) / d + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4
  return [h * 60, s, l]
}

const hslCache = new Map<string, Hsl>()
function jitter(hex: string, r: Rng, amount = 1) {
  let c = hslCache.get(hex)
  if (!c) hslCache.set(hex, (c = hsl(hex)))
  return shift(c, r, amount)
}
function shift(c: Hsl, r: Rng, amount = 1): Hsl {
  const h = c[0] + (r() - 0.5) * 16 * amount,
    s = Math.min(1, Math.max(0, c[1] + (r() - 0.5) * 0.12 * amount)),
    l = Math.min(0.97, Math.max(0.03, c[2] + (r() - 0.5) * 0.09 * amount))
  return [h, s, l]
}

const pick = <T,>(list: T[], r: Rng) => list[Math.floor(r() * list.length)]
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function stroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  color: Hsl,
  alpha: number,
  r: Rng,
  /** Paint thickness: the same bristles, drawn in grey on a height layer. */
  relief?: { ctx: CanvasRenderingContext2D; height: number },
) {
  const dx = Math.cos(angle) * length * 0.5,
    dy = Math.sin(angle) * length * 0.5
  const nx = -Math.sin(angle),
    ny = Math.cos(angle)
  const bend = (r() - 0.5) * width * 0.9
  const bristles = Math.max(3, Math.min(7, Math.round(width / 5)))
  ctx.lineCap = 'round'
  for (let i = 0; i < bristles; i++) {
    const t = i / (bristles - 1) - 0.5
    const o = t * width * 0.85
    const l = color[2] + (r() - 0.5) * 0.08,
      s = color[1] * (0.85 + r() * 0.3)
    ctx.strokeStyle = `hsla(${color[0]},${s * 100}%,${l * 100}%,${alpha * (0.65 + r() * 0.35)})`
    ctx.lineWidth = (width / bristles) * (1.6 + r() * 0.6)
    const edge = 1 - t * t * 2.4
    const head = Math.max(0.2, edge * (0.8 + r() * 0.25)),
      tail = Math.max(0.15, edge * (0.6 + r() * 0.4))
    const path = (c: CanvasRenderingContext2D) => {
      c.beginPath()
      c.moveTo(x - dx * head + nx * o, y - dy * head + ny * o)
      c.quadraticCurveTo(
        x + nx * (o + bend),
        y + ny * (o + bend),
        x + dx * tail + nx * o,
        y + dy * tail + ny * o,
      )
      c.stroke()
    }
    path(ctx)
    if (relief) {
      // a ridge down the middle of the stroke, a groove between bristles
      const h = relief.height * (0.72 + edge * 0.28) + (r() - 0.5) * 0.1
      relief.ctx.lineCap = 'round'
      relief.ctx.lineWidth = ctx.lineWidth
      relief.ctx.strokeStyle = `hsla(0,0%,${Math.min(1, Math.max(0, h)) * 100}%,${Math.min(1, alpha * 1.15)})`
      path(relief.ctx)
    }
  }
}

const horizon = 0.4,
  vanish: [number, number] = [0.92, 0.38]
function furrowOf(x: number, y: number) {
  const k = (Math.atan2(y - vanish[1], x - vanish[0]) * 26) / Math.PI
  const index = Math.floor(k)
  return { index, phase: k - index }
}

/** A handwritten line: a wavering pen trace broken into words. */
function scribble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  end: number,
  size: number,
  color: string,
  r: Rng,
) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  while (x < end) {
    const word = size * (2.5 + r() * 6)
    const c = jitter(color, r, 0.4)
    ctx.strokeStyle = `hsla(${c[0]},${c[1] * 100}%,${c[2] * 100}%,${0.62 + r() * 0.25})`
    ctx.lineWidth = size * (0.16 + r() * 0.1)
    ctx.beginPath()
    let px = x,
      py = y,
      phase = r() * 6
    ctx.moveTo(px, py)
    while (px < Math.min(end, x + word)) {
      const step = size * (0.5 + r() * 0.7)
      phase += 0.9 + r() * 1.6
      const lift = r() < 0.12 ? -size * (0.5 + r() * 0.4) : 0
      const nx = px + step,
        ny = y + Math.sin(phase) * size * (0.12 + r() * 0.3) + lift
      ctx.quadraticCurveTo(px + step * 0.5, (py + ny) / 2 + (r() - 0.5) * size * 0.6, nx, ny)
      px = nx
      py = ny
    }
    ctx.stroke()
    x += word + size * (0.8 + r() * 1.2)
  }
}

const single: Record<ArtName, Recipe> = {
  landscape: {
    ground: '#efe8da',
    color(x, y, r) {
      const river = Math.abs(y - (0.8 + Math.sin(x * 5.5 + 1) * 0.05))
      if (y > 0.66 && river < 0.035)
        return pick(['#cfdbe0', '#e9ece4', '#b8c9d3', '#f3efe2'], r)
      if (y < 0.5)
        return pick(
          y < 0.3
            ? ['#f3e6c7', '#f0dcb0', '#e7e3ea', '#f6efd9', '#e9d1a4']
            : ['#efe2c6', '#dcd6e4', '#f2e5c4', '#cfd3e3'],
          r,
        )
      if (y < 0.62)
        return pick(['#8e97b8', '#a3a1c1', '#7d8aa9', '#b5b3c8', '#6f8199'], r)
      return r() < 0.025
        ? pick(['#a6613f', '#b0664a'], r)
        : pick(['#8f9a6b', '#7a8762', '#b0a879', '#879272', '#c4bb8e', '#6d7b5c'], r)
    },
    angle(_x, y, r) {
      if (y < 0.5) return 0.2 + (r() - 0.5) * 1.3
      if (y < 0.66) return (r() - 0.5) * 0.25
      return -1.2 + (r() - 0.5) * 0.9
    },
    density: (x, y) =>
      Math.min(1, smooth(0.02, 0.6, x) * 0.85 + smooth(0.45, 0.9, y) * 0.5 + 0.08),
    highlights: (r) =>
      r() < 0.5
        ? [0.35 + r() * 0.65, r() * 0.45, pick(['#fbf3dc', '#fff7e4', '#f5e2b4'], r)]
        : [0.3 + r() * 0.7, 0.76 + r() * 0.1, pick(['#f7f5ee', '#e4eef0'], r)],
  },
  pigment: {
    ground: '#17242c',
    color(x, y, r) {
      const olive = smooth(0.45, 0.95, x) * smooth(0.35, 0.9, y)
      if (r() < olive * 0.8)
        return pick(['#3d4a33', '#4f5a3a', '#34422f', '#5b6341'], r)
      return pick(['#1d3240', '#243a47', '#2c4150', '#1a2a33', '#33495a', '#151d22'], r)
    },
    angle: (x, y, r) => 0.5 + Math.sin(x * 3 + y * 2.2) * 0.7 + (r() - 0.5) * 0.5,
    density: () => 0.92,
    highlights(r) {
      if (r() < 0.2)
        return [r(), r(), pick(['#9fb3b8', '#7f989f', '#b8b69a'], r)]
      if (r() < 0.55) return null
      const e = pick(evidence.filter((n) => n.current), r)
      const a = r() * Math.PI * 2,
        d = Math.abs(r() + r() - 1) * 0.12
      return [
        e.x + Math.cos(a) * d,
        e.y + Math.sin(a) * d * 0.7,
        pick(['#e7c982', '#f3dfa8', '#c9a55f', '#d8b36e'], r),
      ]
    },
  },
  construction: {
    ground: '#efe6d3',
    color(x, y, r) {
      if (y < horizon)
        return pick(
          y < horizon - 0.12
            ? ['#eee2c4', '#f3e9d2', '#e6d3aa', '#e0d8cc', '#f0dcae']
            : ['#e9cf98', '#f0dcae', '#dcc7a4', '#e6c58a'],
          r,
        )
      const furrow = furrowOf(x, y)
      if (furrow.phase < 0.16) return pick(['#4a3c30', '#5a4636', '#3f352d'], r)
      const warm = furrow.index % 3
      return warm === 0
        ? pick(['#a4623c', '#9a5a3a', '#b3713f'], r)
        : pick(['#c89a4f', '#d6ae63', '#caa05a', '#e0bb72', '#bf8a48'], r)
    },
    angle(x, y, r) {
      if (y < horizon) return (r() - 0.5) * 0.5
      return Math.atan2(vanish[1] - y, vanish[0] - x) + (r() - 0.5) * 0.06
    },
    density: (x, y) =>
      y < horizon ? 0.28 + smooth(0.35, 1, x) * 0.35 : 0.5 + smooth(0, 0.6, x) * 0.5,
    accents(ctx, w, h, r) {
      for (let i = 0; i < 8; i++) {
        const t = i / 7,
          depth = 1 - t * 0.78
        const x = (0.28 + t * 0.52) * w,
          base = h * (0.94 - t * (0.94 - horizon - 0.03))
        const post = h * 0.16 * depth
        stroke(ctx, x, base - post / 2, -Math.PI / 2 + (r() - 0.5) * 0.08, post, 8 * depth + 3, jitter('#2f2923', r, 0.4), 0.85, r)
      }
    },
  },
  manuscript: {
    ground: '#f4efe4',
    color: (_x, _y, r) =>
      pick(['#ebe3d3', '#e2d8c6', '#d9d2c4', '#efe7d8', '#e6dccb'], r),
    angle: (_x, _y, r) => (r() - 0.5) * 0.18,
    density: (x, y) => 0.25 + smooth(0.3, 0.9, x) * 0.45 + smooth(0.6, 1, y) * 0.2,
    accents(ctx, w, h, r) {
      const size = Math.min(w, h) * 0.022
      for (let row = 0; row < 10; row++) {
        const y = h * (0.2 + row * 0.068) + (r() - 0.5) * size * 0.5
        const start = w * (0.5 + r() * 0.03)
        const end = row === 9 ? start + w * 0.14 : w * (0.84 + r() * 0.08)
        scribble(ctx, start, y, end, size, '#26324a', r)
      }
      ctx.lineCap = 'round'
      for (let i = 0; i < 3; i++) {
        const c = jitter('#a4483a', r, 0.5)
        ctx.strokeStyle = `hsla(${c[0]},${c[1] * 100}%,${c[2] * 100}%,0.78)`
        ctx.lineWidth = size * (0.22 + r() * 0.12)
        const x = w * (0.47 + r() * 0.02),
          y0 = h * (0.2 + i * 0.22)
        ctx.beginPath()
        ctx.moveTo(x, y0)
        ctx.quadraticCurveTo(x - size * 0.8, y0 + h * 0.07, x + size * 0.2, y0 + h * 0.15)
        ctx.stroke()
      }
      const c = jitter('#b85c4a', r, 0.4)
      ctx.strokeStyle = `hsla(${c[0]},${c[1] * 100}%,${c[2] * 100}%,0.7)`
      ctx.lineWidth = size * 0.2
      ctx.beginPath()
      ctx.ellipse(w * 0.72, h * (0.2 + 4 * 0.068), w * 0.07, size * 1.1, -0.04, 0.3, Math.PI * 2.1)
      ctx.stroke()
    },
  },
}


const recipes = Object.fromEntries(
  Object.entries(single).map(([name, recipe]) => [name, [recipe]]),
) as Record<ArtName, Recipe[]>

const passes = [
  { width: 80, length: 190, count: 380, alpha: 0.4, jitter: 0.5 },
  { width: 40, length: 105, count: 1500, alpha: 0.75, jitter: 0.9 },
  { width: 22, length: 58, count: 2600, alpha: 0.88, jitter: 1.1 },
]

export const layerCount = (name: ArtName) => recipes[name].length

export function paintRecipe(name: ArtName, width: number, height: number, layer = 0) {
  return paintWith(recipes[name][layer], name.length * 7919 + width + layer * 104729, width, height)
}

function paintWith(recipe: Recipe, seed: number, width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const r = rng(seed)
  ctx.fillStyle = recipe.ground
  ctx.fillRect(0, 0, width, height)
  const area = (width * height) / (1600 * 1000),
    unit = Math.min(width, height) / 1000
  for (const pass of passes) {
    const count = Math.round(pass.count * area)
    for (let i = 0; i < count; i++) {
      const x = r(),
        y = r()
      const d = recipe.density(x, y)
      if (r() > d) continue
      const sparse = d < 0.45
      stroke(
        ctx,
        x * width,
        y * height,
        recipe.angle(x, y, r),
        pass.length * unit * (0.6 + r() * 0.8),
        pass.width * unit * (0.7 + r() * 0.6) * (sparse ? 0.7 : 1),
        jitter(recipe.color(x, y, r), r, pass.jitter),
        pass.alpha * (sparse ? 0.55 : 1),
        r,
      )
    }
  }
  recipe.accents?.(ctx, width, height, r)
  if (recipe.highlights)
    for (let i = 0; i < Math.round(900 * area); i++) {
      const h = recipe.highlights(r)
      if (!h) continue
      stroke(ctx, h[0] * width, h[1] * height, (r() - 0.5) * 1.2, (6 + r() * 12) * unit, (4 + r() * 5) * unit, jitter(h[2], r, 0.5), 0.9, r)
    }
  return canvas
}

const sources = new Map<string, HTMLCanvasElement>()
/** Painted once per art, orientation and layer, then shared by every mount. */
export function paintedSource(name: ArtName, portrait: boolean, layer = 0) {
  const key = `${name}:${portrait}:${layer}`
  let canvas = sources.get(key)
  if (!canvas) {
    canvas = portrait
      ? paintRecipe(name, 900, 1200, layer)
      : paintRecipe(name, 1600, 1000, layer)
    sources.set(key, canvas)
  }
  return canvas
}

const stills = new Map<string, Promise<string>>()
function stillOf(key: string, source: () => HTMLCanvasElement) {
  let url = stills.get(key)
  if (!url) {
    url = new Promise<string>((resolve, reject) =>
      source().toBlob(
        (blob) => (blob ? resolve(URL.createObjectURL(blob)) : reject(new Error('toBlob failed'))),
        'image/webp',
        0.9,
      ),
    )
    stills.set(key, url)
  }
  return url
}

/** Every layer of a painting as still images, in layer order. */
export function paintedStills(name: ArtName, portrait: boolean) {
  return Promise.all(
    Array.from({ length: layerCount(name) }, (_, i) =>
      stillOf(`${name}:${portrait}:${i}`, () => paintedSource(name, portrait, i)),
    ),
  )
}

const photos = new Map<string, Promise<void>>(),
  decoded = new Map<string, HTMLImageElement>()
/** Decodes a film frame once; painting it needs the pixels. */
export function loadFrame(frame: FilmFrame) {
  let photo = photos.get(frame.id)
  if (!photo) {
    const image = new Image()
    image.src = frame.src
    photo = image.decode().then(
      () => void decoded.set(frame.id, image),
      (error) => {
        photos.delete(frame.id)
        throw error
      },
    )
    photos.set(frame.id, photo)
  }
  return photo
}

/** Pixels of an image drawn at w×h, read by 0..1 coordinates. */
function pixels(image: CanvasImageSource, w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data
  const index = (x: number, y: number) =>
    (Math.min(h - 1, Math.max(0, Math.floor(y * h))) * w + Math.min(w - 1, Math.max(0, Math.floor(x * w)))) * 4
  return {
    canvas,
    rgb(x: number, y: number): [number, number, number] {
      const i = index(x, y)
      return [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255]
    },
    lum(x: number, y: number) {
      const i = index(x, y)
      return (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
    },
  }
}

/**
 * A photograph repainted by hand: a soft underpainting, broad strokes that
 * follow the picture's own edges (and lie flat where it is calm, as water
 * does), small strokes only where there is detail, a scatter of broken-color
 * dots, and thick dabs of light wherever the film caught a highlight.
 */
function paintPhoto(image: HTMLImageElement, seed: number, width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const r = rng(seed)
  const fine = pixels(image, width, height),
    middle = pixels(image, Math.round(width / 4), Math.round(height / 4)),
    coarse = pixels(image, Math.max(8, Math.round(width / 12)), Math.max(8, Math.round(height / 12)))
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(coarse.canvas, 0, 0, width, height)
  const area = (width * height) / (1600 * 1000),
    unit = Math.min(width, height) / 1000
  const dx = 1.5 / (width / 12),
    dy = 1.5 / (height / 12)
  // stroke direction along the edge, and how much edge there is
  const flow = (x: number, y: number) => {
    const gx = coarse.lum(x + dx, y) - coarse.lum(x - dx, y),
      gy = coarse.lum(x, y + dy) - coarse.lum(x, y - dy)
    let angle = Math.atan2(gy, gx) + Math.PI / 2
    // a stroke has no head or tail: keep it within a half turn of level
    if (angle > Math.PI / 2) angle -= Math.PI
    return { angle, detail: Math.min(1, Math.hypot(gx, gy) * 9) }
  }
  const color = (rgb: [number, number, number], amount: number) => {
    const c = hslOf(...rgb)
    // painters push color a little past what the film recorded
    return shift([c[0], Math.min(1, c[1] * 1.18 + 0.03), c[2]], r, amount)
  }
  const photoPasses = [
    { width: 54, length: 210, count: 520, alpha: 0.45, jitter: 0.6, source: coarse, detailed: false },
    { width: 22, length: 100, count: 2800, alpha: 0.7, jitter: 0.8, source: middle, detailed: false },
    { width: 8, length: 36, count: 11000, alpha: 0.88, jitter: 0.7, source: fine, detailed: true },
  ]
  for (const pass of photoPasses)
    for (let i = 0; i < Math.round(pass.count * area); i++) {
      const x = r(),
        y = r()
      const f = flow(x, y)
      if (pass.detailed && r() > 0.2 + f.detail * 0.8) continue
      // calm passages lie level, as water does; edges are followed
      const level = (r() - 0.5) * 0.22,
        follow = smooth(0.2, 0.6, f.detail)
      stroke(
        ctx,
        x * width,
        y * height,
        level + (f.angle + (r() - 0.5) * 0.25 - level) * follow,
        pass.length * unit * (0.6 + r() * 0.8) * (1 - f.detail * 0.5),
        pass.width * unit * (0.7 + r() * 0.6),
        color(pass.source.rgb(x, y), pass.jitter),
        pass.alpha,
        r,
      )
    }
  // broken color: small dots whose hue wanders from the color beneath them
  for (let i = 0; i < Math.round(5000 * area); i++) {
    const x = r(),
      y = r()
    const c = color(fine.rgb(x, y), 1.4)
    c[0] += (r() - 0.5) * 50
    ctx.fillStyle = `hsla(${c[0]},${c[1] * 100}%,${c[2] * 100}%,${0.25 + r() * 0.25})`
    ctx.beginPath()
    ctx.arc(x * width, y * height, (1 + r() * 1.4) * unit, 0, Math.PI * 2)
    ctx.fill()
  }
  // light the film caught: level warm-white dashes, a few crossed into a glint
  for (let i = 0; i < Math.round(30000 * area); i++) {
    const x = r(),
      y = r()
    const l = fine.lum(x, y)
    if (l < 0.74 || r() > (l - 0.74) * 4) continue
    const c = color(fine.rgb(x, y), 0.4)
    const lit: Hsl = [c[0] < 90 || c[0] > 300 ? 46 : c[0], c[1] * 0.6, Math.min(0.97, c[2] + 0.1)]
    const size = (4 + r() * 6) * unit
    stroke(ctx, x * width, y * height, (r() - 0.5) * 0.3, size * 2.6, size * 0.6, lit, 0.9, r)
    if (l > 0.92 && r() < 0.12) {
      stroke(ctx, x * width, y * height, 0, size * 3.6, size * 0.2, lit, 0.7, r)
      stroke(ctx, x * width, y * height, Math.PI / 2, size * 3.6, size * 0.2, lit, 0.7, r)
    }
  }
  return canvas
}

/** OKLab, so lightness and chroma move without dragging hue (HSL turns the film's near-blacks rust). */
type Lab = [number, number, number]
const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const gamma = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)
function labOf(red: number, green: number, blue: number): Lab {
  const r = linear(red), g = linear(green), b = linear(blue)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b),
    m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b),
    s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}
function rgbOfLab([L, a, b]: Lab): [number, number, number] | null {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  if (rgb.some((c) => c < -0.002 || c > 1.002)) return null
  return rgb.map((c) => gamma(Math.min(1, Math.max(0, c)))) as [number, number, number]
}
/** Lightness, chroma and hue (radians) as paint: out of gamut, it loses chroma, never hue. */
function lch(L: number, C: number, h: number): Hsl {
  for (let k = 0; k < 10; k++, C *= 0.8) {
    const rgb = rgbOfLab([L, C * Math.cos(h), C * Math.sin(h)])
    if (rgb) return hslOf(...rgb)
  }
  const v = gamma(Math.min(1, Math.max(0, L)) ** 3)
  return [0, 0, v]
}
const turn = (from: number, to: number, t: number) =>
  from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * t
const deg = Math.PI / 180

/**
 * The home painting's palette, after the Impressionists on water: no black,
 * shadows laid as ultramarine and violet with teal beside them, light broken
 * into cream, pale yellow, rose and sky instead of white.
 */
function waterColor(rgb: [number, number, number], r: Rng, amount: number): Hsl {
  const [l0, a, b] = labOf(...rgb)
  let C = Math.hypot(a, b),
    h = Math.atan2(b, a)
  const shadow = 1 - smooth(0.28, 0.62, l0)
  // the film's near-blacks take ultramarine outright (turning through red would muddy them);
  // blues lean a little toward violet in shade; warm colors keep their hue
  const neutral = 1 - smooth(0.03, 0.08, C)
  if (shadow * neutral > 0.5) h = 262 * deg
  else if (Math.cos(h - 262 * deg) > 0.5) h = turn(h, 268 * deg, shadow * 0.4)
  C = Math.max(C * (1 + (1 - shadow) * 0.15), (0.035 + 0.03 * shadow) * shadow)
  // a film's curve: deep, colored shadows and a held shoulder, not a lifted, even middle
  let L = 0.1 + (l0 + (l0 * l0 * (3 - 2 * l0) - l0) * 0.45) * 0.89
  h += (r() - 0.5) * 0.32 * amount
  L += (r() - 0.5) * 0.05 * amount
  C *= 1 + (r() - 0.5) * 0.3 * amount
  // broken color: now and then a stroke of the neighbouring hue, violet one way, teal the other
  if (r() < 0.24 * amount * shadow) {
    h += r() < 0.55 ? 0.55 : -0.62
    C *= 1.25
  }
  return lch(Math.min(0.95, L), C, h)
}

/** Glitter in the colors light takes on water: [lightness, chroma, hue°], warm first. */
const glints: [number, number, number][] = [
  [0.97, 0.025, 92],
  [0.94, 0.055, 98],
  [0.91, 0.032, 45],
  [0.92, 0.03, 230],
]

/**
 * The home painting: the hero frame repainted at 2560 px, with a height layer
 * of the same strokes so the live engine can rake light across real paint.
 * Authoring-only: bake it with scripts/bake-home.mjs, never on a visitor's main thread.
 */
export function paintHome(frame: FilmFrame, width = 2560) {
  const image = decoded.get(frame.id)
  if (!image) throw new Error(`frame ${frame.id} is not loaded`)
  const height = Math.round((width * image.naturalHeight) / image.naturalWidth)
  const layer = () => {
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    return c
  }
  const canvas = layer(),
    reliefCanvas = layer()
  const ctx = canvas.getContext('2d')!,
    depth = reliefCanvas.getContext('2d')!
  const r = rng(1931)
  const fine = pixels(image, width, height),
    middle = pixels(image, Math.round(width / 4), Math.round(height / 4)),
    coarse = pixels(image, Math.max(8, Math.round(width / 16)), Math.max(8, Math.round(height / 16)))
  const area = (width * height) / (1600 * 1000),
    unit = Math.min(width, height) / 1000
  // the ground: the coarse picture in the painting's own colors, soft as a first wash
  const wash = document.createElement('canvas')
  wash.width = coarse.canvas.width
  wash.height = coarse.canvas.height
  const washCtx = wash.getContext('2d')!
  for (let y = 0; y < wash.height; y++)
    for (let x = 0; x < wash.width; x++) {
      const c = waterColor(coarse.rgb((x + 0.5) / wash.width, (y + 0.5) / wash.height), r, 0.3)
      washCtx.fillStyle = `hsl(${c[0]},${c[1] * 100}%,${c[2] * 100}%)`
      washCtx.fillRect(x, y, 1, 1)
    }
  ctx.imageSmoothingQuality = 'high'
  ctx.filter = `blur(${Math.round(6 * unit)}px)`
  ctx.drawImage(wash, 0, 0, width, height)
  ctx.filter = 'none'
  depth.fillStyle = 'hsl(0,0%,12%)'
  depth.fillRect(0, 0, width, height)
  const dx = 1.5 / (width / 16),
    dy = 1.5 / (height / 16)
  const flow = (x: number, y: number) => {
    const gx = coarse.lum(x + dx, y) - coarse.lum(x - dx, y),
      gy = coarse.lum(x, y + dy) - coarse.lum(x, y - dy)
    let angle = Math.atan2(gy, gx) + Math.PI / 2
    if (angle > Math.PI / 2) angle -= Math.PI
    return { angle, detail: Math.min(1, Math.hypot(gx, gy) * 9) }
  }
  const passes = [
    { width: 54, length: 200, count: 520, alpha: 0.5, jitter: 0.6, source: coarse, detailed: false, thick: 0.3 },
    { width: 22, length: 96, count: 3000, alpha: 0.78, jitter: 0.8, source: middle, detailed: false, thick: 0.45 },
    { width: 9, length: 36, count: 12000, alpha: 0.9, jitter: 0.7, source: fine, detailed: true, thick: 0.62 },
  ]
  for (const pass of passes)
    for (let i = 0; i < Math.round(pass.count * area); i++) {
      const x = r(),
        y = r()
      const f = flow(x, y)
      if (pass.detailed && r() > 0.2 + f.detail * 0.8) continue
      // calm water lies level; the ripples, the machine and the birds are followed
      const level = (r() - 0.5) * 0.22,
        follow = smooth(0.2, 0.6, f.detail)
      stroke(
        ctx,
        x * width,
        y * height,
        level + (f.angle + (r() - 0.5) * 0.25 - level) * follow,
        pass.length * unit * (0.6 + r() * 0.8) * (1 - f.detail * 0.5) * (1.45 - follow * 0.45),
        pass.width * unit * (0.7 + r() * 0.6),
        waterColor(pass.source.rgb(x, y), r, pass.jitter),
        pass.alpha,
        r,
        { ctx: depth, height: pass.thick },
      )
    }
  // the darkest things, the birds and the machine's shade, drawn back in with a deep violet umber
  for (let i = 0; i < Math.round(4500 * area); i++) {
    const x = r(),
      y = r()
    const l = fine.lum(x, y),
      f = flow(x, y)
    if (l > 0.15 || f.detail < 0.22 || r() > f.detail * 1.3) continue
    const c = lch(0.2 + l * 0.6 + (r() - 0.5) * 0.04, 0.045 + r() * 0.02, (300 + (r() - 0.5) * 40) * deg)
    stroke(ctx, x * width, y * height, f.angle + (r() - 0.5) * 0.3, 20 * unit * (0.6 + r() * 0.6), 6 * unit * (0.7 + r() * 0.5), c, 0.76, r, { ctx: depth, height: 0.7 })
  }
  for (let i = 0; i < Math.round(5000 * area); i++) {
    const x = r(),
      y = r()
    const c = waterColor(fine.rgb(x, y), r, 1.4)
    const size = (1 + r() * 1.4) * unit,
      alpha = 0.25 + r() * 0.25
    ctx.fillStyle = `hsla(${c[0]},${c[1] * 100}%,${c[2] * 100}%,${alpha})`
    ctx.beginPath()
    ctx.arc(x * width, y * height, size, 0, Math.PI * 2)
    ctx.fill()
    depth.fillStyle = `hsla(0,0%,50%,${alpha})`
    depth.beginPath()
    depth.arc(x * width, y * height, size, 0, Math.PI * 2)
    depth.fill()
  }
  // the light on the water: thick level dashes in two neighbouring tints, a few crossed into stars
  for (let i = 0; i < Math.round(30000 * area); i++) {
    const x = r(),
      y = r()
    const l = fine.lum(x, y)
    if (l < 0.73 || r() > (l - 0.73) * 4) continue
    const tint = () => {
      const [L, C, h] = glints[l > 0.9 && r() < 0.7 ? Math.floor(r() * 2) : Math.floor(r() * glints.length)]
      return lch(L + (r() - 0.5) * 0.03, C * (0.8 + r() * 0.4), (h + (r() - 0.5) * 14) * deg)
    }
    const size = (4.5 + r() * 6.5) * unit,
      px = x * width,
      py = y * height
    stroke(ctx, px, py, (r() - 0.5) * 0.3, size * 2.6, size * 0.6, tint(), 0.92, r, { ctx: depth, height: 0.86 })
    const side = r() < 0.5 ? -1 : 1
    stroke(ctx, px + side * size * 1.7, py + (r() - 0.5) * size * 0.8, (r() - 0.5) * 0.3, size * 1.8, size * 0.45, tint(), 0.82, r, { ctx: depth, height: 0.78 })
    if (l > 0.92 && r() < 0.14) {
      const star = tint()
      stroke(ctx, px, py, 0, size * 3.6, size * 0.2, star, 0.75, r, { ctx: depth, height: 0.92 })
      stroke(ctx, px, py, Math.PI / 2, size * 3.6, size * 0.2, star, 0.75, r, { ctx: depth, height: 0.92 })
    }
  }
  return { color: canvas, relief: reliefCanvas }
}

const frames = new Map<string, HTMLCanvasElement>()
/**
 * A film frame painted at its own proportions, once, then shared. Callers
 * crop it with object-position. `loadFrame` must have resolved first.
 */
export function paintedFrame(frame: FilmFrame) {
  let canvas = frames.get(frame.id)
  if (!canvas) {
    const image = decoded.get(frame.id)
    if (!image) throw new Error(`frame ${frame.id} is not loaded`)
    let seed = 1931
    for (const c of frame.id) seed = Math.imul(seed ^ c.charCodeAt(0), 7919)
    canvas = paintPhoto(image, seed, 1600, Math.round((1600 * image.naturalHeight) / image.naturalWidth))
    frames.set(frame.id, canvas)
  }
  return canvas
}

export const paintedFrameStill = (frame: FilmFrame) =>
  stillOf(`frame:${frame.id}`, () => paintedFrame(frame))
