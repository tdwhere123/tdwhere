export type Vector3 = [number, number, number];
export const ELEVATION=22*Math.PI/180;
export const CAMERA_RADIUS=12;
export const normalize=(v: readonly number[]): Vector3=>{const n=Math.hypot(...v);return v.map(x=>x/n) as Vector3};
export const LIGHT=Object.freeze(normalize([.34,.25,-.94]));
export function project([x,y,z]: readonly number[],yaw: number,scale: number,cx: number,cy: number){const c=Math.cos(yaw),s=Math.sin(yaw),across=x*c-z*s,toward=x*s+z*c;return[cx+across*scale,cy+(toward*Math.sin(ELEVATION)-y*Math.cos(ELEVATION))*scale,toward*Math.cos(ELEVATION)+y*Math.sin(ELEVATION)]}
export function waterPoint(sx: number,sy: number,yaw: number,scale: number,cx: number,cy: number){const a=(sx-cx)/scale,t=(sy-cy)/scale/Math.sin(ELEVATION),c=Math.cos(yaw),s=Math.sin(yaw);return[a*c+t*s,0,-a*s+t*c]}
export function randomSource(seed=1948){return()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}}
const gauss=(x: number,z: number,cx: number,cz: number,rx: number,rz: number)=>Math.exp(-(((x-cx)/rx)**2+((z-cz)/rz)**2));
export function landField(x: number,z: number){return 1-(x/1.35)**2-((z+.10*Math.sin(x*3))/.62)**2-.32*gauss(x,z,.28,.38,.32,.24)+.10*Math.sin(x*5-z*4)+.055*Math.sin(z*12+x*6)}
export function ground(x: number,z: number){const f=landField(x,z);return f<=0?0:.004+.035*Math.pow(f,1.1)+.025*gauss(x,z,-.50,-.10,.5,.35)}
export function shrub(x: number,z: number){const f=landField(x,z);if(f<=0)return 0;const a=gauss(x,z,-.55,-.13,.54,.34),b=gauss(x,z,-.04,-.21,.40,.25);const g=.29*Math.pow(a,1.3)+.21*Math.pow(b,1.5);return Math.max(0,g-.045)*(1+.025*Math.sin(x*12+z*9));}
export function shadow(x: number,y: number,z: number){for(let t=.07;t<2.3;t+=.09){if(height(x+LIGHT[0]*t,z+LIGHT[2]*t)>y+LIGHT[1]*t+.025)return 1;}return 0;}
export function height(x: number,z: number){return ground(x,z)+shrub(x,z)}
export function normal(x: number,z: number){const e=.008;return normalize([height(x-e,z)-height(x+e,z),e*2,height(x,z-e)-height(x,z+e)])}
export function diffuse(n: readonly number[]){return Math.max(0,n.reduce((s,v,i)=>s+v*LIGHT[i],0))}
export function waterField(x: number,z: number){const a=Math.atan2(z,x),r=Math.hypot(x,z);const edge=2.75+.34*Math.sin(3*a+.5)+.25*Math.cos(5*a-1)+.15*Math.sin(7*a);return edge-r}

export function isOpenWater(x: number,z: number){return waterField(x,z)>.10&&landField(x,z)<-.05;}

export function viewDirection(yaw: number){return [Math.sin(yaw)*Math.cos(ELEVATION),Math.sin(ELEVATION),Math.cos(yaw)*Math.cos(ELEVATION)];}
export function waterNormal(x: number,z: number,time=0){return normalize([.13*Math.sin(x*1.8+z*.9+time*.22)+.055*Math.cos(x*7-z*3+time*.7),1,.11*Math.cos(z*1.7-x*.7+time*.18)+.045*Math.sin(z*8+x*4-time*.6)]);}
export function waterSpecular(x: number,z: number,yaw: number,time=0){const n=waterNormal(x,z,time),c=viewDirection(yaw).map(a=>a*CAMERA_RADIUS),v=normalize([c[0]-x,c[1]+.015,c[2]-z]),h=normalize(LIGHT.map((a,i)=>a+v[i]));const nh=Math.max(0,n.reduce((s,a,i)=>s+a*h[i],0)),nl=Math.max(0,n.reduce((s,a,i)=>s+a*LIGHT[i],0));const t=Math.min(1,Math.max(0,nl/.18)),visibility=t*t*(3-2*t);return {broad:Math.pow(nh,48)*visibility,fine:Math.pow(nh,180)*visibility,normal:n};}
