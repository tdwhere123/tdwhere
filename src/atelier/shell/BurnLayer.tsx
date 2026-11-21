import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { noise } from '../paint/noise'
import { holdScroll, reducedMotion } from '../motion'
import { burnable, onBurn, type Burn } from './burn'

/** The paper browns, catches and chars across the screen in BURN_MS; the ash then clears in CLEAR_MS. */
const BURN_MS = 1350,
  CLEAR_MS = 1100

const vertex = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`

const fragment = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec2 uOrigin;
uniform float uReach;
uniform float uBurn;
uniform float uClear;
uniform float uTime;
out vec4 outColor;
${noise}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return v;
}
void main() {
  vec2 frag = gl_FragCoord.xy;
  float aspect = uRes.x / uRes.y;
  vec2 uv = frag / uRes;
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 o = vec2(uOrigin.x / uRes.x * aspect, uOrigin.y / uRes.y);
  float n = fbm(p * 2.6), fine = fbm(p * 11.0 + 4.0);
  // the burn spreads from where the page was touched, unevenly, as paper does
  float s = uBurn * 1.55 - length(p - o) / uReach - (n - 0.5) * 0.5 - (fine - 0.5) * 0.12;
  // ahead of the flame the paper browns
  float scorch = smoothstep(-0.16, 0.0, s);
  vec4 col = vec4(vec3(0.34, 0.19, 0.07) * scorch * 0.5, scorch * 0.5);
  // behind it, char: almost black, with the grain of the paper still in it
  float charred = smoothstep(0.02, 0.07, s);
  vec3 ash = vec3(0.075, 0.06, 0.055) + (fine - 0.5) * 0.05 + vec3(0.04, 0.02, 0.0) * n;
  col = mix(col, vec4(ash, 1.0), charred);
  // the edge itself glows, flickering, white-yellow at the front and red behind it
  float edge = smoothstep(-0.004, 0.012, s) * (1.0 - smoothstep(0.016, 0.06, s));
  float flicker = 0.7 + 0.3 * vnoise(p * 34.0 + vec2(0.0, uTime * 9.0));
  vec3 glow = mix(vec3(1.0, 0.86, 0.48), vec3(0.95, 0.28, 0.04), smoothstep(0.0, 0.05, s));
  col.rgb += glow * edge * flicker * 1.5;
  col.a = max(col.a, edge);
  // a few embers keep glowing in the char for a while
  float spark = step(0.996, hash(floor(frag / 3.0) + floor(uTime * 7.0)))
    * charred * (1.0 - smoothstep(0.08, 0.35, s));
  col.rgb += vec3(1.0, 0.45, 0.08) * spark * 0.9;
  if (uClear > 0.0) {
    // the ash breaks up and falls away in flakes, the next page beneath it
    float c = uClear * 1.45 - (1.0 - uv.y) * 0.3 - n * 0.75 - (fine - 0.5) * 0.15;
    float gone = smoothstep(0.0, 0.06, c);
    float rim = smoothstep(-0.03, 0.0, c) * (1.0 - gone);
    col *= 1.0 - gone;
    col.rgb += vec3(0.42, 0.38, 0.35) * rim * 0.35 * col.a;
    vec2 g = p * 22.0 + vec2(sin(p.y * 6.0 + uClear * 4.0) * 0.6, -uClear * 7.0);
    vec2 cell = floor(g), f = fract(g) - 0.5;
    float h = hash(cell);
    vec2 jitter = vec2(hash(cell + 1.7), hash(cell + 4.3)) - 0.5;
    float flake = step(0.92, h) * smoothstep(0.16, 0.02, length(f + jitter * 0.6)) * sin(uClear * 3.14159);
    vec3 fleck = mix(vec3(0.1, 0.08, 0.07), vec3(1.0, 0.5, 0.12), step(0.985, h));
    col = vec4(col.rgb * (1.0 - flake) + fleck * flake, max(col.a, flake * 0.9));
  }
  outColor = col;
}`

