import type { RainTiming } from './render-math';
export type WaveEvent = { x: number; z: number; time: number; strength: number };
export type RainDrop = RainTiming & { x: number; z: number };
import {isOpenWater} from './math';
export const WAVE_CAPACITY=48, WAVE_TTL=2.6;
export class WavePool {
 capacity: number;
 events: WaveEvent[] = [];
 private precipitation = new WeakSet<WaveEvent>();
 private lastRainTime = -Infinity;
 constructor(capacity = WAVE_CAPACITY) { this.capacity = capacity; }
 add(x: number, z: number, time: number, strength = 1) {
  if (!isOpenWater(x, z) || !Number.isFinite(time)) return false;
  this.active(time);
  if (this.events.length >= this.capacity) {
   const rain = this.events.findIndex(event => this.precipitation.has(event));
   this.events.splice(rain < 0 ? 0 : rain, 1);
  }
  this.events.push({ x, z, time, strength });
  return true;
 }
 addRain(x: number, z: number, time: number, strength = 1) {
  if (!isOpenWater(x, z) || !Number.isFinite(time) || time - this.lastRainTime < 1 / 12 - 1e-9) return false;
  this.active(time);
  const rain = this.events.filter(event => this.precipitation.has(event));
  // invariant: precipitation cannot evict interactions or occupy their reserved third of the pool.
  const rainCapacity = Math.floor(this.capacity * 2 / 3);
  if (rainCapacity === 0 || (this.events.length >= this.capacity && rain.length === 0)) return false;
  if (rain.length >= rainCapacity || this.events.length >= this.capacity) {
   this.events.splice(this.events.indexOf(rain[0]), 1);
  }
  const event = { x, z, time, strength };
  this.precipitation.add(event);
  this.events.push(event);
  this.lastRainTime = time;
  return true;
 }
 active(time: number) {
  this.events = this.events.filter(event => time - event.time < WAVE_TTL);
  return this.events.filter(event => time >= event.time);
 }
}
export function landingsBetween(before: number,now: number,r: RainTiming){const rate=.45*r.speed,first=Math.floor(before*rate+r.phase-.25)+1,last=Math.floor(now*rate+r.phase-.25),out=[];for(let i=first;i<=last;i++)out.push((i+.25-r.phase)/rate);return out;}
export function advanceRainWaves(pool: WavePool,before: number,now: number,rain: readonly RainDrop[],enabled: boolean,strength=1){
 if (enabled) {
  const impacts = rain.flatMap(r => landingsBetween(before, now, r).map(time => ({ ...r, time })));
  impacts.sort((a, b) => a.time - b.time);
  for (const impact of impacts) pool.addRain(impact.x, impact.z, impact.time, strength);
 }
 return pool.active(now);
}
const SWELL_COMPONENTS = [
 { amplitude: .018, x: 1.1, z: .45, speed: .7, phase: 0 },
 { amplitude: .008, x: 2.6, z: 1.25, speed: 1.15, phase: 0 },
 { amplitude: .004, x: -1.6, z: 2.1, speed: 1.1, phase: .8 },
] as const;
const glslFloat = (value: number) => Number.isInteger(value) ? `${value}.0` : String(value);
const SWELL_GLSL = SWELL_COMPONENTS.map((wave, index) => {
 const amplitude = glslFloat(wave.amplitude), x = glslFloat(wave.x), z = glslFloat(wave.z);
 const phase = `swell${index}`;
 return `float ${phase}=p.x*${x}+p.y*${z}+time*${glslFloat(wave.speed)}+${glslFloat(wave.phase)};h+=${amplitude}*sin(${phase});dx+=${amplitude}*${x}*cos(${phase});dz+=${amplitude}*${z}*cos(${phase});`;
}).join('');
export function waveField(x: number,z: number,time: number,events: readonly WaveEvent[]=[]){
 let h = 0, dx = 0, dz = 0;
 for (const wave of SWELL_COMPONENTS) {
  const phase = x * wave.x + z * wave.z + time * wave.speed + wave.phase;
  h += wave.amplitude * Math.sin(phase);
  const slope = wave.amplitude * Math.cos(phase);
  dx += slope * wave.x;
  dz += slope * wave.z;
 }
 for(const e of events){const age=time-e.time;if(age<0||age>WAVE_TTL)continue;const vx=x-e.x,vz=z-e.z,r=Math.hypot(vx,vz),q=r-age*.60;const amp=.022*e.strength*Math.exp(-age*1.6)*Math.min(age/.08,1),env=Math.exp(-q*q/.02),v=amp*env*Math.sin(q*28),d=amp*env*(28*Math.cos(q*28)-100*q*Math.sin(q*28));h+=v;dx+=d*vx/Math.max(r,.0001);dz+=d*vz/Math.max(r,.0001);}
 const inv=1/Math.sqrt(1+h*h/.0144);return{height:h*inv,dx:dx*inv**3,dz:dz*inv**3};
}
// invariant: CPU rain endpoint, vertex height and fragment normal share this analytic field.
export const WAVE_GLSL=`vec3 waveField(vec2 p){float h=0.,dx=0.,dz=0.;${SWELL_GLSL}for(int i=0;i<48;i++){float age=drops[i].z;if(drops[i].w<=0.||age<0.||age>2.6)continue;vec2 v=p-drops[i].xy;float r=length(v),q=r-age*.60;float amp=.022*drops[i].w*exp(-age*1.6)*min(age/.08,1.),env=exp(-q*q/.02);h+=amp*env*sin(q*28.);float d=amp*env*(28.*cos(q*28.)-100.*q*sin(q*28.));dx+=d*v.x/max(r,.0001);dz+=d*v.y/max(r,.0001);}float inv=inversesqrt(1.+h*h/.0144);return vec3(h*inv,dx*inv*inv*inv,dz*inv*inv*inv);}`;
