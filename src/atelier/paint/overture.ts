import { coverFit, frameDelta, type Vec2 } from './presets'
import { noise, vertexSource } from './shaders'
import type { Light, Weather } from '../weather'

const DROPS = 48
/** Seconds a raindrop is seen falling before it lands and rings the water. */
const FALL = 0.3,
  FALL_SPEED = 1.7
/** Ring speed on the water, in block units per second. */
const SPEED = 0.16
const SKY = { rain: 0, sun: 1, wind: 2, mist: 3, snow: 4 } as const
const SEASON = { spring: 0, summer: 1, autumn: 2, winter: 3 } as const
/**
 * Seconds after entering: the view sinks into the water while the painting
 * is laid down. The laying waits for the painting if it is still being made.
 */
const SINK = 1.5,
  REVEAL = { AFTER: 0.7, TAKES: 1.4 }

/**
 * The block of water, seen from above at an angle: half its side and its
 * depth, its turn on the paper, the projection's two scales, and where it
 * sits. Space `q` is centered, y up, measured in the shorter screen side.
 */
const S = 0.29,
  H = 0.075,
  TURN = -0.2,
  CX = 0.82,
  CY = 0.46,
  AT: Vec2 = [0, -0.06]
const E1: Vec2 = [Math.cos(TURN), Math.sin(TURN)],
  E2: Vec2 = [-Math.sin(TURN), Math.cos(TURN)]
const project = (w: Vec2): Vec2 => [CX * (w[0] - w[1]), CY * (w[0] + w[1])]
const A = project(E1),
  B = project(E2)
const f = (n: number) => n.toFixed(5)
const vec2 = (v: Vec2) => `vec2(${f(v[0])}, ${f(v[1])})`

/** Where `q` lands on the plane at height y, in the block's own coordinates. */
function onPlane(q: Vec2, y: number): Vec2 {
  const a = (q[0] - AT[0]) / CX,
    b = (q[1] - AT[1] - y) / CY
  const w: Vec2 = [(a + b) / 2, (b - a) / 2]
  return [w[0] * E1[0] + w[1] * E1[1], w[0] * E2[0] + w[1] * E2[1]]
}

const geometry = `const float S = ${f(S)}, H = ${f(H)}, CX = ${f(CX)}, CY = ${f(CY)};
const vec2 AT = ${vec2(AT)}, E1 = ${vec2(E1)}, E2 = ${vec2(E2)}, A = ${vec2(A)}, B = ${vec2(B)};
uniform float uZoom;
// sinking into the water: magnify around the middle of its surface
vec2 view(vec2 q) {
  vec2 z = AT + vec2(0.0, H);
  return z + (q - z) * uZoom;
}
vec2 onPlane(vec2 q, float y) {
  vec2 p = q - AT;
  p.y -= y;
  float a = p.x / CX, b = p.y / CY;
  vec2 w = vec2(a + b, b - a) * 0.5;
  return vec2(dot(w, E1), dot(w, E2));
}
// 0 paper, 1 the water's surface, 2 and 3 the two near sides; st places q on that face
int face(vec2 q, out vec2 st) {
  vec2 l = onPlane(q, H);
  st = l;
  if (max(abs(l.x), abs(l.y)) < S) return 1;
  vec2 p = q - AT;
  float v = (p.x + S * A.x) / B.x;
  float y = p.y + S * A.y - v * B.y;
  st = vec2(v, y);
  if (abs(v) < S && y > 0.0 && y < H) return 2;
  float u = (p.x + S * B.x) / A.x;
  y = p.y + S * B.y - u * A.y;
  st = vec2(u, y);
  if (abs(u) < S && y > 0.0 && y < H) return 3;
  return 0;
}`

const weatherUniforms = `uniform vec2 uRes;
uniform float uTime;
uniform vec3 uPaper;
uniform vec3 uWater;
uniform vec3 uDeep;
uniform vec3 uLight;
uniform vec3 uInk;
uniform vec2 uFrom;
uniform float uSun;
uniform int uSky;
uniform int uSeason;
uniform float uStrength;
uniform float uLean;
uniform float uSink;`

/**
 * Pass one: the scene before any brushwork. Paper, the block's shadow, and
 * the block itself: water on top, lit by the hour, ringed by drops; glass
 * sides showing the water's body; mist over everything on a misty day.
 */
