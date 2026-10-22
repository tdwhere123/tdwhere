import type { islandSky } from './island/state'
import type { Rgb, Vec2 } from './presets'

/** The same sky, expressed as light on pigment rather than a second weather clock. */
export type PaintLight = { direction: Vec2; tint: Rgb; shade: Rgb; exposure: number; sun: number }

export function paintingLight(sky: ReturnType<typeof islandSky>): PaintLight {
  return {
    direction: [sky.sun[0] * 1.8, 0.45 + sky.sun[1] * 0.6],
    tint: [...sky.light.light],
    shade: [...sky.light.water],
    exposure: 0.74 + sky.light.sun * 0.32,
    sun: sky.light.sun,
  }
}

/** sRGB in/out: shared by the raw WebGL painting and Three's final handoff. */
export const PAINT_LIGHT_GLSL = `
vec3 lightPigment(vec3 color, vec3 tint, vec3 shade, float exposure, float sun) {
  float l = dot(color, vec3(.299, .587, .114));
  float shadow = 1. - smoothstep(.12, .65, l);
  // The sky lives in the shadows; sunlight stays in the warm, broken highlights.
  color = mix(color, color * .84 + shade * .16, shadow * .48);
  color *= mix(vec3(1.), tint, .22 + smoothstep(.4, .9, l) * .28) * exposure;
  color += tint * pow(max(l, 0.), 3.) * sun * .035;
  return color;
}
`
