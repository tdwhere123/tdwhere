import { PAINT_LIGHT_GLSL } from './light'
import { noise } from './noise'

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
uniform float uPrepared;
uniform sampler2D uRelief;
uniform float uHasRelief;
uniform vec3 uLightTint;
uniform vec3 uSkyShade;
uniform vec2 uDay;
uniform vec3 uGlaze;
uniform vec3 uAccent;
uniform vec3 uGround;
uniform int uMode;
uniform vec4 uMarks[4];
uniform int uMarkCount;
// the tide: x is how far up the canvas it has run (canvas uv); z < 0 is off
uniform vec3 uPart;
// living water below the image's horizon (image uv, y up); uFlow 0 keeps the paint still
uniform float uFlow;
uniform float uHorizon;
// 0..1: how much of the painting has been laid on the paper, stroke by stroke
uniform float uReveal;
uniform vec3 uPaper;
// 0..1: how far under the surface the view has sunk
uniform float uDepth;
// scroll velocity, dragging the wet paint along with the page
uniform float uSmear;
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
  // The tide runs up the canvas and takes the paint with it: behind its front
  // the page shows through under a lace of foam; ahead of it the wet paint is
  // pushed up and catches the light along the edge of the water.
  vec2 pv = vUv;
  float pile = 0.0, lip = 0.0, drag = 0.5, cover = 1.0;
  if (uPart.z >= 0.0) {
    float t = uPart.x;
    float edge = t + (vnoise(vec2(vUv.x * 4.0, t * 2.5)) - 0.5) * 0.09
      + (vnoise(vec2(vUv.x * 17.0, t * 5.0 + 3.0)) - 0.5) * 0.03
      + sin(vUv.x * 7.0 + t * 6.0) * 0.012;
    float d = vUv.y - edge;
    if (d < 0.0) {
      float lace = vnoise(vUv * vec2(38.0, 64.0) + vec2(0.0, t * 6.0));
      float trail = exp(d / 0.06);
      float foam = smoothstep(0.5, 0.78, lace) * trail * 0.9 + smoothstep(-0.014, 0.0, d) * 0.92;
      foam = clamp(foam, 0.0, 1.0);
      outColor = vec4(vec3(0.97, 0.95, 0.9) * foam, foam);
      return;
    }
    pile = exp(-d / 0.035);
    lip = exp(-d / 0.006);
    drag = vnoise(vec2(vUv.x * 60.0, vUv.y * 4.0));
    pv.y -= pile * 0.028 * (0.5 + drag);
  }
  if (abs(uSmear) > 0.0005) {
    // the paint drags in bristle streaks, more in some than others
    float streak = 0.55 + 0.45 * vnoise(vec2(vUv.x * 90.0, 1.0)) * vnoise(vec2(vUv.x * 13.0, 4.0));
    pv.y -= uSmear * streak * 0.05;
  }
  vec2 uv = (pv - f.xy) * uScale + uOffset;
  // below the horizon the water moves: small chop running toward the viewer, compressed with distance
  float sea = 0.0, near = 0.0;
  if (uFlow > 0.5) {
    sea = smoothstep(uHorizon + 0.005, uHorizon - 0.03, uv.y);
    near = clamp((uHorizon - uv.y) / max(uHorizon, 0.1), 0.0, 1.0);
    vec2 q = vec2(uv.x * 3.2, uv.y * 10.0 / (0.22 + near));
    float w1 = vnoise(q + vec2(uTime * 0.12, uTime * 0.42)) - 0.5;
    float w2 = vnoise(q * 2.3 + vec2(-uTime * 0.2, uTime * 0.7)) - 0.5;
    float swell = sin(uv.y * 34.0 / (0.3 + near) - uTime * 1.1 + vnoise(vec2(uv.x * 2.0, 0.0)) * 3.0);
    float under = 1.0 + uDepth * 3.0;
    uv += vec2(w1 * 0.0035, (w1 + w2 * 0.6) * 0.005 + swell * 0.0016) * sea * (0.35 + near) * under;
  }
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  vec3 col;
  float bristle, spec;
  if (uPrepared > 0.5) {
    // An authored painting: its strokes are shown as painted, and the paint they left is lit.
    col = img(uv, 0.0);
    float push = length(f.xy);
    // Where the pointer stirs the wet field, the paint is dragged along with it, as on the
    // photographic path: strokes smeared the way they were pushed, lit by the warped surface.
    float stirred = clamp(push * 40.0 + f.z * 1.5, 0.0, 1.0);
    if (push > 1e-4) {
      vec2 pd = toImage(normalize(f.xy * vec2(uAspect, 1.0)) * uLen * 1.4);
      vec3 smear = vec3(0.0);
      for (int i = -2; i <= 2; i++) smear += img(uv + pd * (float(i) / 2.0), 0.0) * (1.0 - abs(float(i)) * 0.25);
      col = mix(col, smear / 4.0, clamp(push * 18.0, 0.0, 0.85));
    }
    vec2 tx = 1.0 / vec2(textureSize(uRelief, 0));
    float hc = texture(uRelief, uv).r;
    vec2 dH = vec2(
      texture(uRelief, uv + vec2(tx.x, 0.0)).r - texture(uRelief, uv - vec2(tx.x, 0.0)).r,
      texture(uRelief, uv + vec2(0.0, tx.y)).r - texture(uRelief, uv - vec2(0.0, tx.y)).r
    ) * uHasRelief * uImpasto * 2.2;
    // the stirred surface: the displaced picture's own relief, and the field's wave fronts
    float warped = lum(img(uv, 1.0)) * 0.75 * stirred + push * 6.0 + pile * hc * 0.4;
    dH += vec2(dFdx(warped), dFdy(warped)) * uImpasto * 4.0 * (uRes.y / 800.0);
    vec3 N = normalize(vec3(-dH, 1.0));
    vec3 L = normalize(vec3(uLight, 0.9));
    float wet = clamp(push * 14.0 + f.z * 0.35 + pile * 0.8, 0.0, 1.0);
    bristle = hc;
    // thick paint shines; the thin wash between strokes does not
    spec = pow(max(dot(reflect(-L, N), vec3(0.0, 0.0, 1.0)), 0.0), 24.0) * (0.3 + smoothstep(0.35, 0.9, hc) * 0.7);
    col *= 0.84 + dot(N, L) * 0.22;
    col += spec * (0.05 + wet * 0.2);
    if (uFlow > 0.5) {
      // the light on the water winks: a few of the brightest strokes flare and go
      float l = lum(col);
      float wink = pow(vnoise(gl_FragCoord.xy * 0.07 + vec2(uTime * 1.6, -uTime * 0.9)), 7.0)
        * smoothstep(0.62, 0.9, l) * sea;
      col += vec3(1.0, 0.97, 0.88) * wink * 1.6;
    }
    // Film, under the paint: the lens wide open at the edges, red-orange halation around the
    // brightest light, and a toe and shoulder. Mip levels stand in for blur, one tap each.
    vec2 rim = abs(vUv - vec2(0.56, 0.5)) * vec2(1.6, 2.0);
    float soft = smoothstep(0.55, 1.25, length(rim));
    col = mix(col, img(uv, 2.6), soft * 0.6);
    vec3 bloom = img(uv, 5.0);
    // halation rings the light: strongest just outside a bright stroke, not on top of it
    float glow = smoothstep(0.55, 0.95, lum(bloom)) * (1.0 - smoothstep(0.6, 0.95, lum(col)) * 0.6);
    col += (vec3(1.0, 0.42, 0.2) * 0.08 + bloom * 0.03) * glow;
    col = clamp(col, 0.0, 1.0);
    col = mix(col, col * col * (3.0 - 2.0 * col), 0.32);
  } else {
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
    col = vec3(0.0);
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

    bristle = vnoise(vec2(sp.x * 0.6, sp.y * 7.0) + h1 * 10.0);
    float height = relief * 0.75 + bristle * 0.2 + dabEdge * 0.03 + pile * bristle * 0.4;
    vec2 dH = vec2(dFdx(height), dFdy(height));
    vec3 N = normalize(vec3(-dH * uImpasto * 4.0 * (uRes.y / 800.0), 1.0));
    vec3 L = normalize(vec3(uLight, 0.9));
    float wet = clamp(push * 14.0 + f.z * 0.35 + fresh * 0.3 + pile * 0.8, 0.0, 1.0);
    spec = pow(max(dot(reflect(-L, N), vec3(0.0, 0.0, 1.0)), 0.0), 20.0);
    col *= 0.86 + dot(N, L) * 0.2;
    col += spec * (0.04 + wet * 0.2);
  }
  if (uSky > 0.5) col = lightPigment(col, uLightTint, uSkyShade, uDay.x, uDay.y);

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

  // the pushed paint darkens as it wets, and a lip of water catches the light
  col *= 1.0 - pile * (0.5 - drag) * 0.2;
  col += lip * (0.18 + spec * 0.5);
  col *= uGlaze;
  if (uDepth > 0.001) {
    // sinking: the surface softens, the light goes ultramarine, and shafts of it reach down
    vec3 soft = img(uv, 2.5 + uDepth * 2.5);
    col = mix(col, soft, uDepth * 0.55);
    col = mix(col, vec3(0.035, 0.07, 0.19) + col * vec3(0.22, 0.32, 0.55), smoothstep(0.0, 1.0, uDepth) * 0.85);
    float shaft = pow(vnoise(vec2(vUv.x * 7.0 + vUv.y * 2.2, uTime * 0.08)), 3.0)
      * smoothstep(0.1, 1.0, vUv.y) * (1.0 - uDepth * 0.4);
    col += vec3(0.32, 0.5, 0.72) * shaft * uDepth * 0.28;
  }
  if (uReveal < 0.999) {
    // the painting arrives on the paper stroke by stroke: the sky and the headland first,
    // then the sea from far to near, the light on it last
    vec2 rd = vec2(1.0, 0.04);
    vec2 rp = vec2(dot(p, rd), dot(p, vec2(-rd.y, rd.x))) * vec2(9.0, 30.0);
    rp.x += hash(vec2(floor(rp.y), 2.3)) * 5.0;
    float due = (1.0 - vUv.y) * 0.5 + hash(floor(rp)) * 0.3 + vnoise(p * 2.0) * 0.2
      + smoothstep(0.7, 0.92, lum(col)) * 0.12;
    due = clamp(due * 0.8 + 0.04, 0.03, 0.97);
    float laid = smoothstep(due - 0.035, due + 0.035, uReveal * 1.08 - 0.04);
    float fresh = laid * (1.0 - laid) * 4.0;
    col += fresh * 0.08;
    col = mix(uPaper, col, laid);
  }
  vec2 weave = gl_FragCoord.xy * 0.9;
  col += sin(weave.x) * sin(weave.y) * 0.012 + (hash(gl_FragCoord.xy) - 0.5) * 0.02;
  if (uPrepared > 0.5) {
    // grain clumps, and shows most in the middle tones, as on negative film
    float l = lum(col);
    float grain = (hash(floor(gl_FragCoord.xy / 1.6)) - 0.5) + (vnoise(gl_FragCoord.xy * 0.45) - 0.5) * 0.7;
    col += grain * 0.07 * (0.25 + l * (1.0 - l) * 3.0);
  }
  outColor = vec4(clamp(col, 0.0, 1.0) * cover, cover);
}`