const sceneSource = `#version 300 es
precision highp float;
${weatherUniforms}
uniform vec4 uDrops[${DROPS}];
in vec2 vUv;
out vec4 outColor;

${noise}
${geometry}

void main() {
  float m = min(uRes.x, uRes.y);
  vec2 q0 = (gl_FragCoord.xy - 0.5 * uRes) / m;
  vec2 q = view(q0);
  float t = uTime;
  vec2 st;
  int side = face(q, st);

  vec3 paper = uPaper * (0.97 + vnoise(q0 * 7.0) * 0.04 + (vnoise(q0 * 36.0) - 0.5) * 0.012);
  paper *= 1.0 - dot(q0, q0) * 0.1;
  vec3 col = paper;

  if (side == 0) {
    // the shadow falls away from the light, softest at its far edge
    vec2 g = onPlane(q + uFrom * 0.07, 0.0), g0 = onPlane(q, 0.0);
    float shade = smoothstep(0.06, -0.02, max(abs(g.x), abs(g.y)) - S);
    float contact = smoothstep(0.025, 0.0, max(abs(g0.x), abs(g0.y)) - S);
    col *= 1.0 - shade * (0.05 + uSun * 0.16) - contact * 0.1;
  } else if (side == 1) {
    vec2 l = st / S;
    col = mix(uWater, uDeep, vnoise(l * 1.7 + 3.0) * 0.45 + (l.y + 1.0) * 0.1);
    // the sky in the water: a soft pale patch, set off from the light
    float sky = length((l + uFrom * 0.35) * vec2(1.0, 1.3)) + (vnoise(l * 3.0 + t * 0.05) - 0.5) * 0.5;
    col = mix(col, mix(uPaper, uLight, 0.5), smoothstep(0.75, 0.15, sky) * (0.22 + uSun * 0.35));
    // wind combs the surface into streaks
    float comb = vnoise(vec2(l.x * 14.0 - t * uLean * 8.0, l.y * 3.0 + t * 0.2));
    col += (comb - 0.5) * (uSky == 2 ? 0.16 : 0.05);
    // sun: glints that come and go
    if (uSky != 0 && uSky != 4) {
      vec2 cell = floor(l * 46.0);
      float g = hash(cell + floor(t * 2.5 + hash(cell) * 7.0));
      float wave = vnoise(l * 9.0 + t * 0.4);
      col += uLight * step(0.965, g) * smoothstep(0.45, 0.8, wave) * uSun * 0.9;
    }
    float crest = 0.0, trough = 0.0;
    for (int i = 0; i < ${DROPS}; i++) {
      vec4 d = uDrops[i];
      float age = t - d.z;
      if (age < 0.0 || d.w <= 0.0) continue;
      float fade = d.w * exp(-age * 1.1);
      float s = length(st - d.xy) - ${f(SPEED)} * age;
      float ring = exp(-s * s / 0.00005) - 0.7 * exp(-pow(s + 0.012, 2.0) / 0.00005)
        + 0.4 * exp(-pow(s + 0.03, 2.0) / 0.00004);
      crest += max(ring, 0.0) * fade;
      trough += max(-ring, 0.0) * fade;
      // the drop itself, for a moment, where it struck
      crest += exp(-dot(st - d.xy, st - d.xy) / 0.00002) * smoothstep(0.14, 0.0, age) * d.w;
    }
    col = mix(col, mix(uLight, vec3(1.0), 0.5), clamp(crest * 0.9, 0.0, 0.85));
    col = mix(col, uDeep * 0.8, clamp(trough * 0.6, 0.0, 0.6));
    // winter: frost creeping in from the rim
    if (uSeason == 3) {
      float rim = smoothstep(0.8, 1.0, max(abs(l.x), abs(l.y)) + (vnoise(l * 12.0) - 0.5) * 0.12);
      col = mix(col, vec3(0.93, 0.95, 0.97) * mix(vec3(1.0), uLight, 0.3), rim * (uSky == 4 ? 0.6 : 0.3));
    }
  } else {
    // glass sides: the body of the water, the paper faintly through it
    float y = st.y / H;
    float lit = side == 2 ? 0.5 - uFrom.x * 0.5 : 0.5 + uFrom.x * 0.5;
    col = mix(mix(uDeep, uWater, 0.35 + y * 0.45), paper, 0.25);
    col *= 0.8 + lit * 0.24;
    col += (vnoise(vec2(st.x * 60.0, y * 3.0)) - 0.5) * 0.05;
    col = mix(col, mix(uWater, vec3(1.0), 0.4), exp(-pow((y - 0.84) / 0.05, 2.0)) * 0.45);
  }

  if (uSky == 3) {
    float fog = uStrength * (0.32 + 0.35 * vnoise(q0 * 2.2 + vec2(t * 0.03, 0.0)));
    col = mix(col, mix(uPaper, vec3(1.0), 0.15), fog);
  }
  col = mix(uPaper, col, smoothstep(0.0, 1.0, t));
  outColor = vec4(col, 1.0);
}`

