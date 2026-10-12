import { coverFit } from './presets'
import { noise, vertexSource } from './shaders'

const DROPS = 16
const SPEED = 0.26
/** Seconds after entering: color settles, strokes surface, the opening widens. */
const AFTER = { TINT: [1.0, 2.2], REVEAL: [1.5, 3.4], OPEN: [3.2, 4.3] } as const

/** The home painting, cover-fit to the screen; a rain grey until it has been painted. */
const painting = `float minDim() { return min(uRes.x, uRes.y); }
vec3 painting(vec2 q) {
  vec2 screen = q * minDim() / uRes + 0.5;
  vec2 uv = clamp(screen * uScale + uOffset, vec2(0.001), vec2(0.999));
  return mix(vec3(0.69, 0.73, 0.76), texture(uImage, uv).rgb, uReady);
}`

/**
 * Pass one: the scene before any brushwork. A rain-dimmed water surface,
 * ripples from each drop, and a small square opening cut into it: an empty,
 * too-clean hole whose dark floor fills with the painting once rain falls in. Space `q` is centered and
 * measured in the shorter screen side.
 */
const sceneSource = `#version 300 es
precision highp float;
uniform sampler2D uImage;
uniform sampler2D uWater;
uniform float uReady;
uniform vec2 uRes;
uniform vec2 uScale;
uniform vec2 uOffset;
uniform float uTime;
uniform float uEnter;
uniform float uTint;
uniform float uOpen;
uniform float uHole;
uniform float uR;
uniform vec4 uDrops[${DROPS}];
in vec2 vUv;
out vec4 outColor;

${noise}
const float SPEED = ${SPEED.toFixed(2)};

${painting}
// the painted water, cover-fit like the painting (both canvases share a size)
vec3 surface(vec2 q) {
  vec2 screen = q * minDim() / uRes + 0.5;
  vec2 uv = clamp(screen * uScale + uOffset, vec2(0.001), vec2(0.999));
  return texture(uWater, uv).rgb * (0.97 + q.y * 0.05);
}

void main() {
  float m = minDim();
  vec2 q = (gl_FragCoord.xy - 0.5 * uRes) / m;
  float t = uTime;
  float calm = 1.0 - uOpen;

  float crest = 0.0, trough = 0.0;
  vec2 bend = vec2(0.0);
  float kept = 0.0, passing = 0.0;
  for (int i = 0; i < ${DROPS}; i++) {
    vec4 d = uDrops[i];
    float age = t - d.z;
    if (age < 0.0 || d.w <= 0.0) continue;
    vec2 away = q - d.xy;
    float dist = length(away);
    float fade = d.w * exp(-age * 0.6) / (1.0 + dist * 1.2);
    // a bright crest, a dark trough behind it, and a fainter second ring
    float s = dist - SPEED * age;
    float ring = exp(-s * s / 0.0004) - 0.8 * exp(-pow(s + 0.03, 2.0) / 0.0004)
      + 0.5 * exp(-pow(s + 0.075, 2.0) / 0.0003) - 0.35 * exp(-pow(s + 0.1, 2.0) / 0.0003);
    crest += max(ring, 0.0) * fade;
    trough += max(-ring, 0.0) * fade;
    bend += away / max(dist, 1e-4) * ring * fade;
    // where a ring reaches the opening, color seeps in from the contact point
    vec2 contact = clamp(d.xy, vec2(-uHole), vec2(uHole));
    float met = d.z + length(d.xy - contact) / SPEED;
    float reach = (t - met) * 0.12 - length(q - contact);
    float seep = smoothstep(-0.015, 0.04, reach) * d.w;
    if (uEnter >= 0.0 && d.z >= uEnter) kept += seep;
    else passing += seep * exp(-max(0.0, t - met) * 1.3);
  }
  float tint = clamp(max(kept * 0.6, uTint) + passing * 0.22, 0.0, 1.0);

  vec3 col = surface(q + bend * 0.02 * calm);
  // a ring is painted, not lit: a pale crest and a blue-grey trough behind it
  col = mix(col, vec3(0.92, 0.94, 0.94), clamp(crest * 1.1, 0.0, 0.8) * calm);
  col = mix(col, vec3(0.4, 0.5, 0.58), clamp(trough * 0.75, 0.0, 0.6) * calm);

  // the water darkens a little toward the opening, as if drawn into it
  float box = max(abs(q.x), abs(q.y)), edge = box - uR;
  col *= 1.0 - exp(-pow(max(edge, 0.0) / 0.03, 2.0)) * 0.16 * calm;

  // inside: an empty dark box. The far wall catches a little light, the
  // side walls fall away, the floor is black, until the painting seeps in.
  vec2 u = q / uR;
  vec3 hollow = vec3(0.02, 0.025, 0.03);
  hollow += vec3(0.1, 0.1, 0.095) * smoothstep(0.35, 1.0, u.y) * (1.0 - abs(u.x) * 0.4);
  hollow *= 1.0 - smoothstep(0.55, 1.0, abs(u.x)) * 0.4;
  hollow += vec3(0.05, 0.015, 0.01) * exp(-dot(u + vec2(0.0, 0.45), u + vec2(0.0, 0.45)) * 3.0);
  vec3 inner = mix(hollow, painting(q * mix(0.6, 1.0, uOpen) + bend * 0.004 * calm), tint);
  float aa = 1.2 / m;
  float inside = smoothstep(aa, -aa, edge) * smoothstep(0.0, 1.2, t);
  // a clean lip: lit along the near edge, shadowed along the far one
  float lip = exp(-pow((edge - 0.003) / 0.0025, 2.0)) * calm;
  col = mix(col, vec3(0.95, 0.94, 0.9), lip * smoothstep(0.2, -0.6, q.y / uR) * 0.6);
  col = mix(col, vec3(0.16, 0.18, 0.2), lip * smoothstep(-0.2, 0.6, q.y / uR) * 0.5);
  col = mix(col, inner, inside);
  // the first second rises out of bare paper
  col = mix(vec3(0.953, 0.933, 0.89), col, smoothstep(0.0, 1.2, t));

  outColor = vec4(col, 1.0);
}`

