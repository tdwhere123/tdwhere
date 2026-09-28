import { fieldSource, paintSource, vertexSource } from './shaders'
import {
  coverFit,
  fieldSteps,
  mixRgb,
  mixVec2,
  modeIndex,
  parseObjectPosition,
  scrollProgress,
  type PaintPreset,
  type Rgb,
  type Vec2,
} from './presets'
import { onPaint, type PaintSignal } from './bus'

export type PaintOptions = {
  canvas: HTMLCanvasElement
  source: HTMLCanvasElement
  preset: PaintPreset
  /** Element that receives the pointer; usually the section around the art. */
  surface: Element
  channel?: string
  onLost: () => void
}

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer }
type Sweep = { from: Vec2; to: Vec2; t: number; radius: number }
type Mark = { x: number; y: number; r: number; strength: number; on: boolean }

const MAX_PULSES = 8
const MAX_MARKS = 4

function compile(gl: WebGL2RenderingContext, fragment: string) {
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, source)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s) || 'shader compile failed')
    return s
  }
  const program = gl.createProgram()!
  gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexSource))
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment))
  gl.bindAttribLocation(program, 0, 'aPos')
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program) || 'program link failed')
  const cache = new Map<string, WebGLUniformLocation | null>()
  const at = (name: string) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(program, name))
    return cache.get(name)!
  }
  return { program, at }
}

