export type Vector3 = [number, number, number];
export const ELEVATION=30*Math.PI/180;
export const CAMERA_RADIUS=12;
export const normalize=(v: readonly number[]): Vector3=>{const n=Math.hypot(...v);return v.map(x=>x/n) as Vector3};
export const LIGHT=Object.freeze(normalize([.34,.25,-.94]));
export function project([x,y,z]: readonly number[],yaw: number,scale: number,cx: number,cy: number){const c=Math.cos(yaw),s=Math.sin(yaw),across=x*c-z*s,toward=x*s+z*c;return[cx+across*scale,cy+(toward*Math.sin(ELEVATION)-y*Math.cos(ELEVATION))*scale,toward*Math.cos(ELEVATION)+y*Math.sin(ELEVATION)]}
export function waterPoint(sx: number,sy: number,yaw: number,scale: number,cx: number,cy: number){const a=(sx-cx)/scale,t=(sy-cy)/scale/Math.sin(ELEVATION),c=Math.cos(yaw),s=Math.sin(yaw);return[a*c+t*s,0,-a*s+t*c]}
export function randomSource(seed=1948){return()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}}
/** The block of water: a pond wider than it is deep, its shore wandering a little. */
export const WATER_SCALE=1.3;
export function waterField(x: number,z: number){const u=x/1.2,v=z/.95,a=Math.atan2(v,u),r=Math.hypot(u,v);const edge=(2.9+.3*Math.sin(2*a+1.1)+.22*Math.cos(3*a-.4)+.12*Math.sin(5*a+.3)+.06*Math.sin(7*a+2))*WATER_SCALE;return edge-r}

export function isOpenWater(x: number,z: number){return waterField(x,z)>.10;}

export function viewDirection(yaw: number){return [Math.sin(yaw)*Math.cos(ELEVATION),Math.sin(ELEVATION),Math.cos(yaw)*Math.cos(ELEVATION)];}
export function waterNormal(x: number,z: number,time=0){return normalize([.13*Math.sin(x*1.8+z*.9+time*.22)+.055*Math.cos(x*7-z*3+time*.7),1,.11*Math.cos(z*1.7-x*.7+time*.18)+.045*Math.sin(z*8+x*4-time*.6)]);}
export function waterSpecular(x: number,z: number,yaw: number,time=0){const n=waterNormal(x,z,time),c=viewDirection(yaw).map(a=>a*CAMERA_RADIUS),v=normalize([c[0]-x,c[1]+.015,c[2]-z]),h=normalize(LIGHT.map((a,i)=>a+v[i]));const nh=Math.max(0,n.reduce((s,a,i)=>s+a*h[i],0)),nl=Math.max(0,n.reduce((s,a,i)=>s+a*LIGHT[i],0));const t=Math.min(1,Math.max(0,nl/.18)),visibility=t*t*(3-2*t);return {broad:Math.pow(nh,48)*visibility,fine:Math.pow(nh,180)*visibility,normal:n};}
