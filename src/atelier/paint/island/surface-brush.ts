// @anchor:water-pigment Coordinates belong to the water surface, not the viewing window.
export const WATER_BRUSH_WORLD_SCALE = 1 / 7.8

// invariant: hash/noise are supplied by the water shader; no camera or clock enters the pigment field.
export const WATER_BRUSH_GLSL = `
float surfaceDab(vec2 q,vec2 dir,vec2 scale,float seed,out vec3 lean){
  vec2 perp=vec2(-dir.y,dir.x);
  vec2 sp=vec2(dot(q,dir),dot(q,perp))*scale+seed;
  sp.x+=hash(vec2(floor(sp.y),3.1+seed))*7.;
  vec2 cell=floor(sp),l=fract(sp);
  float h1=hash(cell+seed),h2=hash(cell+17.3),h3=hash(cell+5.1);
  float len=.62+h1*.34;
  float shape=1.-smoothstep(.5,1.,length(vec2((l.x-.5)/(len*.5),(l.y-.5)/.42)));
  lean=(h2-.5)*vec3(-.35,.5,.2)+(h3-.5)*.6;
  return shape;
}
vec3 waterBrush(vec2 surface){
  vec2 q=surface*${WATER_BRUSH_WORLD_SCALE.toFixed(12)};
  float a=.04+(noise(q*2.6)-.5)*.8;
  vec3 leanA,leanB;
  float dabA=surfaceDab(q,vec2(cos(a),sin(a)),vec2(28.,96.),0.,leanA);
  float b=a+.3;
  float dabB=surfaceDab(q+.013,vec2(cos(b),sin(b)),vec2(24.,84.),11.3,leanB)*(1.-dabA);
  return (leanA*dabA+leanB*dabB)*.075;
}
`
