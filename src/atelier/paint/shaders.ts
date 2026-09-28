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
uniform vec3 uGlaze;
uniform vec3 uAccent;
uniform vec3 uGround;
uniform int uMode;
uniform vec4 uMarks[4];
uniform int uMarkCount;
in vec2 vUv;
out vec4 outColor;

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
vec3 img(vec2 uv, float lod) {
  return textureLod(uImage, clamp(uv, vec2(0.001), vec2(0.999)), lod).rgb;
}
// canvas-space (aspect-corrected) offset to image uv
vec2 toImage(vec2 d) { return vec2(d.x / uAspect, d.y) * uScale; }

void main() {
  vec4 f = texture(uField, vUv);
  vec2 uv = (vUv - f.xy) * uScale + uOffset;
  vec2 p = vec2(vUv.x * uAspect, vUv.y);

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
  float height = lum(sharp) * 0.75 + bristle * 0.2 + dabEdge * 0.03;
  vec2 dH = vec2(dFdx(height), dFdy(height));
  vec3 N = normalize(vec3(-dH * uImpasto * 4.0 * (uRes.y / 800.0), 1.0));
  vec3 L = normalize(vec3(uLight, 0.9));
  float wet = clamp(push * 14.0 + f.z * 0.35, 0.0, 1.0);
  float spec = pow(max(dot(reflect(-L, N), vec3(0.0, 0.0, 1.0)), 0.0), 20.0);
  col *= 0.86 + dot(N, L) * 0.2;
  col += spec * (0.04 + wet * 0.2);

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

  col *= uGlaze;
  vec2 weave = gl_FragCoord.xy * 0.9;
  col += sin(weave.x) * sin(weave.y) * 0.012 + (hash(gl_FragCoord.xy) - 0.5) * 0.02;
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`
