import { NoBlending, ShaderMaterial, Vector2, type Texture } from 'three'

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

/**
 * Repaints a linear, premultiplied scene render as an oil sketch and writes
 * premultiplied sRGB, so the canvas can sit directly on the paper.
 */
const fragmentShader = `
precision highp float;
uniform sampler2D tScene;
uniform vec2 uRes;
uniform float uPx;
uniform vec2 uLight;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 toSrgb(vec3 c) {
  c = max(c, 0.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
// straight-alpha sRGB colour and coverage
vec4 src(vec2 uv, float lod) {
  vec4 c = textureLod(tScene, clamp(uv, vec2(0.0), vec2(1.0)), lod);
  return vec4(c.a > 0.002 ? toSrgb(c.rgb / c.a) : vec3(0.0), c.a);
}

void main() {
  vec2 px = uPx / uRes;
  vec2 frag = vUv * uRes / uPx;

  vec3 patchCol = src(vUv, 1.0).rgb;
  vec2 o = px * 3.0;
  float patchA = src(vUv, 0.0).a;
  float avgA = (src(vUv + o, 1.0).a + src(vUv - o, 1.0).a +
    src(vUv + vec2(o.x, -o.y), 1.0).a + src(vUv + vec2(-o.x, o.y), 1.0).a) * 0.25;

  // Discrete dabs: one stroke per jittered cell, aimed along the form at its centre.
  float cellSize = 11.0;
  vec2 base = floor(frag / cellSize);
  float bestP = -1.0, inside = 0.0;
  vec2 bestLocal = vec2(0.0), bestCell = vec2(0.0), bestCenter = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 c = base + vec2(float(i), float(j));
      vec2 center = (c + 0.5 + (vec2(hash(c), hash(c + 7.7)) - 0.5) * 0.8) * cellSize;
      vec2 cuv = center * uPx / uRes;
      vec2 e = px * 6.0;
      vec2 g = vec2(
        lum(src(cuv + vec2(e.x, 0.0), 3.0).rgb) - lum(src(cuv - vec2(e.x, 0.0), 3.0).rgb),
        lum(src(cuv + vec2(0.0, e.y), 3.0).rgb) - lum(src(cuv - vec2(0.0, e.y), 3.0).rgb)
      );
      float edge = clamp(length(g) * 8.0, 0.0, 1.0);
      float ang = 0.55 + (hash(c + 3.3) - 0.5) * 0.7;
      vec2 fixedDir = vec2(cos(ang), sin(ang));
      vec2 tangent = normalize(vec2(-g.y, g.x) + 1e-6);
      if (dot(tangent, fixedDir) < 0.0) tangent = -tangent;
      vec2 dir = normalize(mix(fixedDir, tangent, edge));
      vec2 d = frag - center;
      float h = hash(c + 11.1);
      vec2 lp = vec2(dot(d, dir), dot(d, vec2(-dir.y, dir.x))) / (cellSize * vec2(1.05 + h * 0.75, 0.42 + h * 0.12));
      float fringe = (vnoise(vec2(lp.x * 3.0, lp.y * 9.0) + h * 20.0) - 0.5) * 0.35;
      float k = 1.0 - length(lp) + fringe;
      if (k > 0.0 && h > bestP) {
        bestP = h;
        inside = k;
        bestLocal = lp;
        bestCell = c;
        bestCenter = cuv;
      }
    }
  }
  float h1 = hash(bestCell), h2 = hash(bestCell + 17.3), h3 = hash(bestCell + 5.1);
  vec4 dab = src(bestCenter, 1.5);
  vec4 here = src(vUv, 1.0);
  float hasDab = step(0.0, bestP);
  vec3 col = mix(patchCol, mix(dab.rgb, here.rgb, 0.3), hasDab * step(0.05, dab.a));

  // Broken colour: dabs lean warm or cool, shadows go ultramarine, lights go ochre.
  float l = lum(col);
  col = mix(col * vec3(0.7, 0.8, 1.08) + vec3(0.03, 0.05, 0.11), col, smoothstep(0.2, 0.7, l));
  col += vec3(0.035, 0.02, -0.02) * smoothstep(0.62, 0.95, l);
  vec3 warm = vec3(0.06, 0.025, -0.035), cool = vec3(-0.035, 0.0, 0.06);
  col += (h2 > 0.6 ? warm : h2 < 0.3 ? cool : vec3(0.0)) * (0.4 + h3 * 0.5);
  col += (h3 - 0.5) * 0.03;

  // Impasto: ridges run along each stroke, thicker in the middle of the dab.
  float bristle = vnoise(vec2(bestLocal.x * 1.5, bestLocal.y * 11.0) + h1 * 30.0);
  float height = hasDab * (clamp(inside * 2.0, 0.0, 1.0) * 0.6 + bristle * 0.4);
  vec2 dH = vec2(dFdx(height), dFdy(height));
  vec3 N = normalize(vec3(-dH * 1.8, 1.0));
  vec3 L = normalize(vec3(uLight, 0.9));
  float spec = pow(max(dot(reflect(-L, N), vec3(0.0, 0.0, 1.0)), 0.0), 16.0);
  col *= 0.86 + dot(N, L) * 0.2;
  col += spec * 0.045 * hasDab;

  // Strokes seeded inside the form may reach past it; cast shadows stay a thin wash.
  float own = mix(avgA, patchA, 0.6);
  float reach = hasDab * smoothstep(0.0, 0.25, inside) * dab.a;
  float a = max(own * smoothstep(0.35, 0.65, own + (bristle - 0.5) * 0.5), reach);
  float washy = 1.0 - smoothstep(0.3, 0.5, max(own, dab.a));
  a = mix(a, max(own, reach) * (0.75 + bristle * 0.4), washy);
  vec2 rim = min(vUv, 1.0 - vUv);
  a *= smoothstep(0.0, 0.16, min(rim.x, rim.y) + (bristle - 0.5) * 0.05);

  vec2 weave = gl_FragCoord.xy * 0.9;
  col += sin(weave.x) * sin(weave.y) * 0.012 + (hash(gl_FragCoord.xy) - 0.5) * 0.018;
  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}`

export function createPaintMaterial(scene: Texture) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tScene: { value: scene },
      uRes: { value: new Vector2(1, 1) },
      uPx: { value: 1 },
      uLight: { value: new Vector2(-0.55, 0.65) },
    },
  })
}
