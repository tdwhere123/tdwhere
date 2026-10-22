import type { RainTiming } from './render-math';
export type WaveEvent = { x: number; z: number; time: number; strength: number };
export type RainDrop = RainTiming & { x: number; z: number };
import {isOpenWater} from './math';
export const WAVE_CAPACITY=48, WAVE_TTL=2.6;
export class WavePool{
 capacity: number; events: WaveEvent[];
 constructor(capacity=WAVE_CAPACITY){this.capacity=capacity;this.events=[];}
 add(x: number,z: number,time: number,strength=1){if(!isOpenWater(x,z)||!Number.isFinite(time))return false;this.events.push({x,z,time,strength});if(this.events.length>this.capacity)this.events.shift();return true;}
 active(time: number){this.events=this.events.filter(e=>time-e.time<WAVE_TTL);return this.events.filter(e=>time>=e.time);}
}
export function landingsBetween(before: number,now: number,r: RainTiming){const rate=.45*r.speed,first=Math.floor(before*rate+r.phase-.25)+1,last=Math.floor(now*rate+r.phase-.25),out=[];for(let i=first;i<=last;i++)out.push((i+.25-r.phase)/rate);return out;}
export function advanceRainWaves(pool: WavePool,before: number,now: number,rain: readonly RainDrop[],enabled: boolean,strength=1){
 if(enabled)for(const r of rain)for(const time of landingsBetween(before,now,r))pool.add(r.x,r.z,time,strength);
 return pool.active(now);
}
export function waveField(x: number,z: number,time: number,events: readonly WaveEvent[]=[]){
 const a=x*1.8+z*.9+time*.55,b=z*1.7-x*.7+time*.43;
 let h=.018*Math.sin(a)+.012*Math.cos(b),dx=.0324*Math.cos(a)+.0084*Math.sin(b),dz=.0162*Math.cos(a)-.0204*Math.sin(b);
 for(const e of events){const age=time-e.time;if(age<0||age>WAVE_TTL)continue;const vx=x-e.x,vz=z-e.z,r=Math.hypot(vx,vz),q=r-age*.60;const amp=.022*e.strength*Math.exp(-age*1.6)*Math.min(age/.08,1),env=Math.exp(-q*q/.02),v=amp*env*Math.sin(q*28),d=amp*env*(28*Math.cos(q*28)-100*q*Math.sin(q*28));h+=v;dx+=d*vx/Math.max(r,.0001);dz+=d*vz/Math.max(r,.0001);}
 const inv=1/Math.sqrt(1+h*h/.0144);return{height:h*inv,dx:dx*inv**3,dz:dz*inv**3};
}
// invariant: CPU rain endpoint, vertex height and fragment normal share this analytic field.
export const WAVE_GLSL=`vec3 waveField(vec2 p){float a=p.x*1.8+p.y*.9+time*.55,b=p.y*1.7-p.x*.7+time*.43;float h=.018*sin(a)+.012*cos(b),dx=.0324*cos(a)+.0084*sin(b),dz=.0162*cos(a)-.0204*sin(b);for(int i=0;i<48;i++){float age=drops[i].z;if(drops[i].w<=0.||age<0.||age>2.6)continue;vec2 v=p-drops[i].xy;float r=length(v),q=r-age*.60;float amp=.022*drops[i].w*exp(-age*1.6)*min(age/.08,1.),env=exp(-q*q/.02);h+=amp*env*sin(q*28.);float d=amp*env*(28.*cos(q*28.)-100.*q*sin(q*28.));dx+=d*v.x/max(r,.0001);dz+=d*v.y/max(r,.0001);}float inv=inversesqrt(1.+h*h/.0144);return vec3(h*inv,dx*inv*inv*inv,dz*inv*inv*inv);}`;