/**
 * Pass two: brushwork over everything. Every pixel belongs to a dab whose
 * color is smeared along its stroke, with bristle relief lit like impasto,
 * so the rain, the water and the painting share one hand. Strokes curl
 * toward the opening; the painting is laid down stroke by stroke.
 */
const brushSource = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uImage;
uniform float uReady;
uniform vec2 uRes;
uniform vec2 uScale;
uniform vec2 uOffset;
uniform float uTime;
uniform float uR;
uniform float uOpen;
uniform float uReveal;
uniform vec4 uDrops[${DROPS}];
in vec2 vUv;
out vec4 outColor;

${noise}
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
${painting}

void main() {
  float m = minDim();
  vec2 q = (gl_FragCoord.xy - 0.5 * uRes) / m;
  vec2 screen = gl_FragCoord.xy / uRes;
  vec2 toUv = m / uRes;
  float calm = 1.0 - uOpen;
  float corner = length(0.5 * uRes / m);

  // stroke direction: a slow field that swirls toward the opening
  float a = 0.06 + (vnoise(q * 2.6 + uTime * 0.02) - 0.5) * 0.9;
  vec2 dir0 = vec2(cos(a), sin(a)), dir = dir0;
  float box = max(abs(q.x), abs(q.y));
  float near = exp(-pow(max(0.0, box - uR) / 0.07, 2.0)) * calm;
  vec2 around = normalize(vec2(-q.y, q.x) + 1e-5);
  if (dot(around, dir) < 0.0) around = -around;
  dir = normalize(mix(dir, around, near * 0.8));
  vec2 perp = vec2(-dir.y, dir.x);

  vec2 sp = vec2(dot(q, dir), dot(q, perp)) * vec2(26.0, 62.0);
  sp.x += hash(vec2(floor(sp.y), 3.1)) * 7.0;
  vec2 cell = floor(sp), local = fract(sp);
  float h1 = hash(cell), h2 = hash(cell + 17.3), h3 = hash(cell + 5.1);
  float bristle = vnoise(vec2(sp.x * 0.6, sp.y * 7.0) + h1 * 10.0);

  // smear along the stroke, as the home painting does
  vec2 along = dir * toUv * 0.011 * (0.55 + h1 * 0.9);
  vec3 col = vec3(0.0);
  float wsum = 0.0;
  for (int i = -2; i <= 2; i++) {
    float k = float(i) / 2.0, w = 1.0 - abs(k) * 0.5;
    col += texture(uScene, screen + along * k).rgb * w;
    wsum += w;
  }
  vec3 sharp = texture(uScene, screen).rgb;
  col = mix(col / wsum, sharp, 0.4);

  // the painting arrives stroke by stroke, outward from the opening, on a grid
  // that does not curl, so whole strokes land at once
  vec2 msp = vec2(dot(q, dir0), dot(q, vec2(-dir0.y, dir0.x))) * vec2(15.0, 42.0);
  msp.x += hash(vec2(floor(msp.y), 1.7)) * 5.0;
  float edge = clamp((box - uR) / max(0.01, corner - uR), 0.0, 1.0);
  float due = edge * 0.55 + hash(floor(msp)) * 0.3 + vnoise(q * 3.0) * 0.15
    + (vnoise(vec2(msp.x * 0.8, msp.y * 6.0)) - 0.5) * 0.08
    + smoothstep(0.55, 1.0, abs(fract(msp.x) - 0.5) * 2.0) * 0.12;
  due = clamp(due * 0.85, 0.06, 0.94);
  float laid = smoothstep(due - 0.05, due + 0.05, uReveal * 1.25 - 0.1) * step(uR, box);
  if (laid > 0.0) {
    vec3 paint = vec3(0.0);
    for (int i = -2; i <= 2; i++) paint += painting(q + dir * float(i) * 0.005);
    col = mix(col, paint / 5.0, laid);
    sharp = mix(sharp, painting(q), laid);
  }

  col += vec3(h2 - 0.5, (h3 - 0.5) * 0.5, 0.5 - h2) * 0.012;
  float dabEdge = smoothstep(0.0, 0.3, local.y) * smoothstep(1.0, 0.7, local.y);
  float height = lum(sharp) * 0.75 + bristle * 0.2 + dabEdge * 0.03;
  vec2 dH = vec2(dFdx(height), dFdy(height));
  vec3 N = normalize(vec3(-dH * 4.0 * (uRes.y / 800.0), 1.0));
  vec3 L = normalize(vec3(-0.6, 0.8, 0.9));
  col *= 0.86 + dot(N, L) * 0.2;
  col += pow(max(dot(reflect(-L, N), vec3(0.0, 0.0, 1.0)), 0.0), 20.0) * 0.05;
  // the opening is cut, not painted: no brushwork inside it or on its lip
  col = mix(col, texture(uScene, screen).rgb, smoothstep(0.004, 0.0, box - uR) * calm);

  // falling rain: short slanted strokes that end where each drop lands
  vec2 fall = normalize(vec2(-0.22, 1.0));
  for (int i = 0; i < ${DROPS}; i++) {
    vec4 d = uDrops[i];
    float left = d.z - uTime;
    if (left <= 0.0 || left > 0.3 || d.w <= 0.0) continue;
    vec2 head = d.xy + fall * left * 1.6;
    vec2 pa = q - head, ba = fall * 0.07;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float w = length(pa - ba * h);
    float streak = smoothstep(0.0028, 0.0008, w) * (1.0 - h) * (0.6 + bristle * 0.4);
    col = mix(col, vec3(0.93, 0.95, 0.96), streak * 0.7 * calm);
  }

  col += (hash(gl_FragCoord.xy) - 0.5) * 0.018;
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

const ease = (v: number) => {
  const t = Math.min(1, Math.max(0, v))
  return t * t * (3 - 2 * t)
}
const span = (t: number, [a, b]: readonly [number, number]) => ease((t - a) / (b - a))

/**
 * Throws without WebGL2; callers skip the overture. Rain falls quietly until
 * `enter` is called, then the opening fills with color and widens onto the
 * painting.
 */
export function mountOverture(o: {
  canvas: HTMLCanvasElement
  /** Called once the opening has widened onto the painting. */
  onDone: () => void
  /** Paints the first layer of the home painting; slow, so called after the first frames. */
  painting: () => HTMLCanvasElement
  /** The painted water the rain falls on, the same size as the painting. */
  water: HTMLCanvasElement
}) {
  const { canvas } = o
  const gl = canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false })
  if (!gl) throw new Error('WebGL2 unavailable')
  function program(fragment: string) {
    const shader = (type: number, source: string) => {
      const s = gl!.createShader(type)!
      gl!.shaderSource(s, source)
      gl!.compileShader(s)
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS))
        throw new Error(gl!.getShaderInfoLog(s) || 'shader compile failed')
      return s
    }
    const p = gl!.createProgram()!
    gl!.attachShader(p, shader(gl!.VERTEX_SHADER, vertexSource))
    gl!.attachShader(p, shader(gl!.FRAGMENT_SHADER, fragment))
    gl!.bindAttribLocation(p, 0, 'aPos')
    gl!.linkProgram(p)
    if (!gl!.getProgramParameter(p, gl!.LINK_STATUS))
      throw new Error(gl!.getProgramInfoLog(p) || 'program link failed')
    const cache = new Map<string, WebGLUniformLocation | null>()
    const at = (name: string) => {
      if (!cache.has(name)) cache.set(name, gl!.getUniformLocation(p, name))
      return cache.get(name)!
    }
    return { p, at }
  }
  const scene = program(sceneSource),
    brush = program(brushSource)
  const vao = gl.createVertexArray()!
  gl.bindVertexArray(vao)
  const buffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  const image = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, image)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([176, 186, 194, 255]))
  const waterTex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, waterTex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, o.water)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  const sceneTex = gl.createTexture()!
  const fbo = gl.createFramebuffer()!
  let ready = 0,
    fit = coverFit(innerWidth, innerHeight, o.water.width, o.water.height),
    sceneSize = [2, 2]

  // half the side of the opening, in q units: small, and too clean for the painting around it
  const hole = 0.042
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5) * 0.8
    canvas.width = Math.max(2, Math.round(innerWidth * dpr))
    canvas.height = Math.max(2, Math.round(innerHeight * dpr))
    sceneSize = [Math.max(2, canvas.width >> 1), Math.max(2, canvas.height >> 1)]
    gl!.bindTexture(gl!.TEXTURE_2D, sceneTex)
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, sceneSize[0], sceneSize[1], 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE)
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo)
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, sceneTex, 0)
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null)
    fit = coverFit(innerWidth, innerHeight, o.water.width, o.water.height)
  }
  resize()

  // drops in q space: (x, y, landing time, strength); a ring buffer
  const drops = new Float32Array(DROPS * 4)
  let slot = 0
  function drop(x: number, y: number, at: number, strength = 0.6 + Math.random() * 0.5) {
    drops.set([x, y, at, strength], slot * 4)
    slot = (slot + 1) % DROPS
  }
  const half = () => {
    const s = Math.min(innerWidth, innerHeight)
    return [innerWidth / 2 / s, innerHeight / 2 / s]
  }
  function randomDrop(at: number) {
    const [hx, hy] = half()
    for (let tries = 0; tries < 8; tries++) {
      const x = (Math.random() * 2 - 1) * hx * 0.95,
        y = (Math.random() * 2 - 1) * hy * 0.95
      if (Math.max(Math.abs(x), Math.abs(y)) > hole * 2.4) return drop(x, y, at)
    }
  }

  // the clock pauses through main-thread stalls instead of skipping ahead
  let raf = 0,
    t = 0,
    last = performance.now(),
    enteredAt = -1,
    nextDrop = 0.6,
    done = false
  const paintTimer = setTimeout(() => {
    const painted = o.painting()
    gl.bindTexture(gl.TEXTURE_2D, image)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, painted)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    ready = 1
  }, 160)

  type Uniform = (name: string) => WebGLUniformLocation | null
  function shared(u: Uniform, w: number, h: number, reveal: number, open: number, R: number) {
    gl!.uniform2f(u('uRes'), w, h)
    gl!.uniform2fv(u('uScale'), fit.scale)
    gl!.uniform2fv(u('uOffset'), fit.offset)
    gl!.uniform1f(u('uReady'), ready)
    gl!.uniform1f(u('uTime'), t)
    gl!.uniform1f(u('uOpen'), open)
    gl!.uniform1f(u('uR'), R)
    gl!.uniform4fv(u('uDrops'), drops)
    gl!.uniform1f(u('uReveal'), reveal)
  }

  function frame(now: number) {
    t += Math.min(now - last, 34) / 1000
    last = now
    const since = enteredAt < 0 ? -1 : t - enteredAt
    if (t >= nextDrop) {
      // quiet rain while waiting; heavier for a moment once entered
      const hard = since >= 0 && since < 1.8
      if (since < 2.6) randomDrop(t + 0.28)
      nextDrop = t + (hard ? 0.16 + Math.random() * 0.14 : 0.55 + Math.random() * 0.6)
    }
    const tint = since < 0 ? 0 : span(since, AFTER.TINT),
      reveal = since < 0 ? 0 : span(since, AFTER.REVEAL),
      open = since < 0 ? 0 : span(since, AFTER.OPEN)
    const [hx, hy] = half()
    const R = hole + (Math.max(hx, hy) * 1.04 - hole) * open

    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo)
    gl!.viewport(0, 0, sceneSize[0], sceneSize[1])
    gl!.useProgram(scene.p)
    gl!.activeTexture(gl!.TEXTURE0)
    gl!.bindTexture(gl!.TEXTURE_2D, image)
    gl!.uniform1i(scene.at('uImage'), 0)
    gl!.activeTexture(gl!.TEXTURE2)
    gl!.bindTexture(gl!.TEXTURE_2D, waterTex)
    gl!.uniform1i(scene.at('uWater'), 2)
    shared(scene.at, sceneSize[0], sceneSize[1], reveal, open, R)
    gl!.uniform1f(scene.at('uEnter'), enteredAt)
    gl!.uniform1f(scene.at('uTint'), tint)
    gl!.uniform1f(scene.at('uHole'), hole)
    gl!.drawArrays(gl!.TRIANGLES, 0, 3)

    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null)
    gl!.viewport(0, 0, canvas.width, canvas.height)
    gl!.useProgram(brush.p)
    gl!.activeTexture(gl!.TEXTURE1)
    gl!.bindTexture(gl!.TEXTURE_2D, sceneTex)
    gl!.uniform1i(brush.at('uScene'), 1)
    gl!.uniform1i(brush.at('uImage'), 0)
    shared(brush.at, canvas.width, canvas.height, reveal, open, R)
    gl!.drawArrays(gl!.TRIANGLES, 0, 3)

    if (since >= AFTER.OPEN[1] && !done) {
      done = true
      o.onDone()
    }
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  addEventListener('resize', resize)

  return {
    /** Lets the rain in: a drop where the visitor touched, and one that falls into the opening. */
    enter(clientX?: number, clientY?: number) {
      if (enteredAt >= 0) return
      enteredAt = t
      const s = Math.min(innerWidth, innerHeight)
      if (clientX !== undefined && clientY !== undefined)
        drop((clientX - innerWidth / 2) / s, (innerHeight / 2 - clientY) / s, t + 0.05, 1)
      drop(hole * 0.2, hole * 0.3, t + 0.3, 1.1)
      nextDrop = t + 0.4
    },
    destroy() {
      cancelAnimationFrame(raf)
      clearTimeout(paintTimer)
      removeEventListener('resize', resize)
      gl.deleteTexture(image)
      gl.deleteTexture(waterTex)
      gl.deleteTexture(sceneTex)
      gl.deleteFramebuffer(fbo)
      gl.deleteBuffer(buffer)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(scene.p)
      gl.deleteProgram(brush.p)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
