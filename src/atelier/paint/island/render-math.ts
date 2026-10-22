import type { Camera, Vector3 } from 'three';

// invariant: orthographic rays are parallel, including when the entry target translates.
export function waterViewDirection(camera: Camera, out: Vector3): Vector3 {
  return camera.getWorldDirection(out).negate();
}

export type RainTiming = { speed: number; phase: number };
export const PAPER_SRGB=[250/255,249/255,244/255];
export const toLinear=(x: number)=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
export const toSRGB=(x: number)=>x<=.0031308?x*12.92:1.055*Math.max(0,x)**(1/2.4)-.055;
export function compositePaper(rgb: readonly number[],alpha: number){return rgb.map((v,i)=>toSRGB(v*alpha+toLinear(PAPER_SRGB[i])*(1-alpha)));}
export function rainSample(time: number,r: RainTiming){const phase=(time*.45*r.speed+r.phase)%1;return{phase,falling:phase<.25,y:Math.max(0,1-phase/.25)*1.35,impactAge:(phase-.25)/(.45*r.speed)};}
