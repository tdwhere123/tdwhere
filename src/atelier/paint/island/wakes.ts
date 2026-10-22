import type { Bird } from './birds'

export const COOT_WAKE_SAMPLES = 6
export const COOT_WAKE_LIFE = 3.2
const SPACING = .045

type Position = Pick<Bird, 'x' | 'z' | 'mode'>
type Track = { x: number; z: number; time: number; distance: number; next: number; wet: boolean }
const afloat = (mode: Bird['mode']) => mode === 'swim' || mode === 'greet' || mode === 'flee' || mode === 'board'

/** Fixed-capacity world-space history; packed vec4 = x, z, birth time, strength. */
export class CootWakeTrail {
  readonly uniforms: Float32Array
  private readonly tracks: (Track | undefined)[]

  constructor(count: number) {
    this.uniforms = new Float32Array(count * COOT_WAKE_SAMPLES * 4)
    this.tracks = Array.from({ length: count })
  }

  update(birds: readonly Position[], time: number) {
    if (!Number.isFinite(time)) return
    for (let k = 0; k < this.uniforms.length; k += 4) {
      const age = time - this.uniforms[k + 2]
      if (age >= COOT_WAKE_LIFE || age < 0) this.uniforms[k + 3] = 0
    }
    for (let i = 0; i < this.tracks.length; i++) {
      const b = birds[i]
      if (!b || !Number.isFinite(b.x) || !Number.isFinite(b.z)) { this.tracks[i] = undefined; continue }
      const old = this.tracks[i], wet = afloat(b.mode)
      const track: Track = { x: b.x, z: b.z, time, distance: 0, next: old?.next ?? 0, wet }
      this.tracks[i] = track
      if (!old || !old.wet || !wet) continue
      const dt = time - old.time, dx = b.x - old.x, dz = b.z - old.z, distance = Math.hypot(dx, dz)
      // invariant: resuming, surfacing and teleports cannot draw a connecting scar.
      if (dt <= 0 || dt > .5 || distance > dt * .8 + .02) continue
      if (distance < 1e-8) { track.distance = old.distance; continue }
      const strength = Math.min(1, distance / dt / .12)
      let along = SPACING - old.distance
      for (; along <= distance + 1e-9; along += SPACING) {
        const fraction = Math.min(1, along / distance)
        const slot = (i * COOT_WAKE_SAMPLES + track.next) * 4
        this.uniforms.set([old.x + dx * fraction, old.z + dz * fraction, old.time + dt * fraction, strength], slot)
        track.next = (track.next + 1) % COOT_WAKE_SAMPLES
      }
      track.distance = Math.max(0, distance - (along - SPACING))
    }
  }
}

/** Requires the water shader's noise(vec2), time and wakes uniforms. */
export function cootWakeGLSL(count: number) {
  return `float cootWake(vec2 p){
float broken=noise(p*35.+vec2(time*.12,-time*.09));
vec2 drift=vec2(noise(p*13.+time*.08),noise(p*11.-time*.06))-.5;
float disturbance=0.;
for(int i=0;i<${count * COOT_WAKE_SAMPLES};i++){
vec4 w=wakes[i];float age=time-w.z;
if(w.w<=0.||age<0.||age>=${COOT_WAKE_LIFE.toFixed(1)})continue;
float radius=.055+age*.035;vec2 d=p-w.xy;
if(abs(d.x)>radius*1.5||abs(d.y)>radius*1.5)continue;
d+=drift*(.012+age*.009);
float r2=dot(d,d)/(radius*radius);
float pool=1.-smoothstep(.12,1.,r2);
float edge=smoothstep(.2,.48,r2)*(1.-smoothstep(.48,1.,r2));
float dry=1.-age/${COOT_WAKE_LIFE.toFixed(1)};
disturbance+=(pool*.65+edge*.35)*smoothstep(0.,.12,age)*dry*dry*w.w;
}
return min(disturbance,.85)*(.35+.65*smoothstep(.25,.78,broken))*.19;
}`
}
