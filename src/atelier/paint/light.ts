import { lightAt, sunFrom } from '../daylight'
import type { Rgb, Vec2 } from './presets'

/** The hour's light, expressed as light on pigment. */
export type PaintLight = { direction: Vec2; tint: Rgb; shade: Rgb; exposure: number; sun: number }

export function paintingLight(hour: number): PaintLight {
  const light = lightAt(hour),
    [x, y] = sunFrom(hour)
  return {
    direction: [x * 1.8, 0.45 + y * 0.6],
    tint: [...light.light],
    shade: [...light.water],
    exposure: 0.74 + light.sun * 0.32,
    sun: light.sun,
  }
}

/** sRGB in/out: shared by the raw WebGL painting and Three's final handoff. */
export const PAINT_LIGHT_GLSL = `
vec3 lightPigment(vec3 color, vec3 tint, vec3 shade, float exposure, float sun) {
  vec3 luma = vec3(.299, .587, .114);
  float l = dot(color, luma);
  float shadow = 1. - smoothstep(.15, .55, l), high = smoothstep(.5, .9, l);
  // Temperature, not exposure: the sky's hue goes into the shadows and the sun's into the lights,
  // so the painting keeps the values the painter gave it.
  color *= mix(vec3(1.), shade / max(dot(shade, luma), .05), shadow * .22);
  color *= mix(vec3(1.), tint / max(dot(tint, luma), .05), high * .4);
  // dusk lowers the middle tones first; the brightest strokes hold their light
  color *= mix(exposure, 1., high * .55);
  color += tint * pow(max(l, 0.), 3.) * sun * .04;
  return color;
}
`
