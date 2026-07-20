import * as THREE from 'three'
import type { CubeFaceFill } from '../cube-data'

const FACE_SIZE = 384
const STONE_FALLBACK = { r: 214, g: 205, b: 190 }

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${url}`))
    img.src = url
  })
}

function isNearWhite(r: number, g: number, b: number, threshold = 240) {
  return r >= threshold && g >= threshold && b >= threshold
}

function sampleDiscColor(
  ctx: CanvasRenderingContext2D,
  size: number,
): { r: number; g: number; b: number } {
  const { data } = ctx.getImageData(0, 0, size, size)
  const cx = size / 2
  const cy = size / 2
  let r = 0
  let g = 0
  let b = 0
  let n = 0

  for (let y = 0; y < size; y += 4) {
    for (let x = 0; x < size; x += 4) {
      const dx = (x - cx) / cx
      const dy = (y - cy) / cy
      const d = Math.hypot(dx, dy)
      if (d < 0.18 || d > 0.42) continue
      const i = (y * size + x) * 4
      const pr = data[i]
      const pg = data[i + 1]
      const pb = data[i + 2]
      const pa = data[i + 3]
      if (pa < 40 || isNearWhite(pr, pg, pb)) continue
      r += pr
      g += pg
      b += pb
      n++
    }
  }

  if (n < 20) return STONE_FALLBACK
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
}

/** Sample shell rim stone (not brass highlights, not white knockout). */
function sampleShellStone(
  ctx: CanvasRenderingContext2D,
  size: number,
): { r: number; g: number; b: number } {
  const { data } = ctx.getImageData(0, 0, size, size)
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (let y = 0; y < size; y += 6) {
    for (let x = 0; x < size; x += 6) {
      const i = (y * size + x) * 4
      const pr = data[i]
      const pg = data[i + 1]
      const pb = data[i + 2]
      if (isNearWhite(pr, pg, pb, 235)) continue
      if (pr > 160 && pg > 130 && pb < 120 && pr - pb > 40) continue
      if (pr < 100 || pr > 235) continue
      r += pr
      g += pg
      b += pb
      n++
    }
  }
  if (n < 30) return STONE_FALLBACK
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  size: number,
  scale: number,
) {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  const cover = Math.max(size / iw, size / ih) * scale
  const dw = iw * cover
  const dh = ih * cover
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh)
}

/**
 * Shell asset is fully opaque with a near-white aperture + outer padding.
 * Knock near-white to alpha so content / stone base show through.
 */
function knockOutShellWhite(ctx: CanvasRenderingContext2D, size: number) {
  const img = ctx.getImageData(0, 0, size, size)
  const { data } = img
  for (let i = 0; i < data.length; i += 16) {
    // Sample every 4th pixel for speed; fill neighbors
    const pr = data[i]
    const pg = data[i + 1]
    const pb = data[i + 2]
    if (!isNearWhite(pr, pg, pb, 232)) continue
    const whiteness = (pr + pg + pb) / 3 / 255
    const t = Math.min(1, Math.max(0, (whiteness - 0.88) / 0.1))
    const a = Math.round(255 * (1 - t))
    for (let k = 0; k < 16 && i + k + 3 < data.length; k += 4) {
      data[i + k + 3] = a
    }
  }
  ctx.putImageData(img, 0, 0)
}

function flattenAlpha(
  ctx: CanvasRenderingContext2D,
  size: number,
  fill: { r: number; g: number; b: number },
) {
  const img = ctx.getImageData(0, 0, size, size)
  const { data } = img
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] / 255
    if (a >= 0.995) {
      data[i + 3] = 255
      continue
    }
    data[i] = Math.round(data[i] * a + fill.r * (1 - a))
    data[i + 1] = Math.round(data[i + 1] * a + fill.g * (1 - a))
    data[i + 2] = Math.round(data[i + 2] * a + fill.b * (1 - a))
    data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
}

export type ComposeFaceOptions = {
  imageUrl: string
  shellUrl: string
  fill?: CubeFaceFill
  fillScale?: number
  size?: number
}

/**
 * Opaque cube-face canvas: stone base + content (cover / disc) + shell rim.
 * Circle faces fill aperture corners with a color sampled from the disc.
 */
export async function composeFaceTexture({
  imageUrl,
  shellUrl,
  fill = 'rect',
  fillScale,
  size = FACE_SIZE,
}: ComposeFaceOptions): Promise<THREE.CanvasTexture> {
  const [content, shell] = await Promise.all([loadImage(imageUrl), loadImage(shellUrl)])
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('2D canvas unavailable')

  const scale = fillScale ?? (fill === 'circle' ? 1.22 : 1.12)

  ctx.drawImage(shell, 0, 0, size, size)
  const stone = sampleShellStone(ctx, size)

  const shellCanvas = document.createElement('canvas')
  shellCanvas.width = size
  shellCanvas.height = size
  const sctx = shellCanvas.getContext('2d', { willReadFrequently: true })
  if (!sctx) throw new Error('2D canvas unavailable')
  sctx.drawImage(shell, 0, 0, size, size)
  knockOutShellWhite(sctx, size)

  ctx.clearRect(0, 0, size, size)
  drawCover(ctx, content, size, 1)
  const disc = fill === 'circle' ? sampleDiscColor(ctx, size) : stone

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = `rgb(${stone.r}, ${stone.g}, ${stone.b})`
  ctx.fillRect(0, 0, size, size)

  if (fill === 'circle') {
    const inset = size * 0.175
    ctx.fillStyle = `rgb(${disc.r}, ${disc.g}, ${disc.b})`
    ctx.fillRect(inset, inset, size - inset * 2, size - inset * 2)
    ctx.save()
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size * 0.34, 0, Math.PI * 2)
    ctx.clip()
    drawCover(ctx, content, size, scale)
    ctx.restore()
  } else {
    ctx.save()
    const inset = size * 0.175
    ctx.beginPath()
    ctx.rect(inset, inset, size - inset * 2, size - inset * 2)
    ctx.clip()
    drawCover(ctx, content, size, scale)
    ctx.restore()
  }

  ctx.drawImage(shellCanvas, 0, 0)
  flattenAlpha(ctx, size, stone)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}