/** Throws when WebGL2 or float render targets are unavailable; callers keep the still image. */
export function mountPaint(o: PaintOptions) {
  const { canvas, source, preset } = o
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  })
  if (!gl) throw new Error('WebGL2 unavailable')
  if (
    !gl.getExtension('EXT_color_buffer_float') &&
    !gl.getExtension('EXT_color_buffer_half_float')
  )
    throw new Error('float render targets unavailable')

  const field = compile(gl, fieldSource),
    paintProgram = compile(gl, paintSource)
  const vao = gl.createVertexArray()!
  gl.bindVertexArray(vao)
  const buffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  )
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  const imageTex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, imageTex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  let targets: [Target, Target] | null = null,
    fieldSize: Vec2 = [0, 0]
  function makeTarget(w: number, h: number): Target {
    const tex = gl!.createTexture()!
    gl!.bindTexture(gl!.TEXTURE_2D, tex)
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA16F, w, h, 0, gl!.RGBA, gl!.HALF_FLOAT, null)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE)
    const fbo = gl!.createFramebuffer()!
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo)
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0)
    if (gl!.checkFramebufferStatus(gl!.FRAMEBUFFER) !== gl!.FRAMEBUFFER_COMPLETE)
      throw new Error('field framebuffer incomplete')
    gl!.clearColor(0, 0, 0, 0)
    gl!.clear(gl!.COLOR_BUFFER_BIT)
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null)
    return { tex, fbo }
  }
  function resizeField(w: number, h: number) {
    if (targets && fieldSize[0] === w && fieldSize[1] === h) return
    targets?.forEach((t) => {
      gl!.deleteTexture(t.tex)
      gl!.deleteFramebuffer(t.fbo)
    })
    targets = [makeTarget(w, h), makeTarget(w, h)]
    fieldSize = [w, h]
  }
  resizeField(64, 64)

  const coarse = matchMedia('(pointer: coarse)').matches
  let aspect = 1,
    fit = coverFit(1, 1, 1, 1),
    progress = 0,
    time = 0,
    energy = 0,
    carry = 0,
    raf = 0,
    last = 0,
    lastPaint = 0,
    dirty = true,
    visible = false,
    destroyed = false
  let brush: { p0: Vec2; p1: Vec2 } | null = null,
    lastPointer: Vec2 | null = null
  const pulses: [number, number, number, number][] = []
  const sweeps: Sweep[] = []
  const marks = new Map<string, Mark>()
  const glaze: Rgb = [...preset.glaze]
  let glazeTarget: Rgb = [...preset.glaze]
  let light: Vec2 = [...preset.lightFrom],
    nudge: Vec2 = [0, 0]
  const drift = preset.drift > 0 && !coarse
  const retain = Math.max(...preset.decay)

  function toUv(x: number, y: number): Vec2 {
    const r = canvas.getBoundingClientRect()
    return [(x - r.left) / (r.width || 1), 1 - (y - r.top) / (r.height || 1)]
  }

  function resize() {
    const r = canvas.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) return
    const dpr = Math.min(devicePixelRatio || 1, 1.5) * (coarse ? 0.6 : 0.85)
    let w = r.width * dpr,
      h = r.height * dpr
    const cap = 2_200_000
    if (w * h > cap) {
      const k = Math.sqrt(cap / (w * h))
      w *= k
      h *= k
    }
    canvas.width = Math.max(2, Math.round(w))
    canvas.height = Math.max(2, Math.round(h))
    aspect = r.width / r.height
    const position = parseObjectPosition(getComputedStyle(canvas).objectPosition)
    fit = coverFit(r.width, r.height, source.width, source.height, position)
    const fw = Math.min(360, Math.max(48, Math.round(r.width / 5)))
    resizeField(fw, Math.max(32, Math.round(fw / aspect)))
    dirty = true
    wake()
  }

  function stepField(withInput: boolean) {
    const [read, write] = targets!
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, write.fbo)
    gl!.viewport(0, 0, fieldSize[0], fieldSize[1])
    gl!.useProgram(field.program)
    gl!.activeTexture(gl!.TEXTURE0)
    gl!.bindTexture(gl!.TEXTURE_2D, read.tex)
    const u = field.at
    gl!.uniform1i(u('uField'), 0)
    gl!.uniform2f(u('uTexel'), 1 / fieldSize[0], 1 / fieldSize[1])
    gl!.uniform1f(u('uAspect'), aspect)
    gl!.uniform1f(u('uRadius'), preset.brushRadius)
    gl!.uniform3fv(u('uGain'), preset.gain)
    gl!.uniform2fv(u('uAniso'), preset.anisotropy)
    gl!.uniform3fv(u('uDecay'), preset.decay)
    gl!.uniform2fv(u('uDiffuse'), preset.diffusion)
    gl!.uniform1i(u('uMode'), modeIndex[preset.mode])
    const b = withInput ? brush : null
    gl!.uniform1f(u('uBrush'), b ? 1 : 0)
    if (b) {
      let vx = b.p1[0] - b.p0[0],
        vy = b.p1[1] - b.p0[1]
      const len = Math.hypot(vx * aspect, vy)
      if (len > 0.08) {
        vx *= 0.08 / len
        vy *= 0.08 / len
      }
      gl!.uniform2fv(u('uP0'), b.p0)
      gl!.uniform2fv(u('uP1'), b.p1)
      gl!.uniform2f(u('uVel'), vx, vy)
    }
    const count = withInput ? Math.min(MAX_PULSES, pulses.length) : 0
    if (count) gl!.uniform4fv(u('uPulse'), pulses.slice(0, count).flat())
    gl!.uniform1i(u('uPulseCount'), count)
    gl!.drawArrays(gl!.TRIANGLES, 0, 3)
    targets = [write, read]
  }

  function paintFrame() {
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null)
    gl!.viewport(0, 0, canvas.width, canvas.height)
    gl!.useProgram(paintProgram.program)
    const u = paintProgram.at
    gl!.activeTexture(gl!.TEXTURE0)
    gl!.bindTexture(gl!.TEXTURE_2D, imageTex)
    gl!.uniform1i(u('uImage'), 0)
    gl!.activeTexture(gl!.TEXTURE1)
    gl!.bindTexture(gl!.TEXTURE_2D, targets![0].tex)
    gl!.uniform1i(u('uField'), 1)
    gl!.uniform2fv(u('uScale'), fit.scale)
    gl!.uniform2fv(u('uOffset'), fit.offset)
    gl!.uniform2f(u('uRes'), canvas.width, canvas.height)
    gl!.uniform1f(u('uAspect'), aspect)
    gl!.uniform1f(u('uTime'), time)
    gl!.uniform1f(u('uAngle'), preset.strokeAngle)
    gl!.uniform1f(u('uBias'), preset.directionBias)
    gl!.uniform1f(u('uLen'), preset.strokeLength)
    gl!.uniform1f(u('uImpasto'), preset.impasto)
    gl!.uniform1f(u('uDab'), preset.dabScale)
    gl!.uniform2f(u('uLight'), light[0] + nudge[0], light[1] + nudge[1])
    const dusk = Math.min(1, Math.max(0, (progress - 0.45) / 0.5))
    const tone = mixRgb([1, 1, 1], preset.scrollGlaze, dusk)
    gl!.uniform3f(u('uGlaze'), glaze[0] * tone[0], glaze[1] * tone[1], glaze[2] * tone[2])
    gl!.uniform3fv(u('uAccent'), preset.accent)
    gl!.uniform3fv(u('uGround'), preset.ground)
    gl!.uniform1i(u('uMode'), modeIndex[preset.mode])
    const list = [...marks.values()].slice(0, MAX_MARKS)
    if (list.length)
      gl!.uniform4fv(u('uMarks'), list.flatMap((m) => [m.x, m.y, m.r, m.strength]))
    gl!.uniform1i(u('uMarkCount'), list.length)
    gl!.drawArrays(gl!.TRIANGLES, 0, 3)
  }

  function advanceState(dt: number) {
    const k = 1 - Math.exp(-dt / 260)
    let moving = false
    for (let i = 0; i < 3; i++) {
      const d = glazeTarget[i] - glaze[i]
      if (Math.abs(d) > 0.002) moving = true
      glaze[i] += d * k
    }
    for (const [id, m] of marks) {
      const target = m.on ? 1 : 0
      m.strength += (target - m.strength) * (1 - Math.exp(-dt / 320))
      if (Math.abs(target - m.strength) > 0.01) moving = true
      else if (!m.on) marks.delete(id)
    }
    for (let i = sweeps.length - 1; i >= 0; i--) {
      const s = sweeps[i]
      const pos = mixVec2(s.from, s.to, s.t)
      if (pulses.length < MAX_PULSES) pulses.push([pos[0], pos[1], s.radius, 0.28])
      s.t += dt / 450
      if (s.t > 1) sweeps.splice(i, 1)
      moving = true
    }
    const target = mixVec2(preset.lightFrom, preset.lightTo, progress)
    light = mixVec2(light, target, 1 - Math.exp(-dt / 400))
    if (Math.hypot(light[0] - target[0], light[1] - target[1]) > 0.003) moving = true
    return moving
  }

  function frame(now: number) {
    raf = 0
    if (destroyed || !visible || document.hidden) return
    const dt = Math.min(100, now - last || 16)
    last = now
    const r = canvas.getBoundingClientRect()
    progress = scrollProgress(r.top, r.height, innerHeight)
    const animating = advanceState(dt)
    const input = brush !== null || pulses.length > 0
    if (input) energy = 1
    const settling = energy > 0.003
    const next = fieldSteps(dt, carry)
    let steps = next.steps
    carry = next.carry
    if (input && steps === 0) steps = 1
    if (settling || input) {
      for (let i = 0; i < steps; i++) stepField(i === 0)
      energy *= retain ** steps
      brush = null
      pulses.length = 0
    }
    const busy = settling || input || animating
    if (drift) time += (dt / 1000) * preset.drift
    if (busy || dirty || (drift && now - lastPaint > 33)) {
      paintFrame()
      lastPaint = now
      dirty = false
    }
    if (busy || drift) raf = requestAnimationFrame(frame)
  }

  function wake() {
    if (raf || destroyed || !visible || document.hidden) return
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }

  function addBrush(p0: Vec2, p1: Vec2) {
    brush = brush ? { p0: brush.p0, p1 } : { p0, p1 }
    wake()
  }

  const onMove = (e: Event) => {
    const ev = e as PointerEvent
    if (ev.pointerType === 'touch') return
    const p = toUv(ev.clientX, ev.clientY)
    if (p[0] < -0.1 || p[0] > 1.1 || p[1] < -0.1 || p[1] > 1.1) {
      lastPointer = null
      return
    }
    nudge = [(p[0] - 0.5) * 0.35, (p[1] - 0.5) * 0.35]
    if (lastPointer) addBrush(lastPointer, p)
    lastPointer = p
  }
  const onLeave = () => {
    lastPointer = null
  }
  const onDown = (e: Event) => {
    const ev = e as PointerEvent
    if (ev.pointerType !== 'touch') return
    const p = toUv(ev.clientX, ev.clientY)
    const d = 0.05
    addBrush(p, [
      p[0] + (Math.cos(preset.strokeAngle) * d) / aspect,
      p[1] + Math.sin(preset.strokeAngle) * d,
    ])
    pulses.push([p[0], p[1], preset.brushRadius * 0.9, 0.5])
  }

  function onSignal(signal: PaintSignal) {
    if (signal.type === 'pulse') {
      const p = toUv(signal.x, signal.y)
      if (pulses.length < MAX_PULSES)
        pulses.push([
          p[0],
          p[1],
          signal.radius ?? preset.brushRadius * 1.3,
          signal.amount ?? 1,
        ])
    } else if (signal.type === 'stroke') {
      sweeps.push({
        from: toUv(signal.x0, signal.y0),
        to: toUv(signal.x1, signal.y1),
        t: 0,
        radius: preset.brushRadius * 0.8,
      })
    } else if (signal.type === 'glaze') {
      glazeTarget = [...(signal.color ?? preset.glaze)]
    } else {
      const p = toUv(signal.x, signal.y)
      const existing = marks.get(signal.id)
      if (signal.on)
        marks.set(signal.id, {
          x: p[0],
          y: p[1],
          r: signal.radius ?? 0.09,
          strength: existing?.strength ?? 0,
          on: true,
        })
      else if (existing) existing.on = false
    }
    wake()
  }

  const onLost = (e: Event) => {
    e.preventDefault()
    destroy()
    o.onLost()
  }
  const onVisibility = () => wake()
  const onScroll = () => wake()

  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting
      if (visible) {
        dirty = true
        wake()
      }
    },
    { rootMargin: '120px' },
  )
  io.observe(canvas)
  const offSignal = o.channel ? onPaint(o.channel, onSignal) : undefined
  o.surface.addEventListener('pointermove', onMove, { passive: true })
  o.surface.addEventListener('pointerleave', onLeave, { passive: true })
  o.surface.addEventListener('pointerdown', onDown, { passive: true })
  canvas.addEventListener('webglcontextlost', onLost)
  document.addEventListener('visibilitychange', onVisibility)
  addEventListener('scroll', onScroll, { passive: true })

  function destroy() {
    if (destroyed) return
    destroyed = true
    cancelAnimationFrame(raf)
    ro.disconnect()
    io.disconnect()
    offSignal?.()
    o.surface.removeEventListener('pointermove', onMove)
    o.surface.removeEventListener('pointerleave', onLeave)
    o.surface.removeEventListener('pointerdown', onDown)
    canvas.removeEventListener('webglcontextlost', onLost)
    document.removeEventListener('visibilitychange', onVisibility)
    removeEventListener('scroll', onScroll)
    if (!gl!.isContextLost()) {
      targets?.forEach((t) => {
        gl!.deleteTexture(t.tex)
        gl!.deleteFramebuffer(t.fbo)
      })
      gl!.deleteTexture(imageTex)
      gl!.deleteBuffer(buffer)
      gl!.deleteVertexArray(vao)
      gl!.deleteProgram(field.program)
      gl!.deleteProgram(paintProgram.program)
      gl!.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }

  resize()
  return { destroy }
}