/**
 * Pass two: brushwork over everything, so paper, water and weather share
 * one hand. Then what is drawn rather than painted: the block's ink outline,
 * sketched twice like the reference drawing, and whatever is falling. Once
 * the visitor enters, the home painting is laid down stroke by stroke.
 */
const brushSource = `#version 300 es
precision highp float;
${weatherUniforms}
uniform sampler2D uScene;
uniform sampler2D uImage;
uniform vec2 uScale;
uniform vec2 uOffset;
uniform float uReveal;
uniform vec4 uDrops[${DROPS}];
in vec2 vUv;
out vec4 outColor;

${noise}
${geometry}
// a point on the water's surface, back on the screen
vec2 screenOf(vec2 l) {
  vec2 w = l.x * E1 + l.y * E2;
  vec2 q = AT + vec2(CX * (w.x - w.y), CY * (w.x + w.y) + H);
  vec2 z = AT + vec2(0.0, H);
  return z + (q - z) / uZoom;
}
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 painting(vec2 screen) {
  return texture(uImage, clamp(screen * uScale + uOffset, vec2(0.001), vec2(0.999))).rgb;
}
float edgeAt(vec2 q0, float e, float seed) {
  vec2 j = (vec2(vnoise(q0 * 34.0 + seed), vnoise(q0 * 34.0 + seed + 9.0)) - 0.5) * 0.007;
  vec2 st;
  int f0 = face(view(q0 + j), st);
  int fx = face(view(q0 + j + vec2(e, 0.0)), st);
  int fy = face(view(q0 + j + vec2(0.0, e)), st);
  return f0 != fx || f0 != fy ? 1.0 : 0.0;
}

void main() {
  float m = min(uRes.x, uRes.y);
  vec2 q0 = (gl_FragCoord.xy - 0.5 * uRes) / m;
  vec2 screen = gl_FragCoord.xy / uRes;
  vec2 toUv = m / uRes;
  float t = uTime;
  vec2 st;
  // bare paper takes the brush lightly: rows of dabs on a flat ground read as stripes
  float worked = face(view(q0), st) == 0 ? 0.35 : 1.0;

  float a = 0.04 + (vnoise(q0 * 2.6 + t * 0.02) - 0.5) * 0.8;
  vec2 dir = vec2(cos(a), sin(a)), perp = vec2(-dir.y, dir.x);
  vec2 sp = vec2(dot(q0, dir), dot(q0, perp)) * vec2(32.0, 76.0);
  sp.x += hash(vec2(floor(sp.y), 3.1)) * 7.0;
  vec2 cell = floor(sp), local = fract(sp);
  float h1 = hash(cell), h2 = hash(cell + 17.3), h3 = hash(cell + 5.1);
  // bristles stay coarser than a pixel, or they alias into moire
  float bristle = vnoise(vec2(sp.x * 0.6, sp.y * 2.2) + h1 * 10.0);

  vec2 along = dir * toUv * 0.009 * (0.55 + h1 * 0.9);
  vec3 col = vec3(0.0);
  float wsum = 0.0;
  for (int i = -2; i <= 2; i++) {
    float k = float(i) / 2.0, w = 1.0 - abs(k) * 0.5;
    col += texture(uScene, screen + along * k).rgb * w;
    wsum += w;
  }
  vec3 sharp = texture(uScene, screen).rgb;
  col = mix(col / wsum, sharp, 0.4);

  // the home painting arrives stroke by stroke, outward from the middle
  float laid = 0.0;
  if (uReveal > 0.0) {
    vec2 msp = vec2(dot(q0, vec2(1.0, 0.04)), dot(q0, vec2(-0.04, 1.0))) * vec2(15.0, 42.0);
    msp.x += hash(vec2(floor(msp.y), 1.7)) * 5.0;
    float due = length(q0) * 0.45 + hash(floor(msp)) * 0.32 + vnoise(q0 * 3.0) * 0.15
      + smoothstep(0.55, 1.0, abs(fract(msp.x) - 0.5) * 2.0) * 0.1;
    due = clamp(due * 0.85, 0.06, 0.94);
    laid = smoothstep(due - 0.05, due + 0.05, uReveal * 1.25 - 0.1);
    vec3 paint = vec3(0.0);
    for (int i = -2; i <= 2; i++) paint += painting(screen + dir * toUv * float(i) * 0.005);
    col = mix(col, paint / 5.0, laid);
    sharp = mix(sharp, painting(screen), laid);
  }

  // broken color: each dab leans a little warm or cool
  col += vec3(h2 - 0.5, (h3 - 0.5) * 0.5, 0.5 - h2) * 0.026 * worked;
  float dabEdge = smoothstep(0.0, 0.3, local.y) * smoothstep(1.0, 0.7, local.y);
  float height = lum(sharp) * 0.75 + (bristle * 0.2 + dabEdge * 0.03) * worked;
  vec2 dH = vec2(dFdx(height), dFdy(height));
  vec3 N = normalize(vec3(-dH * 4.0 * (uRes.y / 800.0), 1.0));
  vec3 L = normalize(vec3(uFrom, 0.9));
  col *= 0.86 + dot(N, L) * 0.2;
  col += pow(max(dot(reflect(-L, N), vec3(0.0, 0.0, 1.0)), 0.0), 20.0) * 0.05;

  float drawn = (1.0 - laid) * (1.0 - uSink);
  // ink: the outline, gone over twice by a quick hand
  float e = 1.5 / m;
  float ink = max(edgeAt(q0, e, 0.0), edgeAt(q0, e, 41.0) * 0.45);
  col = mix(col, uInk, ink * (0.6 + vnoise(q0 * 300.0) * 0.3) * drawn);

  vec3 rain = mix(uInk, uDeep, 0.35);
  if (uSky == 0) {
    // over the water, only the drops that will ring it are drawn: each a
    // streak that ends where it lands. Elsewhere the rain falls on paper.
    vec2 up = vec2(sin(uLean), cos(uLean));
    for (int i = 0; i < ${DROPS}; i++) {
      vec4 d = uDrops[i];
      float left = d.z - uTime;
      if (left <= 0.0 || left > ${f(FALL)} || d.w <= 0.0) continue;
      vec2 head = screenOf(d.xy) + up * left * ${f(FALL_SPEED)};
      vec2 pa = q0 - head, ba = up * 0.08;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      float line = smoothstep(0.0016, 0.0004, length(pa - ba * h)) * (1.0 - h * 0.75);
      col = mix(col, rain, line * 0.6 * drawn);
    }
    float open = worked < 1.0 ? 1.0 : 0.0;
    vec2 r = mat2(cos(uLean), sin(uLean), -sin(uLean), cos(uLean)) * q0;
    for (int layer = 0; layer < 3; layer++) {
      float k = float(layer);
      float cols = 130.0 - k * 36.0, speed = 1.4 + k * 0.5, len = 0.06 + k * 0.035;
      float cx = floor(r.x * cols);
      float h = hash(vec2(cx, k * 7.1));
      if (h > 0.3 + uStrength * 0.4) continue;
      float x = (cx + 0.5 + (hash(vec2(cx, 3.3 + k)) - 0.5) * 0.6) / cols;
      float head = 1.1 - mod(t * speed + h * 13.0, 2.4);
      float above = r.y - head;
      float on = step(0.0, above) * step(above, len);
      float line = smoothstep(0.0013, 0.0003, abs(r.x - x)) * on * (1.0 - above / len * 0.7);
      col = mix(col, rain, line * (0.3 + k * 0.15) * (0.6 + bristle * 0.4) * drawn * open);
    }
  } else if (uSky == 4) {
    for (int layer = 0; layer < 3; layer++) {
      float k = float(layer), scale = 26.0 - k * 7.0;
      vec2 g = q0 * scale + vec2(sin(t * 0.6 + k + q0.y * 3.0) * 0.5 - t * uLean * 2.0, t * (0.9 + k * 0.45));
      vec2 c = floor(g);
      if (hash(c + k * 13.0) > 0.12 + uStrength * 0.16) continue;
      vec2 p = fract(g) - 0.5 + (vec2(hash(c + 1.7), hash(c + 4.2)) - 0.5) * 0.5;
      float size = 0.0035 + k * 0.0025;
      float flake = smoothstep(size, size * 0.2, length(p) / scale);
      col = mix(col, mix(vec3(0.98), uLight, 0.15), flake * (0.55 + k * 0.15) * drawn);
    }
  } else if (uSky == 2 && (uSeason == 0 || uSeason == 2)) {
    // petals in spring, leaves in autumn, carried across by the wind
    vec3 tint = uSeason == 0 ? vec3(0.95, 0.76, 0.8) : vec3(0.78, 0.46, 0.2);
    for (int layer = 0; layer < 2; layer++) {
      float k = float(layer), scale = 9.0 - k * 3.0;
      vec2 g = q0 * scale + vec2(-t * sign(uLean) * (1.6 + k), t * 0.35 + sin(t + q0.x * 4.0) * 0.4);
      vec2 c = floor(g);
      if (hash(c + 3.0 + k) > 0.12) continue;
      vec2 p = fract(g) - 0.5 + (vec2(hash(c + 2.1), hash(c + 6.4)) - 0.5) * 0.5;
      float spin = t * (1.0 + hash(c) * 2.0) + hash(c + 9.0) * 6.28;
      p = mat2(cos(spin), sin(spin), -sin(spin), cos(spin)) * p;
      float leaf = smoothstep(1.0, 0.6, length(p / vec2(0.09, 0.04)));
      col = mix(col, tint * (0.85 + hash(c + 5.0) * 0.3), leaf * 0.9 * drawn);
    }
  }

  col += (hash(gl_FragCoord.xy) - 0.5) * 0.018;
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

const ease = (v: number) => {
  const t = Math.min(1, Math.max(0, v))
  return t * t * (3 - 2 * t)
}
const span = (t: number, [a, b]: readonly [number, number]) => ease((t - a) / (b - a))

export type OvertureHandle = {
  /** Sinks into the water and lays the home painting down; `onDone` follows. */
  enter(): void
  /** A drop where the visitor touched, if they touched the water. */
  touch(clientX: number, clientY: number): void
  /** A faint ring trailing the pointer across the water. */
  stir(clientX: number, clientY: number): void
  destroy(): void
}

/** Throws without WebGL2; callers skip the overture. */
export function mountOverture(o: {
  canvas: HTMLCanvasElement
  weather: Weather
  light: Light
  /** Paints the home painting; slow, so called after the first frames. */
  painting: () => HTMLCanvasElement
  /** Its crop, as the home page's object-position, so the handover lines up. */
  focus: Vec2
  /** Called once the painting is laid down. */
  onDone: () => void
}): OvertureHandle {
  const { canvas, weather, light } = o
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
  const blank = light.water.map((v) => Math.round(v * 255))
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([...blank, 255]))
  const sceneTex = gl.createTexture()!
  const fbo = gl.createFramebuffer()!
  let painted: HTMLCanvasElement | null = null,
    fit = coverFit(1, 1, 1, 1),
    sceneSize = [2, 2]

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
    if (painted) fit = coverFit(innerWidth, innerHeight, painted.width, painted.height, o.focus)
  }
  resize()

  // drops on the water, in block coordinates: (x, y, landing time, strength); a ring buffer
  const drops = new Float32Array(DROPS * 4)
  let slot = 0
  function drop(x: number, y: number, at: number, strength = 0.5 + Math.random() * 0.4) {
    drops.set([x, y, at, strength], slot * 4)
    slot = (slot + 1) % DROPS
  }

  // the clock pauses through main-thread stalls instead of skipping ahead
  let raf = 0,
    t = 0,
    last = performance.now(),
    enteredAt = -1,
    paintedAt = -1,
    nextDrop = 0.5,
    lastStir = 0,
    zoom = 1,
    done = false
  const paintTimer = setTimeout(() => {
    painted = o.painting()
    gl.bindTexture(gl.TEXTURE_2D, image)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, painted)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    fit = coverFit(innerWidth, innerHeight, painted.width, painted.height, o.focus)
    paintedAt = t
  }, 400)

  /** A client point on the water's surface, in block coordinates; null off the water. */
  function waterAt(clientX: number, clientY: number): Vec2 | null {
    const m = Math.min(innerWidth, innerHeight)
    const q: Vec2 = [(clientX - innerWidth / 2) / m, (innerHeight / 2 - clientY) / m]
    const z: Vec2 = [AT[0], AT[1] + H]
    const l = onPlane([z[0] + (q[0] - z[0]) * zoom, z[1] + (q[1] - z[1]) * zoom], H)
    return Math.max(Math.abs(l[0]), Math.abs(l[1])) < S ? l : null
  }

  type Uniform = (name: string) => WebGLUniformLocation | null
  function shared(u: Uniform, w: number, h: number, sink: number) {
    gl!.uniform2f(u('uRes'), w, h)
    gl!.uniform1f(u('uTime'), t)
    gl!.uniform3fv(u('uPaper'), light.paper)
    gl!.uniform3fv(u('uWater'), light.water)
    gl!.uniform3fv(u('uDeep'), light.deep)
    gl!.uniform3fv(u('uLight'), light.light)
    gl!.uniform3fv(u('uInk'), light.ink)
    gl!.uniform2fv(u('uFrom'), light.from)
    gl!.uniform1f(u('uSun'), light.sun)
    gl!.uniform1i(u('uSky'), SKY[weather.sky])
    gl!.uniform1i(u('uSeason'), SEASON[weather.season])
    gl!.uniform1f(u('uStrength'), weather.strength)
    gl!.uniform1f(u('uLean'), weather.lean)
    gl!.uniform1f(u('uSink'), sink)
    gl!.uniform1f(u('uZoom'), zoom)
  }

  function frame(now: number) {
    raf = 0
    if (document.hidden) return
    t += frameDelta(now, last, 34) / 1000
    last = now
    const since = enteredAt < 0 ? -1 : t - enteredAt
    if (weather.sky === 'rain' && t >= nextDrop && enteredAt < 0) {
      drop((Math.random() * 2 - 1) * S * 0.95, (Math.random() * 2 - 1) * S * 0.95, t + FALL)
      nextDrop = t + (0.2 - weather.strength * 0.1) * (0.5 + Math.random())
    }
    const sink = since < 0 ? 0 : span(since, [0, SINK])
    const from = Math.max(enteredAt + REVEAL.AFTER, paintedAt),
      reveal = since < 0 || paintedAt < 0 ? 0 : ease((t - from) / REVEAL.TAKES)
    zoom = 1 - sink * 0.9

    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo)
    gl!.viewport(0, 0, sceneSize[0], sceneSize[1])
    gl!.useProgram(scene.p)
    shared(scene.at, sceneSize[0], sceneSize[1], sink)
    gl!.uniform4fv(scene.at('uDrops'), drops)
    gl!.drawArrays(gl!.TRIANGLES, 0, 3)

    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null)
    gl!.viewport(0, 0, canvas.width, canvas.height)
    gl!.useProgram(brush.p)
    gl!.activeTexture(gl!.TEXTURE1)
    gl!.bindTexture(gl!.TEXTURE_2D, sceneTex)
    gl!.uniform1i(brush.at('uScene'), 1)
    gl!.activeTexture(gl!.TEXTURE0)
    gl!.bindTexture(gl!.TEXTURE_2D, image)
    gl!.uniform1i(brush.at('uImage'), 0)
    gl!.uniform2fv(brush.at('uScale'), fit.scale)
    gl!.uniform2fv(brush.at('uOffset'), fit.offset)
    gl!.uniform1f(brush.at('uReveal'), reveal)
    gl!.uniform4fv(brush.at('uDrops'), drops)
    shared(brush.at, canvas.width, canvas.height, sink)
    gl!.drawArrays(gl!.TRIANGLES, 0, 3)

    if (sink >= 1 && reveal >= 1 && !done) {
      done = true
      o.onDone()
    }
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  const onVisibility = () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0 }
    else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame) }
  }
  document.addEventListener('visibilitychange', onVisibility)
  addEventListener('resize', resize)

  return {
    enter() {
      if (enteredAt >= 0) return
      enteredAt = t
      drop(0, 0, t, 1.2)
    },
    touch(clientX, clientY) {
      const at = waterAt(clientX, clientY)
      if (at && enteredAt < 0) drop(at[0], at[1], t, 1.1)
    },
    stir(clientX, clientY) {
      if (t - lastStir < 0.14 || enteredAt >= 0) return
      const at = waterAt(clientX, clientY)
      if (!at) return
      lastStir = t
      drop(at[0], at[1], t, 0.3)
    },
    destroy() {
      cancelAnimationFrame(raf)
      clearTimeout(paintTimer)
      removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      gl.deleteTexture(image)
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
