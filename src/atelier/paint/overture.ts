import * as THREE from 'three';
import { coverFit, type Vec2 } from './presets';
import type { Clock } from '../weather';
import { rainSample, waterViewDirection } from './island/render-math';
import { WATER_BRUSH_GLSL } from './island/surface-brush';
import { CootWakeTrail, COOT_WAKE_SAMPLES, cootWakeGLSL } from './island/wakes';
import { rainFlight, rainImpacts, rainHalfWidth, SplashPool, SPLASH_CAPACITY, SPLASH_TTL } from './island/rain';
import { WavePool, waveField, WAVE_GLSL, landingsBetween } from './island/waves';
import { isOpenWater, randomSource, waterField, ELEVATION, WATER_SCALE } from './island/math';
import { AERATOR, LAMP, PERCHES, aeratorAxis, aeratorWake, buildAerator, wheelSpots } from './island/aerator';
import { greetBird, makeFlock, stepFlock } from './island/birds';
import { pickBird, PondGesture } from './island/interaction';
import { buildCoot } from './island/coot';
import { disposeModelResources, lightIslandModel, type IslandModels } from './island/models';
import { islandSky, viewSpan, transitionState } from './island/state';
import { paintingLight, PAINT_LIGHT_GLSL } from './light';
import type { PaintImage } from './images';
type RainDrop = {
    id: number;
    x: number;
    z: number;
    phase: number;
    speed: number;
    length: number;
    alpha: number;
    /** 0 rain, 1 snow. */
    kind: number;
    /** The drop falls once the spell's rain or snow is heavier than this. */
    threshold: number;
};
export type PondFeedback = 'greet' | 'leave' | 'water' | 'running' | 'stopped';
export type OvertureHandle = {
    enter(): void;
    interact(action: 'bird' | 'water' | 'machine'): void;
    destroy(): void;
};
export function mountOverture(o: {
    canvas: HTMLCanvasElement;
    clock: Clock;
    painting: () => PaintImage;
    focus: Vec2;
    onReady?: () => void;
    onDone: () => void;
    onFeedback: (feedback: PondFeedback) => void;
    models: IslandModels;
}): OvertureHandle {
    const { canvas, clock } = o;
    let sky = islandSky(clock, Date.now());
    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, .1, 40);
    let yaw = -.35, targetYaw = yaw;
    const sunDirection = new THREE.Vector3(...sky.sun);
    const rgb = () => new THREE.Vector3();
    const palette = { lit: rgb(), shallow: rgb(), deep: rgb(), foam: rgb(), ink: rgb() };
    const random = randomSource();
    const noiseGLSL = `vec3 linearize(vec3 c){return mix(c/12.92,pow((max(c,vec3(0.))+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}`;
    // Backlit, as in the photograph: the sides toward the visitor take the sky's light from above and
    // the water's from below; after dusk the mast's lamp warms whatever is near it.
    const night = { value: 0 }, daylight = { value: sky.light.sun }, lampAt = { value: new THREE.Vector3() };
    const snowCover = { value: sky.profile.snow > 0 ? .6 : 0 };
    const shared = { sun: { value: sunDirection }, shade: { value: palette.deep }, lit: { value: palette.lit }, day: daylight, night, lampAt, snowCover };
    lightIslandModel(o.models.coot, shared, true);
    lightIslandModel(o.models.aerator, shared, false);
    const aerator = buildAerator(o.models.aerator);
    scene.add(aerator.group);
    let on = true, running = 1;
    const flock = makeFlock(randomSource(clock.start % 2147483647 || 1), [AERATOR.x + 1.1, AERATOR.z + .7]), coots = flock.map(() => buildCoot(o.models.coot));
    for (const coot of coots) {
        coot.group.rotation.order = 'YXZ';
        scene.add(coot.group);
    }
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    const originalTouchAction = canvas.style.touchAction;
    canvas.style.touchAction = 'none';
    const homeTexture = new THREE.Texture();
    homeTexture.colorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor('#faf9f4');
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const perchAt = PERCHES.map(() => new THREE.Vector3()), wakeTrail = new CootWakeTrail(flock.length);
    // after dusk: a scatter of lights along the far shore, as across the river behind the film shelf
    const shore: { x: number; z: number; y: number; warm: number; phase: number }[] = [];
    for (const group of [-2.3, -1.75, -.9, -.3, .25]) {
        const lights = 2 + Math.floor(random() * 3);
        for (let k = 0; k < lights; k++) {
            const a = group + (random() - .5) * .16;
            let r = 1;
            while (waterField(Math.cos(a) * r, Math.sin(a) * r) > 0 && r < 9) r += .05;
            shore.push({ x: Math.cos(a) * (r + .25 + random() * .3), z: Math.sin(a) * (r + .25 + random() * .3), y: .03 + random() * .08, warm: random() < .75 ? 1 : 0, phase: random() * 10 });
        }
    }
    const lightCount = shore.length + 1, lightPositions = new Float32Array(lightCount * 3), lightColors = new Float32Array(lightCount * 3), lightSizes = new Float32Array(lightCount).fill(1);
    lightSizes[shore.length] = 2.2;
    shore.forEach((l, k) => { lightPositions.set([l.x, l.y, l.z], k * 3); lightColors.set(l.warm ? [1, .72, .4] : [.92, .94, 1], k * 3); });
    lightColors.set([1, .78, .45], shore.length * 3);
    const lightGeometry = new THREE.BufferGeometry();
    lightGeometry.setAttribute('position', new THREE.BufferAttribute(lightPositions, 3));
    lightGeometry.setAttribute('tone', new THREE.BufferAttribute(lightColors, 3));
    lightGeometry.setAttribute('big', new THREE.BufferAttribute(lightSizes, 1));
    const lightMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { night, size: { value: 10 }, time: { value: 0 } }, vertexShader: `uniform float size;uniform float time;attribute vec3 tone;attribute float big;varying vec3 vTone;varying float vFlicker;void main(){vTone=tone;vFlicker=.85+.15*sin(time*2.3+position.x*17.+position.z*9.);gl_PointSize=size*big;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`, fragmentShader: `precision highp float;uniform float night;varying vec3 vTone;varying float vFlicker;void main(){float r=length(gl_PointCoord-.5)*2.;float core=smoothstep(.2,.04,r),halo=exp(-r*r*6.)*.6;float a=min(1.,(core+halo)*night*vFlicker);if(a<.004)discard;gl_FragColor=vec4(vTone*(1.+core*3.),a);}` });
    const lights = new THREE.Points(lightGeometry, lightMaterial);
    lights.frustumCulled = false;
    scene.add(lights);
    const wavePool = new WavePool();
    const drops = Array.from({ length: 48 }, () => new THREE.Vector4(0, 0, 10, 0));
    const waterMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { time: { value: 0 }, glint: { value: sky.profile.glint }, glintTint: { value: new THREE.Vector3(...sky.profile.glintTint) }, sun: { value: sunDirection }, viewDirection: { value: new THREE.Vector3() }, drops: { value: drops }, shallow: { value: palette.shallow }, deep: { value: palette.deep }, foamC: { value: palette.foam }, wind: { value: 0 }, wheels: { value: wheelSpots.map(([x, z]) => new THREE.Vector3(x, z, 1)) }, aer: { value: new THREE.Vector2(AERATOR.x, AERATOR.z) }, aerAxis: { value: new THREE.Vector2(...aeratorAxis) }, wake: { value: new THREE.Vector2(...aeratorWake) }, glitter: { value: new THREE.Vector2() }, glitterGain: { value: 1 }, wakes: { value: wakeTrail.uniforms }, birds: { value: flock.map(() => new THREE.Vector3()) }, night, lampAt, shore: { value: shore.map(l => new THREE.Vector4(l.x, l.z, l.warm, l.phase)) } }, vertexShader: `uniform float time;uniform vec4 drops[48];varying vec3 vWorld;varying vec3 vNormal;${WAVE_GLSL}void main(){vec4 w=modelMatrix*vec4(position,1.);vec3 wave=waveField(w.xz);w.y+=wave.x;vWorld=w.xyz;vNormal=normalize(vec3(-wave.y,1.,-wave.z));gl_Position=projectionMatrix*viewMatrix*w;}`, fragmentShader: `precision highp float;uniform float time;uniform float glint;uniform vec3 glintTint;uniform vec3 sun;uniform vec3 viewDirection;uniform vec4 drops[48];uniform vec3 shallow;uniform vec3 deep;uniform vec3 foamC;uniform float wind;uniform vec3 wheels[4];uniform vec2 aer;uniform vec2 aerAxis;uniform vec2 wake;uniform vec2 glitter;uniform float glitterGain;uniform vec4 wakes[${flock.length * COOT_WAKE_SAMPLES}];uniform vec3 birds[${flock.length}];uniform float night;uniform vec3 lampAt;uniform vec4 shore[${shore.length}];varying vec3 vWorld;varying vec3 vNormal;${noiseGLSL}${WAVE_GLSL}${WATER_BRUSH_GLSL}${cootWakeGLSL(flock.length)}
void main(){vec2 p=vWorld.xz;vec2 u=p/vec2(1.2,.95);float a=atan(u.y,u.x),r=length(u);float bound=(2.9+.3*sin(2.*a+1.1)+.22*cos(3.*a-.4)+.12*sin(5.*a+.3)+.06*sin(7.*a+2.))*${WATER_SCALE.toFixed(3)};float rim=bound-r+(noise(p*7.)-.5)*.12+(noise(p*vec2(2.4,15.))-.5)*.16;float edge=smoothstep(0.,.05,rim);if(edge<.004)discard;
vec3 wave=waveField(p);vec2 rp=p*9.+vec2(time*.35,-time*.2);float e0=noise(rp),ex=noise(rp+vec2(.15,0.)),ez=noise(rp+vec2(0.,.15));vec3 n=normalize(vec3(-wave.y,1.,-wave.z)+vec3(e0-ex,0.,e0-ez)*(.45+wind*.55));
vec3 view=viewDirection,halfV=normalize(sun+view);float nh=max(dot(n,halfV),0.),nl=max(dot(n,sun),0.);float visibility=smoothstep(0.,.18,nl);float rough=pow(nh,48.)*visibility,fine=pow(nh,180.)*visibility;
float depth=smoothstep(.1,2.2,rim);
vec3 col=mix(shallow,deep,clamp(depth*.6+(noise(p*.9)-.5)*.34+(noise(p*3.7+vec2(time*.04,0.))-.5)*.16,0.,1.));col*=.9+.18*nl;
// the far water takes the sky, as it does seen against the light; the near water keeps its depth
float toward=dot(p,normalize(viewDirection.xz)),far=1.-smoothstep(-4.2,1.2,toward);col=mix(col,mix(shallow*1.2,glintTint,.36),far*.42*(1.-night*.6));col=mix(col,deep*.9,smoothstep(0.,4.,toward)*.22);
float paws=smoothstep(.56,.82,noise(p*vec2(1.4,3.4)+vec2(time*.45,time*.1)))*wind;col=mix(col,deep,paws*.24);
col=mix(col,deep,(1.-smoothstep(0.,.16,rim))*.32);
float churn=0.;for(int i=0;i<4;i++){vec2 d=p-wheels[i].xy;float al=dot(d,wake),ac=dot(d,vec2(wake.y,-wake.x));churn+=exp(-ac*ac/.006)*smoothstep(-.16,-.04,al)*exp(-max(al,0.)*3.)*wheels[i].z;}churn=clamp(churn,0.,1.)*(.4+.6*noise(p*34.-wake*time*3.));
const float S=${AERATOR.size.toFixed(2)};vec2 rel=p-aer;vec2 toCam=normalize(viewDirection.xz),side=vec2(toCam.y,-toCam.x);float along=dot(rel,toCam)/S,across=dot(rel,side)+wave.y*.8+(e0-.5)*.06,spread=dot(aerAxis,side)*S;
float blade=0.;for(int i=0;i<4;i++)blade=max(blade,exp(-pow((across-dot(wheels[i].xy-aer,side))/(.07*S),2.)));
float wht=max(exp(-pow((across-.3*spread)/(.08*S),2.)),exp(-pow((across+.3*spread)/(.08*S),2.))),nav=exp(-pow(across/(.09*S),2.));
float reach=.55*abs(spread)+.12*S;float mirrored=smoothstep(reach,reach-.1,abs(across))*smoothstep(-.04,.04,along)*(1.-smoothstep(.12,.48,along));
vec3 image=mix(deep*.7,vec3(.48,.52,.43),blade);image=mix(image,vec3(.78,.79,.72),wht*(1.-blade));image=mix(image,vec3(.16,.22,.34),nav);
col=mix(col,image,mirrored*(.45+.35*noise(vec2(across*20.,along*9.-time*.7)))*(1.-churn*.6));
col=mix(col,glintTint,rough*.3*glint);
vec2 g=p-glitter;float zone=exp(-pow(dot(g,vec2(.94,.34))/1.7,2.)-pow(dot(g,vec2(-.34,.94))/1.1,2.));col=mix(col,mix(glintTint,shallow,.35),zone*.42*glitterGain);
float spark=smoothstep(.7,.9,noise(p*vec2(12.,18.)+vec2(time*.8,-time*.6)))*smoothstep(.35,.75,noise(p*4.5+vec2(-time*.35,time*.25)));col+=glintTint*spark*smoothstep(.05,.6,zone)*glitterGain*2.6;
col=mix(col,mix(shallow,glintTint,.12),cootWake(p)*(1.-.45*night));
// each coot afloat sits in its own dark reflection, drawn toward the viewer and broken by the ripples
{vec2 tc=normalize(viewDirection.xz),ts=vec2(tc.y,-tc.x);float mirror=0.;for(int i=0;i<${flock.length};i++){vec3 b=birds[i];if(b.z<=0.)continue;vec2 d=p-b.xy;float al=dot(d,tc)-.11,ac=dot(d,ts)+wave.y*.6+(e0-.5)*.03;mirror+=exp(-ac*ac/.003-al*al/.012)*b.z;}col=mix(col,deep*.4,min(mirror,1.)*.75*(.6+.4*noise(p*vec2(30.,90.)+time*.4)));}
vec2 lampFoot=lampAt.xz;float la=dot(p-lampFoot,toCam),lx=dot(p-lampFoot,side)+wave.y*1.4+(e0-.5)*.05;float lampTrail=exp(-lx*lx/.0012)*smoothstep(-.02,.08,la)*exp(-max(la,0.)*1.3)*(.55+.45*noise(vec2(lx*60.,la*16.-time*1.2)));vec2 under=p-lampFoot;col+=vec3(1.,.62,.3)*night*(lampTrail*2.6+.4*exp(-dot(under,under)*7.)*(.75+.25*noise(p*9.+time*.3)));
for(int i=0;i<${shore.length};i++){vec4 l=shore[i];float sa=dot(p-l.xy,toCam),sx=dot(p-l.xy,side)+wave.y*1.6+(e0-.5)*.06;float trail=exp(-sx*sx/(.0012+max(sa,0.)*.004))*smoothstep(.0,.2,sa)*exp(-sa*1.7)*smoothstep(.3,.75,noise(vec2(sx*30.+l.w,sa*18.-time*.9)));col+=mix(vec3(.88,.92,1.),vec3(1.,.68,.36),l.z)*trail*night*1.35;}
col=mix(col,foamC,churn*.85);
col+=waterBrush(vWorld.xz);
gl_FragColor=vec4(linearize(col),edge*.92);}` });
    const waterGeo = new THREE.PlaneGeometry(13, 13, 200, 200);
    waterGeo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(waterGeo, waterMaterial);
    water.position.y = -.015;
    scene.add(water);
    // a pool for the heaviest rain and one for the heaviest snow; a spell lets as many fall as it needs
    const rain: RainDrop[] = [];
    for (const kind of [0, 1])
        for (let n = 0; n < 140;) {
            const x = (random() - .5) * 11, z = (random() - .5) * 9;
            if (!isOpenWater(x, z))
                continue;
            rain.push({ id: n, x, z, phase: random(), speed: (.8 + random() * .4) * (kind ? .25 : 1), length: kind ? .025 : .09 + random() * .05, alpha: .60 + random() * .24, kind, threshold: random() });
            n++;
        }
    const particleCount = rain.length + SPLASH_CAPACITY, splashes = new SplashPool();
    const rainPositions = new Float32Array(particleCount * 18), rainUV = new Float32Array(particleCount * 12), rainAlpha = new Float32Array(particleCount * 6), rainKind = new Float32Array(particleCount * 6), rainGeo = new THREE.BufferGeometry();
    for (let i = 0; i < particleCount; i++) {
        rainUV.set([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], i * 12);
        rainAlpha.fill(rain[i]?.alpha ?? 0, i * 6, i * 6 + 6);
        rainKind.fill(rain[i]?.kind ?? 2, i * 6, i * 6 + 6);
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    rainGeo.setAttribute('uv', new THREE.BufferAttribute(rainUV, 2));
    rainGeo.setAttribute('strength', new THREE.BufferAttribute(rainAlpha, 1));
    rainGeo.setAttribute('kind', new THREE.BufferAttribute(rainKind, 1));
    // @anchor:rain-occlusion Same-camera resolved depth keeps final-pass rain behind opaque models, not transparent brush cards.
    const sceneDepth = new THREE.DepthTexture(2, 2, THREE.UnsignedIntType);
    const target = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: true, depthTexture: sceneDepth, samples: 4, resolveDepthBuffer: true });
    const rainTarget = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false });
    const rainMaterial = new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { ink: { value: palette.ink }, foam: { value: palette.foam }, sceneDepth: { value: sceneDepth }, resolution: { value: new THREE.Vector2() } },
        vertexShader: `attribute float strength;attribute float kind;varying vec2 rainUv;varying float rainStrength;varying float rainKind;void main(){rainUv=uv;rainStrength=strength;rainKind=kind;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `precision highp float;uniform vec3 ink;uniform vec3 foam;uniform sampler2D sceneDepth;uniform vec2 resolution;varying vec2 rainUv;varying float rainStrength;varying float rainKind;
        vec3 linearize(vec3 c){return mix(c/12.92,pow((max(c,vec3(0.))+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
        void main(){
          if(gl_FragCoord.z>texture2D(sceneDepth,gl_FragCoord.xy/resolution).r+.00002)discard;
          vec3 color;float alpha;
          if(rainKind>1.5){
            vec2 p=rainUv*2.-1.;float r=length(p);
            float broken=.5+.5*sin(atan(p.y,p.x)*5.+r*13.);
            float ring=(1.-smoothstep(.07,.2,abs(r-.72)))*(.4+.6*broken);
            color=mix(foam,ink,.18);alpha=ring*rainStrength;
          }else if(rainKind>.5){
            float width=smoothstep(0.,.28,rainUv.x)*(1.-smoothstep(.72,1.,rainUv.x));
            color=vec3(.92,.95,1.);alpha=width*pow(1.-rainUv.y,.65)*rainStrength;
          }else{
            float taper=mix(1.,.32,rainUv.y),side=abs(rainUv.x-.5)*2./taper;
            float edge=1.-smoothstep(.25,1.,side),tail=pow(1.-rainUv.y,.7);
            float core=(1.-smoothstep(.0,.35,side))*.5;
            color=mix(ink,foam,.32+core);
            alpha=edge*tail*rainStrength;
          }
          gl_FragColor=vec4(linearize(color),alpha);
        }` });
    const rainLines = new THREE.Mesh(rainGeo, rainMaterial);
    rainLines.frustumCulled = false;
    const rainScene = new THREE.Scene();
    rainScene.add(rainLines);
    const postScene = new THREE.Scene(), postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    // @anchor:surface-paint Water pigment and authored model UVs stay on their surfaces.
    // Screen-space brushwork is reserved for the flat home painting during entry.
    const postMaterial = new THREE.ShaderMaterial({ uniforms: { image: { value: target.texture }, rainImage: { value: rainTarget.texture }, paper: { value: new THREE.Color(...sky.light.paper).convertSRGBToLinear() }, tint: { value: new THREE.Vector3(...sky.profile.tint) }, exposure: { value: sky.profile.exposure }, mist: { value: sky.profile.mist }, haze: { value: new THREE.Color() }, glows: { value: Array.from({ length: lightCount }, () => new THREE.Vector4()) }, glowTones: { value: Array.from({ length: lightCount }, (_, k) => new THREE.Vector3(lightColors[k * 3], lightColors[k * 3 + 1], lightColors[k * 3 + 2])) }, home: { value: homeTexture }, reveal: { value: 0 }, origin: { value: new THREE.Vector2(.5, .5) }, pigmentTint: { value: new THREE.Vector3() }, pigmentShade: { value: new THREE.Vector3() }, pigmentDay: { value: new THREE.Vector2() }, fitScale: { value: new THREE.Vector2(1, 1) }, fitOffset: { value: new THREE.Vector2() }, resolution: { value: new THREE.Vector2() }, time: { value: 0 } }, vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`, fragmentShader: `precision highp float;uniform sampler2D image;uniform sampler2D rainImage;uniform vec3 paper;uniform vec2 resolution;uniform vec3 tint;uniform float exposure;uniform float mist;uniform vec3 haze;uniform vec4 glows[${lightCount}];uniform vec3 glowTones[${lightCount}];uniform sampler2D home;uniform float reveal;uniform vec2 origin;uniform vec3 pigmentTint;uniform vec3 pigmentShade;uniform vec2 pigmentDay;uniform vec2 fitScale;uniform vec2 fitOffset;uniform float time;varying vec2 vUv;${noiseGLSL}${PAINT_LIGHT_GLSL}
vec3 encode(vec3 c){return mix(c*12.92,1.055*pow(max(c,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),c));}
vec4 ground(vec2 uv){vec4 raw=texture2D(image,uv);if(raw.a>.96){vec2 px=1.3/resolution;vec2 j=(vec2(noise(uv*resolution*.21),noise(uv*resolution*.19+3.))-.5)*px*1.6;vec4 near=texture2D(image,uv+vec2(px.x,0.)+j)+texture2D(image,uv-vec2(px.x,0.)+j)+texture2D(image,uv+vec2(0.,px.y)-j)+texture2D(image,uv-vec2(0.,px.y)-j);raw=mix(raw,near*.25,.55);}vec3 col=raw.rgb/max(raw.a,.0001);col*=tint*exposure;col=mix(col,haze,mist*(.22+.36*uv.y));vec3 sheet=encode(paper)*(1.+(noise(uv*resolution*.45)-.5)*.035+(noise(uv*resolution*vec2(.02,.9))-.5)*.012);vec2 ws=(uv-origin-vec2(0.,.22))*vec2(resolution.x/resolution.y,1.);float wash=exp(-dot(ws,ws)*2.2)*(.75+.5*noise(uv*vec2(3.,7.)));sheet*=mix(vec3(1.),pigmentTint/max(dot(pigmentTint,vec3(.3,.59,.11)),.05),wash*.28);if(raw.a<.99){vec2 px=14./resolution;vec4 b=texture2D(image,uv+vec2(px.x,0.))+texture2D(image,uv-vec2(px.x,0.))+texture2D(image,uv+vec2(0.,px.y))+texture2D(image,uv-vec2(0.,px.y));float bleed=smoothstep(0.,2.,b.a)*(1.-raw.a)*(.55+.45*noise(uv*resolution*.08));sheet=mix(sheet,encode(b.rgb/max(b.a,.0001)*tint*exposure),bleed*.15);}return vec4(mix(sheet,encode(col),raw.a),raw.a);}
vec3 painting(vec2 uv){vec3 c=encode(texture2D(home,clamp(uv,vec2(.001),vec2(.999))*fitScale+fitOffset).rgb);return lightPigment(c,pigmentTint,pigmentShade,pigmentDay.x,pigmentDay.y);}
void main(){float m=min(resolution.x,resolution.y);vec2 q=(vUv-.5)*resolution/m;vec2 toUv=m/resolution;
vec3 col=ground(vUv).rgb;
float laid=0.;if(reveal>0.){
  // Only during entry: the water's broken lights settle into horizontal pigment.
  // The first dabs belong to the projected glitter, not the center of the screen.
  vec2 strokes=q*vec2(23.,86.);strokes.x+=hash(vec2(floor(strokes.y),3.1))*5.;
  vec2 cell=floor(strokes),local=fract(strokes);
  float bristle=noise(vec2(strokes.x*.7,strokes.y*5.));
  float due=length((vUv-origin)*resolution/m)*.38+hash(cell)*.18+noise(q*2.1)*.13;
  due+=abs(local.y-.5)*.09+(bristle-.5)*.055;due=clamp(due,.06,.90);
  laid=smoothstep(due-.065,due+.085,reveal*1.22-.1);
  vec2 direction=vec2(1.,.035+(noise(q*2.)-.5)*.18);
  vec3 waterPaint=vec3(0.),paint=vec3(0.);
  float brushSpan=mix(.014,.001,reveal);
  for(int i=-1;i<=1;i++){
    vec2 step=direction*toUv*float(i);
    waterPaint+=ground(vUv+step*.012).rgb;
    paint+=painting(vUv+step*brushSpan);
  }
  float settling=smoothstep(0.,.35,reveal)*(1.-laid);
  col=mix(col,waterPaint/3.,settling*.7);
  col+=vec3(hash(cell+4.)-.5,hash(cell+7.)-.5,.5-hash(cell+4.))*.035*settling;
  col=mix(col,paint/3.,laid);
  float fresh=laid*(1.-laid)*4.;
  col+=pigmentTint*fresh*pow(max(dot(col,vec3(.3,.59,.11)),0.),2.)*.1;
}
vec3 glow=vec3(0.);for(int i=0;i<${lightCount};i++){vec4 g=glows[i];if(g.w<=0.)continue;vec2 d=(vUv-g.xy)*resolution/m;float r2=dot(d,d)/(g.z*g.z);glow+=glowTones[i]*g.w*(exp(-r2)*.6+exp(-r2*.15)*.1);}
col=encode(linearize(col)+glow*(1.-laid));
vec4 rain=texture2D(rainImage,vUv);col=encode(rain.rgb*(1.-laid)+linearize(clamp(col,0.,1.))*(1.-rain.a*(1.-laid)));
gl_FragColor=vec4(col,1.);}` });
    postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial));
    let elapsed = 0, previous = performance.now(), raf = 0, destroyed = false, enteredAt: number | null = null, done = false, lastStir = 0, compiled = false, presented = false;
    const painted = o.painting();
    homeTexture.image = painted;
    homeTexture.needsUpdate = true;
    const homeAnchor = new THREE.Vector2(.78, .76);
    function resize() {
        const width = Math.max(1, innerWidth), h = Math.max(1, innerHeight);
        renderer.setSize(width, h, false);
        const span = viewSpan(width, h), vertical = span * h / width;
        camera.left = -span / 2;
        camera.right = span / 2;
        camera.top = vertical * .44;
        camera.bottom = -vertical * .56;
        camera.updateProjectionMatrix();
        const size = renderer.getDrawingBufferSize(new THREE.Vector2());
        target.setSize(size.x, size.y);
        rainTarget.setSize(size.x, size.y);
        rainMaterial.uniforms.resolution.value.copy(size);
        postMaterial.uniforms.resolution.value.copy(size);
        if (painted) {
            const fit = coverFit(width, h, painted.width, painted.height, o.focus);
            postMaterial.uniforms.fitScale.value.fromArray(fit.scale);
            postMaterial.uniforms.fitOffset.value.fromArray(fit.offset);
            // Bright patch in the authored image, through the same cover crop as HomeFrame.
            homeAnchor.set(Math.max(.12, Math.min(.88, (.78 - fit.offset[0]) / fit.scale[0])), Math.max(.12, Math.min(.88, (.76 - fit.offset[1]) / fit.scale[1])));
        }
    }
    const raycaster = new THREE.Raycaster(), waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    function greet(index: number) {
        const bird = flock[index], response = greetBird(bird);
        if (!response) return;
        if (response === 'greet') wavePool.add(bird.x, bird.z, elapsed, .35);
        o.onFeedback(response);
    }
    function toggleMachine() {
        on = !on;
        o.onFeedback(on ? 'running' : 'stopped');
    }
    function ring(x: number, z: number, strength = 1.8) {
        if (!wavePool.add(x, z, elapsed, strength)) return;
        if (strength > 1) o.onFeedback('water');
    }
    function touch(x: number, y: number, strength = 1.8) {
        if (destroyed || enteredAt !== null) return;
        const rect = canvas.getBoundingClientRect();
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return;
        raycaster.setFromCamera(new THREE.Vector2((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2), camera);
        if (strength > 1) {
            const index = pickBird(coots.map(coot => {
                const p = coot.group.position.clone().project(camera);
                return { x: rect.left + (p.x + 1) * rect.width / 2, y: rect.top + (1 - p.y) * rect.height / 2, visible: coot.group.visible && p.z >= -1 && p.z <= 1 };
            }), x, y);
            if (index >= 0) { greet(index); return; }
            if (aerator.hit(raycaster)) { toggleMachine(); return; }
        }
        const hit = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(waterPlane, hit)) ring(hit.x, hit.z, strength);
    }
    let drag: { gesture: PondGesture; yaw: number } | null = null;
    const onDown = (e: PointerEvent) => {
        if (enteredAt !== null || !e.isPrimary || e.button !== 0 || drag) return;
        drag = { gesture: new PondGesture(e.pointerId, e.clientX, e.clientY), yaw: targetYaw };
        canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
        if (drag && drag.gesture.id === e.pointerId) {
            drag.gesture.move(e.pointerId, e.clientX, e.clientY);
            if (drag.gesture.dragged) targetYaw = drag.yaw + (e.clientX - drag.gesture.x) * .009;
        } else if (!drag && e.pointerType === 'mouse' && elapsed - lastStir >= .14) {
            lastStir = elapsed;
            touch(e.clientX, e.clientY, .3);
        }
    };
    const onUp = (e: PointerEvent) => {
        if (!drag || drag.gesture.id !== e.pointerId) return;
        drag.gesture.move(e.pointerId, e.clientX, e.clientY);
        const tap = drag.gesture.finish(e.pointerId);
        drag = null;
        if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
        if (tap) touch(e.clientX, e.clientY);
    };
    const onCancel = (e: PointerEvent) => {
        if (drag?.gesture.id === e.pointerId) drag = null;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);
    canvas.addEventListener('lostpointercapture', onCancel);
    const sinkAt: [number, number, number] = [AERATOR.x + aeratorAxis[0] * 1.1, 0, AERATOR.z + aeratorAxis[1] * 1.1];
    let lastChurn = 0;
    // The aerator rides the long swell only, never its own ripples or the rain's, and eases into
    // each new attitude, so it rocks slowly instead of trembling.
    const ride = { height: 0, pitch: 0, roll: 0 }, span = .5 * AERATOR.size;
    function rideOn(dt: number) {
        const at = (u: number, w: number) => waveField(AERATOR.x + (aeratorAxis[0] * u + aeratorWake[0] * w) * span, AERATOR.z + (aeratorAxis[1] * u + aeratorWake[1] * w) * span, elapsed).height;
        const k = Math.min(1, dt * 2.5);
        ride.height += (at(0, 0) - ride.height) * k;
        ride.roll += (Math.atan((at(1, 0) - at(-1, 0)) / (2 * span)) * .7 - ride.roll) * k;
        ride.pitch += (-Math.atan((at(0, 1) - at(0, -1)) / (2 * span)) * .7 - ride.pitch) * k;
        return ride;
    }
    const glowAt = new THREE.Vector3();
    /** Steps the coots and sets each one on the water, under it, or up on a pontoon. */
    function moveFlock(dt: number) {
        PERCHES.forEach((_, i) => aerator.perch(i, perchAt[i]));
        const splashes = stepFlock(flock, dt, { random, running, wheels: wheelSpots, center: [AERATOR.x, AERATOR.z], perches: perchAt.map(v => [v.x, v.z] as [number, number]) });
        for (const s of splashes)
            wavePool.add(s.x, s.z, elapsed, s.strength);
        const reflected = waterMaterial.uniforms.birds.value as THREE.Vector3[];
        flock.forEach((b, i) => {
            coots[i].update(b, elapsed, waveField(b.x, b.z, elapsed), perchAt);
            const afloat = b.mode === 'swim' || b.mode === 'greet' || b.mode === 'flee';
            reflected[i].set(b.x, b.z, afloat && coots[i].group.visible ? 1 : 0);
        });
        wakeTrail.update(flock, elapsed);
    }
    const gusts = () => Math.max(0, Math.min(1, (sky.profile.wind - .25) / 1.75));
    /** Carries the island's sky into the uniforms. */
    function setSky(dt = 0) {
        const { light, profile } = sky;
        sunDirection.set(...sky.sun);
        palette.lit.set(...light.light);
        palette.shallow.set(...light.water);
        palette.deep.set(...light.deep);
        palette.foam.set(...light.water).lerp(new THREE.Vector3(...light.light), .6);
        palette.ink.set(...light.ink);
        const water = waterMaterial.uniforms;
        water.glint.value = profile.glint;
        water.glintTint.value.set(...profile.glintTint);
        water.wind.value = gusts();
        // after dusk the lamps come on; the sun's glitter gives way to the moon's, and cloud puts out both
        const dark = Math.max(0, Math.min(1, (.6 - light.sun) / .45));
        night.value = dark * dark * (3 - 2 * dark);
        daylight.value = light.sun;
        const clear = Math.max(0, 1 - (profile.rain + profile.snow + profile.mist) * 1.4);
        // a low sun lays the brightest path of all, so the glitter keeps its strength as the sun goes down
        water.glitterGain.value = clear * Math.max(Math.min(1, profile.glint * 1.15), night.value * .4) * (1 - night.value * .6);
        const post = postMaterial.uniforms;
        const pigment = paintingLight(sky);
        post.pigmentTint.value.set(...pigment.tint);
        post.pigmentShade.value.set(...pigment.shade);
        post.pigmentDay.value.set(pigment.exposure, pigment.sun);
        post.paper.value.setRGB(...light.paper).convertSRGBToLinear();
        post.tint.value.set(...profile.tint);
        post.exposure.value = profile.exposure;
        post.mist.value = profile.mist;
        // fog is lit from within: a little lighter than the paper, and warmer where lamps shine in it
        post.haze.value.setRGB(...light.paper).lerp(new THREE.Color(...light.light), .1 + night.value * .1).convertSRGBToLinear();
        snowCover.value = Math.max(0, Math.min(1, snowCover.value + dt * (profile.snow > .05 ? profile.snow * .03 : -.012)));
        // the sun's glitter lies on the far water and crosses it from left to right through the day
        const hour = sky.weather.hour, moon = hour < 5 || hour >= 21.5, arc = Math.max(0, Math.min(1, (hour - 6) / 13)), right = moon ? 1.4 : -1.6 + arc * 4.4;
        // screen right is (.94, .34) on the water at the usual view, and far is (.34, -.94)
        waterMaterial.uniforms.glitter.value.set(.94 * right + .34 * 1.1, .34 * right - .94 * 1.1);
        aerator.sprayMaterial.uniforms.foam.value.copy(palette.foam);
    }
    setSky();
    function frame(ms: number) {
        raf = 0;
        if (destroyed || document.hidden)
            return;
        const dt = Math.max(0, Math.min((ms - previous) / 1000, .05));
        previous = ms;
        const before = elapsed;
        elapsed += dt;
        const transition = transitionState(elapsed, enteredAt, 0);
        sky = islandSky(clock, Date.now());
        setSky(dt);
        camera.zoom = 1 + transition.sink * 5;
        camera.updateProjectionMatrix();
        yaw += (targetYaw - yaw) * .15;
        // entering sinks toward the glitter beside the aerator, where the photograph was taken
        const look = new THREE.Vector3(...sinkAt).multiplyScalar(transition.sink);
        // Land the actual patch of glitter on its place in the painted photograph.
        const across = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
        const up = new THREE.Vector3(-Math.sin(yaw) * Math.sin(ELEVATION), Math.cos(ELEVATION), -Math.cos(yaw) * Math.sin(ELEVATION));
        look.addScaledVector(across, (.5 - homeAnchor.x) * (camera.right - camera.left) / camera.zoom * transition.sink);
        look.addScaledVector(up, (.56 - homeAnchor.y) * (camera.top - camera.bottom) / camera.zoom * transition.sink);
        camera.position.set(Math.sin(yaw) * 12 * Math.cos(ELEVATION), 12 * Math.sin(ELEVATION), Math.cos(yaw) * 12 * Math.cos(ELEVATION)).add(look);
        camera.lookAt(look);
        camera.updateMatrixWorld();
        const glitterAt = new THREE.Vector3(...sinkAt).project(camera);
        postMaterial.uniforms.origin.value.set(glitterAt.x * .5 + .5, glitterAt.y * .5 + .5);
        waterViewDirection(camera, waterMaterial.uniforms.viewDirection.value);
        waterMaterial.uniforms.time.value = elapsed;
        postMaterial.uniforms.time.value = elapsed;
        const { profile } = sky, falling = (r: RainDrop) => r.threshold < (r.kind ? profile.snow : profile.rain);
        rainLines.visible = enteredAt === null;
        if (enteredAt === null) {
            const impacts = rain.filter(falling).flatMap(r => r.kind
                ? landingsBetween(before, elapsed, r).map(time => ({ x: r.x, z: r.z, time, snow: true }))
                : rainImpacts(before, elapsed, r).map(impact => ({ ...impact, snow: false })));
            impacts.sort((a, b) => a.time - b.time);
            for (const impact of impacts) {
                if (!impact.snow) splashes.add(impact);
                wavePool.addRain(impact.x, impact.z, impact.time, impact.snow ? .3 : 1);
            }
        }
        const waves = wavePool.active(elapsed);
        running += ((on ? 1 : 0) - running) * Math.min(1, dt * (on ? .9 : .6));
        if (running > .1 && elapsed - lastChurn > .22 / running) {
            lastChurn = elapsed;
            const [x, z] = wheelSpots[Math.floor(random() * wheelSpots.length)];
            wavePool.add(x + aeratorWake[0] * .08, z + aeratorWake[1] * .08, elapsed, .35 * running);
        }
        if (random() < dt * 9 * gusts()) {
            const x = (random() - .5) * 7, z = (random() - .5) * 7;
            wavePool.add(x, z, elapsed, .25 + profile.wind * .6);
        }
        for (let i = 0; i < drops.length; i++) {
            const e = waves[i];
            if (e)
                drops[i].set(e.x, e.z, elapsed - e.time, e.strength);
            else
                drops[i].w = 0;
        }
        const halfWidth = rainHalfWidth((camera.right - camera.left) / camera.zoom, canvas.clientWidth);
        const writeQuad = (index: number, x: number, y: number, z: number, tx: number, ty: number, tz: number, ax: number, az: number) => {
            const offset = index * 18;
            rainPositions.set([x-ax,y,z-az,x+ax,y,z+az,tx+ax,ty,tz+az,x-ax,y,z-az,tx+ax,ty,tz+az,tx-ax,ty,tz-az], offset);
        };
        for (let i = 0; i < rain.length; i++) {
            const r = rain[i], state = r.kind ? { ...rainSample(elapsed, r), x: r.x, z: r.z } : rainFlight(elapsed, r);
            if (!state.falling || !falling(r)) { rainPositions.fill(0, i * 18, i * 18 + 18); continue; }
            const surface = -.015 + waveField(state.x, state.z, elapsed, waves).height, y = state.y + surface;
            const wide = r.kind ? .018 : halfWidth, length = r.kind ? r.length : r.length * r.speed;
            writeQuad(i, state.x-profile.lean*state.y,y,state.z,state.x-profile.lean*(state.y+length),y+length,state.z,Math.cos(yaw)*wide,-Math.sin(yaw)*wide);
        }
        const contacts = splashes.active(elapsed);
        for (let i = 0; i < SPLASH_CAPACITY; i++) {
            const index = rain.length + i, contact = contacts[i];
            if (!contact) { rainPositions.fill(0,index*18,index*18+18); rainAlpha.fill(0,index*6,index*6+6); continue; }
            const age = elapsed-contact.time, life = age/SPLASH_TTL, radius = .025 + age*.42;
            const y = -.012 + waveField(contact.x,contact.z,elapsed,waves).height;
            writeQuad(index,contact.x,y,contact.z-radius,contact.x,y,contact.z+radius,radius,0);
            rainAlpha.fill(.7*Math.sin(Math.PI*Math.sqrt(life))*(1-life),index*6,index*6+6);
        }
        rainGeo.attributes.position.needsUpdate = true;
        rainGeo.attributes.strength.needsUpdate = true;
        aerator.update(elapsed, dt, running, rideOn(dt));
        for (const spot of waterMaterial.uniforms.wheels.value as THREE.Vector3[]) spot.z = running;
        aerator.group.localToWorld(lampAt.value.set(...LAMP));
        lightPositions.set(lampAt.value.toArray(), shore.length * 3);
        lightGeometry.attributes.position.needsUpdate = true;
        // each light's glow, washed over whatever lies around it on the page; fog spreads it wider
        const glows = postMaterial.uniforms.glows.value as THREE.Vector4[];
        for (let k = 0; k < lightCount; k++) {
            const at = glowAt.set(lightPositions[k * 3], lightPositions[k * 3 + 1], lightPositions[k * 3 + 2]).project(camera), lamp = k === shore.length;
            const flicker = lamp ? 1 : .85 + .15 * Math.sin(elapsed * 2.3 + lightPositions[k * 3] * 17 + lightPositions[k * 3 + 2] * 9);
            glows[k].set(at.x * .5 + .5, at.y * .5 + .5, (lamp ? .045 : .011) * camera.zoom * (1 + profile.mist * 1.5), night.value * flicker * (lamp ? .42 : .16));
        }
        lightMaterial.uniforms.time.value = elapsed;
        lightMaterial.uniforms.size.value = 12 * (1 + sky.profile.mist * 1.4) * renderer.getPixelRatio() * camera.zoom;
        moveFlock(dt);
        aerator.sprayMaterial.uniforms.size.value = 4 * renderer.getPixelRatio() * camera.zoom;
        postMaterial.uniforms.reveal.value = transition.reveal;
        renderer.setClearColor(0x000000, 0);
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);
        renderer.setRenderTarget(rainTarget);
        renderer.render(rainScene, camera);
        renderer.setRenderTarget(null);
        renderer.setClearColor(0x000000, 1);
        renderer.render(postScene, postCamera);
        if (!presented) { presented = true; o.onReady?.(); }
        if (transition.done && !done) {
            done = true;
            o.onDone();
        }
        if (!destroyed)
            raf = requestAnimationFrame(frame);
    }
    const onVisibility = () => { if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
    }
    else if (!destroyed && compiled && !raf) {
        previous = performance.now();
        raf = requestAnimationFrame(frame);
    } };
    document.addEventListener('visibilitychange', onVisibility);
    addEventListener('resize', resize);
    resize();
    // Let the driver compile without a synchronous first-draw shader stall where supported.
    void Promise.all([renderer.compileAsync(scene, camera), renderer.compileAsync(rainScene, camera), renderer.compileAsync(postScene, postCamera)])
        .then(() => {
            if (destroyed) return;
            compiled = true;
            previous = performance.now();
            if (!document.hidden) raf = requestAnimationFrame(frame);
        }).catch(() => { if (!destroyed) o.onDone(); });
    return {
        enter() { if (destroyed || enteredAt !== null)
            return; enteredAt = elapsed;
            const glitter = waterMaterial.uniforms.glitter.value as THREE.Vector2;
            sinkAt[0] = glitter.x; sinkAt[2] = glitter.y;
            wavePool.add(sinkAt[0], sinkAt[2], elapsed, 1.8); },
        interact(action) {
            if (destroyed || enteredAt !== null) return;
            if (action === 'machine') toggleMachine();
            else if (action === 'water') ring(0, 0);
            else {
                const index = flock.findIndex(b => b.mode === 'swim' || b.mode === 'perch' || b.mode === 'board');
                if (index >= 0) greet(index);
            }
        },
        destroy() {
            if (destroyed)
                return;
            destroyed = true;
            canvas.style.touchAction = originalTouchAction;
            cancelAnimationFrame(raf);
            removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', onVisibility);
            canvas.removeEventListener('pointerdown', onDown);
            canvas.removeEventListener('pointermove', onMove);
            canvas.removeEventListener('pointerup', onUp);
            canvas.removeEventListener('pointercancel', onCancel);
            canvas.removeEventListener('lostpointercapture', onCancel);
            if (drag && canvas.hasPointerCapture(drag.gesture.id))
                canvas.releasePointerCapture(drag.gesture.id);
            drag = null;
            disposeModelResources(scene, rainScene, postScene, o.models.coot);
            homeTexture.dispose();
            target.dispose();
            rainTarget.dispose();
            renderer.dispose();
        }
    };
}
