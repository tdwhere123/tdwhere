import { PAINT_LIGHT_GLSL } from './light'

/** Value noise shared by the paint and overture shaders. */
export const noise = `float hash(vec2 p) {
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
}`

export const vertexSource = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

/**
 * Wet field, in canvas uv: xy = pigment displacement, z = glow or ink,
 * w = knife scrape. Positions use aspect-corrected space (x * aspect, y).
 */
export const fieldSource = `#version 300 es
precision highp float;
uniform sampler2D uField;
uniform vec2 uTexel;
uniform float uAspect;
uniform vec2 uP0;
uniform vec2 uP1;
uniform vec2 uVel;
uniform float uBrush;
uniform float uRadius;
uniform vec3 uGain;
uniform vec2 uAniso;
uniform vec3 uDecay;
uniform vec2 uDiffuse;
uniform int uMode;
uniform vec4 uPulse[8];
uniform int uPulseCount;
in vec2 vUv;
out vec4 outField;

float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec4 here = texture(uField, vUv);
  vec2 uv = vUv - here.xy * 0.35;
  vec4 c = texture(uField, uv);
  vec4 n = (
    texture(uField, uv + vec2(uTexel.x, 0.0)) +
    texture(uField, uv - vec2(uTexel.x, 0.0)) +
    texture(uField, uv + vec2(0.0, uTexel.y)) +
    texture(uField, uv - vec2(0.0, uTexel.y))
  ) * 0.25;
  vec4 f;
  f.xy = mix(c.xy, n.xy, uDiffuse.x) * uDecay.x;
  f.z = mix(c.z, n.z, uDiffuse.y) * uDecay.y;
  f.w = mix(c.w, n.w, 0.04) * uDecay.z;

  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  if (uBrush > 0.5) {
    float d = segment(p, vec2(uP0.x * uAspect, uP0.y), vec2(uP1.x * uAspect, uP1.y));
    float fall = exp(-d * d / (uRadius * uRadius));
    float speed = length(uVel * vec2(uAspect, 1.0));
    f.xy += uVel * uAniso * fall * uGain.x;
    f.z += fall * uGain.y * clamp(0.2 + speed * 16.0, 0.0, 1.0) * 0.14;
    f.w += fall * uGain.z * clamp(speed * 22.0, 0.0, 1.0) * 0.12;
  }
  for (int i = 0; i < 8; i++) {
    if (i >= uPulseCount) break;
    vec4 q = uPulse[i];
    vec2 center = vec2(q.x * uAspect, q.y);
    vec2 away = p - center;
    float fall = exp(-dot(away, away) / (q.z * q.z)) * q.w;
    if (uMode == 2) {
      f.w += fall;
    } else if (uMode == 0) {
      f.xy += normalize(away + 1e-5) * vec2(1.0 / uAspect, 1.0) * fall * 0.03;
      f.w += fall * 0.25;
    } else {
      f.z += fall;
    }
  }
  f.xy = clamp(f.xy, vec2(-0.12), vec2(0.12));
  f.zw = clamp(f.zw, 0.0, 1.6);
  outField = f;
}`