function setup(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, depth: false, stencil: false })
  if (!gl) return null
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, source)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'burn shader')
    return s
  }
  const program = gl.createProgram()!
  gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex))
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment))
  gl.bindAttribLocation(program, 0, 'aPos')
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'burn program')
  gl.bindVertexArray(gl.createVertexArray())
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  const at = (name: string) => gl.getUniformLocation(program, name)
  const u = { res: at('uRes'), origin: at('uOrigin'), reach: at('uReach'), burn: at('uBurn'), clear: at('uClear'), time: at('uTime') }
  return { gl, program, u }
}

/**
 * Turning from one note to the next burns the page: fire spreads from where it was touched,
 * the old article chars away, the route changes under the ash, and the ash falls away to show
 * the next one. Without WebGL2, or with reduced motion, the page simply turns.
 */
export default function BurnLayer() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const where = useRef(pathname)
  const go = useRef(navigate)
  useLayoutEffect(() => {
    where.current = pathname
    go.current = navigate
  })
  useEffect(() => {
    const el = canvas.current
    if (!el || reducedMotion()) return
    let gfx: ReturnType<typeof setup> = null
    try {
      gfx = setup(el)
    } catch (error) {
      console.error('Fire unavailable', error)
    }
    if (!gfx) return
    const { gl, program, u } = gfx
    burnable.value = true
    let raf = 0,
      run: (Burn & { start: number; phase: 'burn' | 'wait' | 'clear'; turned: number; reach: number }) | null = null
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5)
      el.width = Math.round(innerWidth * dpr)
      el.height = Math.round(innerHeight * dpr)
    }
    const frame = (now: number) => {
      raf = 0
      if (!run) return
      let burn = 1,
        clear = 0
      if (run.phase === 'burn') {
        burn = Math.min(1, (now - run.start) / BURN_MS)
        if (burn >= 1) {
          run.phase = 'wait'
          run.turned = now
          go.current(run.to)
        }
      } else if (run.phase === 'wait') {
        // under the ash until the next note has actually arrived
        if (where.current === run.to && now - run.turned > 180) {
          run.phase = 'clear'
          run.start = now
        }
      } else {
        clear = Math.min(1, (now - run.start) / CLEAR_MS)
        if (clear >= 1) {
          run = null
          el.dataset.on = 'false'
          gl.clear(gl.COLOR_BUFFER_BIT)
          holdScroll(false)
          return
        }
      }
      gl.viewport(0, 0, el.width, el.height)
      gl.useProgram(program)
      const k = el.width / innerWidth
      gl.uniform2f(u.res, el.width, el.height)
      gl.uniform2f(u.origin, run.x * k, (innerHeight - run.y) * k)
      gl.uniform1f(u.reach, run.reach)
      gl.uniform1f(u.burn, burn)
      gl.uniform1f(u.clear, clear)
      gl.uniform1f(u.time, now / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      raf = requestAnimationFrame(frame)
    }
    const off = onBurn((burn) => {
      if (run) return
      size()
      const aspect = innerWidth / innerHeight
      const ox = (burn.x / innerWidth) * aspect,
        oy = 1 - burn.y / innerHeight
      // the farthest corner from where the fire starts sets how far it must reach
      const reach = Math.max(...[[0, 0], [aspect, 0], [0, 1], [aspect, 1]].map(([x, y]) => Math.hypot(x - ox, y - oy)))
      run = { ...burn, start: performance.now(), phase: 'burn', turned: 0, reach }
      el.dataset.on = 'true'
      holdScroll(true)
      raf = requestAnimationFrame(frame)
    })
    return () => {
      off()
      cancelAnimationFrame(raf)
      burnable.value = false
      holdScroll(false)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])
  return <canvas ref={canvas} className="a-burn" data-on="false" aria-hidden="true" />
}