export const paintSource = `#version 300 es
precision highp float;
uniform sampler2D uImage;
uniform sampler2D uImageNext;
uniform float uMix;
uniform sampler2D uField;
uniform vec2 uScale;
uniform vec2 uOffset;
uniform vec2 uRes;
uniform float uAspect;
uniform float uTime;
uniform float uAngle;
uniform float uBias;
uniform float uLen;
uniform float uImpasto;
uniform float uDab;
uniform vec2 uLight;
uniform float uSky;
uniform vec3 uLightTint;
uniform vec3 uSkyShade;
uniform vec2 uDay;
uniform vec3 uGlaze;
uniform vec3 uAccent;
uniform vec3 uGround;
uniform int uMode;
uniform vec4 uMarks[4];
uniform int uMarkCount;
// palette knife: x reached so far and the line's y (canvas uv), and how far it has opened; z < 0 is off
uniform vec3 uPart;
in vec2 vUv;
out vec4 outColor;

${noise}
${PAINT_LIGHT_GLSL}
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
// share of the next layer at this fragment; set once the dab cell is known
float gMix = 0.0;
vec3 img(vec2 uv, float lod) {
  vec2 c = clamp(uv, vec2(0.001), vec2(0.999));
  vec3 a = textureLod(uImage, c, lod).rgb;
  if (gMix <= 0.0) return a;
  return mix(a, textureLod(uImageNext, c, lod).rgb, gMix);
}
// canvas-space (aspect-corrected) offset to image uv
vec2 toImage(vec2 d) { return vec2(d.x / uAspect, d.y) * uScale; }

void main() {
  vec4 f = texture(uField, vUv);
  // Where the knife has passed, the paint in its path is gone (the canvas
  // shows through) and what it pushed aside is piled along a ragged edge.
  vec2 pv = vUv;
  float pile = 0.0, lip = 0.0, drag = 0.5, cover = 1.0;
  if (uPart.z >= 0.0) {
    float passed = smoothstep(0.0, 0.05, uPart.x - vUv.x);
    // drawn by hand: a slight slope, and an edge torn unevenly
    float line = uPart.y + (vUv.x - 0.5) * 0.05;
    float rag = ((vnoise(vec2(vUv.x * 46.0, 3.0)) - 0.5) * 0.008
      + (vnoise(vec2(vUv.x * 7.0, 8.0)) - 0.5) * 0.02) * passed * (0.6 + uPart.z * 1.5);
    float gap = (0.0025 + uPart.z) * passed + rag;
    float d = vUv.y - line;
    float beyond = abs(d) - gap;
    if (passed > 0.0 && beyond < 0.0) {
      outColor = vec4(0.0);
      return;
    }
    cover = mix(1.0, smoothstep(0.0, 0.003, beyond), passed);
    pile = exp(-beyond / 0.022) * passed;
    lip = exp(-beyond / 0.004) * passed;
    // the knife drags paint along with it, in streaks, and shoves it off the cut
    drag = vnoise(vec2(vUv.x * 2.5, vUv.y * 240.0));
    pv.x -= pile * 0.035 * (0.3 + drag);
    pv.y -= sign(d) * min(gap, 0.06) * pile;
  }
  vec2 uv = (pv - f.xy) * uScale + uOffset;
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  gMix = uMix;
  // relief comes from the smooth blend: dab-by-dab layers would leave ridges at every dab edge
  float relief = lum(img(uv, 0.0));

  vec2 ex = toImage(vec2(uLen * 1.4, 0.0)), ey = toImage(vec2(0.0, uLen * 1.4));
  vec2 g = vec2(
    lum(img(uv + ex, 3.0)) - lum(img(uv - ex, 3.0)),
    lum(img(uv + ey, 3.0)) - lum(img(uv - ey, 3.0))
  );
  float edge = clamp(length(g) * 7.0, 0.0, 1.0);
  vec2 tangent = normalize(vec2(-g.y, g.x) + 1e-6);
  float a = uAngle + (vnoise(p * 2.6 + uTime * 0.025) - 0.5) * 0.9;
  vec2 fixedDir = vec2(cos(a), sin(a));
  if (dot(tangent, fixedDir) < 0.0) tangent = -tangent;
  vec2 dir = normalize(mix(fixedDir, tangent, edge * (1.0 - uBias)));
  float push = length(f.xy);
  if (push > 1e-4) {
    vec2 pushDir = normalize(f.xy * vec2(uAspect, 1.0));
    if (dot(pushDir, dir) < 0.0) pushDir = -pushDir;
    dir = normalize(mix(dir, pushDir, clamp(push * 30.0, 0.0, 0.85)));
  }
  vec2 perp = vec2(-dir.y, dir.x);

  vec2 sp = vec2(dot(p, dir), dot(p, perp)) * vec2(26.0, 62.0) / uDab;
  float row = floor(sp.y);
  sp.x += hash(vec2(row, 3.1)) * 7.0;
  vec2 cell = floor(sp);
  vec2 local = fract(sp);
  float h1 = hash(cell), h2 = hash(cell + 17.3), h3 = hash(cell + 5.1);

  // The next layer arrives stroke by stroke, in drifting patches. Its strokes
  // get their own grid on a slow direction field: the dab grid above follows
  // the image's edges and would scatter the arrival into per-pixel noise.
  float ma = uAngle + (vnoise(p * 1.1 + 7.0) - 0.5) * 0.7;
  vec2 md = vec2(cos(ma), sin(ma));
  vec2 msp = vec2(dot(p, md), dot(p, vec2(-md.y, md.x))) * vec2(15.0, 42.0);
  msp.x += hash(vec2(floor(msp.y), 1.7)) * 5.0;
  float due = hash(floor(msp)) * 0.45 + vnoise(p * 1.8 + 3.7) * 0.55
    + (vnoise(vec2(msp.x * 0.8, msp.y * 6.0)) - 0.5) * 0.08
    + smoothstep(0.55, 1.0, abs(fract(msp.x) - 0.5) * 2.0) * 0.12
    + smoothstep(0.7, 1.0, abs(fract(msp.y) - 0.5) * 2.0) * 0.06;
  // every stroke must have arrived by the end of the turn, and none before it
  due = clamp(due * 0.85 + 0.05, 0.06, 0.94);
  gMix = smoothstep(due - 0.04, due + 0.04, uMix * 1.2 - 0.1);
  float fresh = gMix * (1.0 - gMix) * 4.0;

  vec2 stroke = toImage(dir * uLen * (0.55 + h1 * 0.9));
  vec3 col = vec3(0.0);
  float wsum = 0.0;
  for (int i = -2; i <= 2; i++) {
    float t = float(i) / 2.0;
    float w = 1.0 - abs(t) * 0.5;
    col += img(uv + stroke * t, 0.0) * w;
    wsum += w;
  }
  col /= wsum;
  vec3 sharp = img(uv, 0.0);
  col = mix(col, sharp, clamp(0.6 - push * 12.0, 0.0, 0.6));

  float dabEdge = smoothstep(0.0, 0.3, local.y) * smoothstep(1.0, 0.7, local.y);
  col += vec3(h2 - 0.5, (h3 - 0.5) * 0.5, 0.5 - h2) * 0.012;

  float bristle = vnoise(vec2(sp.x * 0.6, sp.y * 7.0) + h1 * 10.0);
  float height = relief * mix(0.75, 0.25, uSky) + bristle * mix(0.2, 0.38, uSky)
    + dabEdge * mix(0.03, 0.16, uSky) + pile * bristle * 0.4;
  vec2 dH = vec2(dFdx(height), dFdy(height));
  vec3 N = normalize(vec3(-dH * uImpasto * 4.0 * (uRes.y / 800.0), 1.0));
  vec3 L = normalize(vec3(uLight, 0.9));
  float wet = clamp(push * 14.0 + f.z * 0.35 + fresh * 0.3 + pile * 0.8, 0.0, 1.0);
  float spec = pow(max(dot(reflect(-L, N), vec3(0.0, 0.0, 1.0)), 0.0), 20.0);
  col *= 0.86 + dot(N, L) * 0.2;
  col += spec * (0.04 + wet * 0.2);
  if (uSky > 0.5) {
    col = lightPigment(col, uLightTint, uSkyShade, uDay.x, uDay.y);
    // A few warm, level dabs catch the light already present in the photograph.
    float glint = smoothstep(.58, .9, relief) * smoothstep(.65, .92, h2) * dabEdge;
    col += uLightTint * glint * (.025 + uDay.y * .055);
  }

  float scrape = f.w;
  for (int i = 0; i < 4; i++) {
    if (i >= uMarkCount) break;
    vec4 m = uMarks[i];
    float d = distance(p, vec2(m.x * uAspect, m.y));
    float rough = vnoise(vec2(p.x * 30.0, p.y * 140.0));
    scrape = max(scrape, smoothstep(m.z, m.z * 0.25, d + rough * m.z * 0.45) * m.w);
  }

  if (uMode == 1) {
    float lift = f.z * (0.3 + lum(col) * 0.9) * (0.6 + bristle * 0.6);
    col += uAccent * lift * 0.5;
  } else if (uMode == 3) {
    float thr = 0.16 + (vnoise(p * 55.0) - 0.5) * 0.14 + (vnoise(p * 9.0) - 0.5) * 0.1;
    float body = smoothstep(thr, thr + 0.14, f.z);
    float rim = smoothstep(thr, thr + 0.04, f.z) - smoothstep(thr + 0.05, thr + 0.22, f.z);
    col = mix(col, uAccent, body * 0.7);
    col *= 1.0 - rim * 0.2;
  }
  if (scrape > 0.002) {
    float streak = vnoise(vec2(p.x * 3.0, p.y * (uMode == 2 ? 220.0 : 110.0)));
    float s = clamp(scrape, 0.0, 1.0) * (0.5 + streak * 0.5);
    col = mix(col, uGround * (0.9 + streak * 0.14), s * 0.75);
    col += (smoothstep(0.3, 0.45, s) - smoothstep(0.45, 0.7, s)) * 0.05;
  }

  // knife streaks in the shoved paint, and a wet lip catching light along the cut
  col *= 1.0 - pile * (0.5 - drag) * 0.22;
  col += lip * (0.16 + spec * 0.5);
  col *= uGlaze;
  vec2 weave = gl_FragCoord.xy * 0.9;
  col += sin(weave.x) * sin(weave.y) * 0.012 + (hash(gl_FragCoord.xy) - 0.5) * 0.02;
  outColor = vec4(clamp(col, 0.0, 1.0) * cover, cover);
}`
