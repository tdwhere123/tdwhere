import * as THREE from 'three';
import { coverFit, type Vec2 } from './presets';
import type { Light, Weather } from '../weather';
import { rainSample } from './island/render-math';
import { WavePool, waveField, WAVE_GLSL, advanceRainWaves } from './island/waves';
import { height, normal, landField, isOpenWater, randomSource, ELEVATION } from './island/math';
import { weatherProfile, viewSpan, transitionState, sunVector } from './island/state';
type RainDrop = {
    x: number;
    z: number;
    phase: number;
    speed: number;
    length: number;
    alpha: number;
    lean: number;
};
export type OvertureHandle = {
    enter(): void;
    touch(x: number, y: number): void;
    stir(x: number, y: number): void;
    destroy(): void;
};
export function mountOverture(o: {
    canvas: HTMLCanvasElement;
    weather: Weather;
    light: Light;
    painting: () => HTMLCanvasElement;
    focus: Vec2;
    onDone: () => void;
}): OvertureHandle {
    const { canvas, weather, light } = o, profile = weatherProfile(weather, light);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    const originalTouchAction = canvas.style.touchAction;
    canvas.style.touchAction = 'none';
    const homeTexture = new THREE.Texture();
    homeTexture.colorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor('#faf9f4');
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, .1, 40);
    let yaw = -.35, targetYaw = yaw;
    const raining = profile.rain, snowing = profile.snow;
    const sunDirection = new THREE.Vector3(...sunVector(weather, light)), sun = new THREE.DirectionalLight(0xffecc9, 2.1);
    sun.position.copy(sunDirection).multiplyScalar(10);
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xe3f0ed, 0x6d9894, 2));
    const random = randomSource();
    const noiseGLSL = `float gaussH(vec2 p,vec2 c,vec2 r){vec2 q=(p-c)/r;return exp(-dot(q,q));}float sceneHeight(vec2 p){float x=p.x,z=p.y;float nx=x/1.35,nz=(z+.10*sin(x*3.))/.62;float f=1.-nx*nx-nz*nz-.32*gaussH(p,vec2(.28,.38),vec2(.32,.24))+.10*sin(x*5.-z*4.)+.055*sin(z*12.+x*6.);if(f<=0.)return 0.;float ground=.004+.035*pow(f,1.1)+.025*gaussH(p,vec2(-.50,-.10),vec2(.5,.35));float a=gaussH(p,vec2(-.55,-.13),vec2(.54,.34)),b=gaussH(p,vec2(-.04,-.21),vec2(.40,.25));return ground+max(0.,.29*pow(a,1.3)+.21*pow(b,1.5)-.045)*(1.+.025*sin(x*12.+z*9.));}float landOcclusion(vec3 p,vec3 sun){float shade=0.;for(int i=1;i<=24;i++){float t=float(i)*.10;vec3 q=p+sun*t;shade=max(shade,smoothstep(.004,.055,sceneHeight(q.xz)-q.y));}return shade;}vec3 linearize(vec3 c){return mix(c/12.92,pow((max(c,vec3(0.))+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}`;
    const worldVertex = `varying vec3 vWorld;varying vec3 vNormal;void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
    const landMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: true, side: THREE.DoubleSide, uniforms: { sun: { value: sunDirection } }, vertexShader: worldVertex, fragmentShader: `precision highp float;uniform vec3 sun;varying vec3 vWorld;varying vec3 vNormal;${noiseGLSL}void main(){float d=max(dot(normalize(vNormal),sun),0.);float canopy=smoothstep(.015,.10,vWorld.y);float shade=landOcclusion(vWorld+vec3(0.,.018,0.),sun);vec3 shadow=vec3(.34,.53,.54),mid=vec3(.55,.69,.62),light=vec3(.91,.78,.60);vec3 col=mix(shadow,mid,smoothstep(.02,.32,d));col=mix(col,light,smoothstep(.25,.75,d)*.78);col=mix(col,shadow,shade*.40);col+=vec3(.020,.012,-.008)*(noise(vWorld.xz*14.)-.5);float alpha=mix(.22,.96,canopy);gl_FragColor=vec4(linearize(col),alpha);}` });
    const vertices: number[] = [], normals: number[] = [];
    const step = .045;
    for (let x = -1.5; x < 1.5; x += step)
        for (let z = -.85; z < .85; z += step) {
            if (landField(x + step / 2, z + step / 2) <= 0)
                continue;
            for (const [a, b] of [[x, z], [x + step, z], [x + step, z + step], [x, z], [x + step, z + step], [x, z + step]]) {
                vertices.push(a, height(a, b), b);
                normals.push(...normal(a, b));
            }
        }
    const landGeometry = new THREE.BufferGeometry();
    landGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    landGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    const land = new THREE.Mesh(landGeometry, landMaterial);
    scene.add(land);
    const wavePool = new WavePool();
    const drops = Array.from({ length: 48 }, () => new THREE.Vector4(0, 0, 10, 0));
    const waterMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { time: { value: 0 }, glint: { value: profile.glint }, glintTint: { value: new THREE.Vector3(...profile.glintTint) }, sun: { value: sunDirection }, drops: { value: drops } }, vertexShader: `uniform float time;uniform vec4 drops[48];varying vec3 vWorld;varying vec3 vNormal;${WAVE_GLSL}void main(){vec4 w=modelMatrix*vec4(position,1.);vec3 wave=waveField(w.xz);w.y+=wave.x;vWorld=w.xyz;vNormal=normalize(vec3(-wave.y,1.,-wave.z));gl_Position=projectionMatrix*viewMatrix*w;}`, fragmentShader: `precision highp float;uniform float time;uniform float glint;uniform vec3 glintTint;uniform vec3 sun;uniform vec4 drops[48];varying vec3 vWorld;varying vec3 vNormal;${noiseGLSL}${WAVE_GLSL}
void main(){vec2 p=vWorld.xz;float a=atan(p.y,p.x),r=length(p);float bound=2.75+.34*sin(3.*a+.5)+.25*cos(5.*a-1.)+.15*sin(7.*a);float edge=smoothstep(0.,.6,bound-r+(noise(p*7.)-.5)*.16);if(edge<.004)discard;
vec3 wave=waveField(p);vec3 n=normalize(vec3(-wave.y,1.,-wave.z));
vec3 view=normalize(cameraPosition-vWorld),halfV=normalize(sun+view);float nh=max(dot(n,halfV),0.),nl=max(dot(n,sun),0.);float visibility=smoothstep(0.,.18,nl);float rough=pow(nh,48.)*visibility,fine=pow(nh,180.)*visibility;
vec3 col=mix(vec3(.71,.83,.85),vec3(.86,.90,.85),noise(p*1.1));float shade=landOcclusion(vWorld+vec3(0.,.033,0.),sun);col=mix(col,vec3(.50,.67,.72),shade*.28);col=mix(col,glintTint,rough*.54*glint*(1.-shade*.90));float broken=smoothstep(.65,.88,noise(p*vec2(8.,13.)))*smoothstep(.24,.50,rough);col+=glintTint*fine*broken*.24*glint*(1.-shade);
vec2 reflected=(p-vec2(-.4,.25))/vec2(.65,.32);float reflection=exp(-dot(reflected,reflected));col=mix(col,vec3(.56,.72,.67),reflection*.14);
gl_FragColor=vec4(linearize(col),edge*.88);}` });
    const waterGeo = new THREE.PlaneGeometry(7.5, 7.5, 128, 128);
    waterGeo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(waterGeo, waterMaterial);
    water.position.y = -.015;
    scene.add(water);
    const rain: RainDrop[] = [];
    while (rain.length < Math.round(40 + weather.strength * 40)) {
        const x = (random() - .5) * 6.4, z = (random() - .5) * 6.4;
        if (isOpenWater(x, z))
            rain.push({ x, z, phase: random(), speed: (.8 + random() * .4) * profile.precipitationSpeed, length: snowing ? .025 : .075 + random() * .13, alpha: .60 + random() * .24, lean: weather.lean });
    }
    const rainPositions = new Float32Array(rain.length * 18), rainUV = new Float32Array(rain.length * 12), rainAlpha = new Float32Array(rain.length * 6), rainGeo = new THREE.BufferGeometry();
    for (let i = 0; i < rain.length; i++) {
        rainUV.set([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], i * 12);
        rainAlpha.fill(rain[i].alpha, i * 6, i * 6 + 6);
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    rainGeo.setAttribute('uv', new THREE.BufferAttribute(rainUV, 2));
    rainGeo.setAttribute('strength', new THREE.BufferAttribute(rainAlpha, 1));
    const rainMaterial = new THREE.ShaderMaterial({ transparent: true, depthTest: true, depthWrite: false, side: THREE.DoubleSide, vertexShader: `attribute float strength;varying vec2 rainUv;varying float rainStrength;void main(){rainUv=uv;rainStrength=strength;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`, fragmentShader: `precision highp float;varying vec2 rainUv;varying float rainStrength;void main(){float width=smoothstep(0.,.28,rainUv.x)*(1.-smoothstep(.72,1.,rainUv.x));float tail=pow(1.-rainUv.y,.65);gl_FragColor=vec4(${snowing ? 'vec3(.92,.95,1.)' : 'vec3(.16,.27,.30)'},width*tail*rainStrength);}` });
    const rainLines = new THREE.Mesh(rainGeo, rainMaterial);
    rainLines.frustumCulled = false;
    const rainScene = new THREE.Scene(), rainDepthMaterial = landMaterial.clone();
    rainDepthMaterial.colorWrite = false;
    rainDepthMaterial.transparent = false;
    rainDepthMaterial.depthWrite = true;
    rainScene.add(new THREE.Mesh(landGeometry, rainDepthMaterial));
    rainScene.add(rainLines);
    const target = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: true }), rainTarget = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: true });
    const postScene = new THREE.Scene(), postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const postMaterial = new THREE.ShaderMaterial({ uniforms: { image: { value: target.texture }, rainImage: { value: rainTarget.texture }, paper: { value: new THREE.Color(...light.paper).convertSRGBToLinear() }, tint: { value: new THREE.Vector3(...profile.tint) }, exposure: { value: profile.exposure }, mist: { value: profile.mist }, home: { value: homeTexture }, reveal: { value: 0 }, fitScale: { value: new THREE.Vector2(1, 1) }, fitOffset: { value: new THREE.Vector2() }, resolution: { value: new THREE.Vector2() }, painted: { value: 1 } }, vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`, fragmentShader: `precision highp float;uniform sampler2D image;uniform sampler2D rainImage;uniform vec3 paper;uniform vec2 resolution;uniform float painted;uniform vec3 tint;uniform float exposure;uniform float mist;uniform sampler2D home;uniform float reveal;uniform vec2 fitScale;uniform vec2 fitOffset;varying vec2 vUv;${noiseGLSL}
vec3 encode(vec3 c){return mix(c*12.92,1.055*pow(max(c,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),c));}
vec3 samplePaint(vec2 uv){vec4 p=texture2D(image,uv);return p.rgb/max(p.a,.0001);}
void main(){vec4 raw=texture2D(image,vUv);float coverage=raw.a;vec3 col=raw.rgb/max(coverage,.0001);
if(painted>.5&&coverage>.002){vec2 pixel=vUv*resolution;vec2 cell=floor(pixel/vec2(11.,7.));vec2 local=fract(pixel/vec2(11.,7.));float id=hash(cell),angle=(hash(cell+17.)-.5)*1.2;vec2 dir=vec2(cos(angle),sin(angle));float dab=smoothstep(0.,.20,local.x)*(1.-smoothstep(.75,1.,local.x))*smoothstep(0.,.25,local.y)*(1.-smoothstep(.65,1.,local.y));float selected=step(.36,id);vec3 neighbor=samplePaint(vUv+dir/resolution*(id-.5)*3.);col=mix(col,neighbor,dab*selected*.22);float broad=noise(pixel/vec2(39.,27.))-.5;col+=vec3(.012,.007,-.007)*(id-.5)*dab*selected+vec3(.009,.006,-.004)*broad;}
col*=tint*exposure;col=mix(col,paper,mist*.35);vec3 combined=mix(paper,col,coverage);vec4 rain=texture2D(rainImage,vUv);combined=rain.rgb+combined*(1.-rain.a);vec3 homeColor=texture2D(home,vUv*fitScale+fitOffset).rgb;float wash=smoothstep(0.,1.,reveal);combined=mix(combined,homeColor,wash);gl_FragColor=vec4(encode(combined),1.);}` });
    postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial));
    let elapsed = 0, previous = performance.now(), raf = 0, destroyed = false, enteredAt: number | null = null, paintedAt: number | null = null, done = false, lastStir = 0;
    let painted: HTMLCanvasElement | null = null;
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
        postMaterial.uniforms.resolution.value.copy(size);
        if (painted) {
            const fit = coverFit(width, h, painted.width, painted.height, o.focus);
            postMaterial.uniforms.fitScale.value.fromArray(fit.scale);
            postMaterial.uniforms.fitOffset.value.fromArray(fit.offset);
        }
    }
    const paintTimer = setTimeout(() => { if (destroyed)
        return; try {
        painted = o.painting();
        homeTexture.image = painted;
        homeTexture.needsUpdate = true;
        paintedAt = elapsed;
        resize();
    }
    catch {
        done = true;
        o.onDone();
    } }, 400);
    const raycaster = new THREE.Raycaster(), waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    function touch(x: number, y: number, strength = 1.8) { if (destroyed || enteredAt !== null)
        return; const rect = canvas.getBoundingClientRect(); raycaster.setFromCamera(new THREE.Vector2((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2), camera); const hit = new THREE.Vector3(); if (raycaster.ray.intersectPlane(waterPlane, hit))
        wavePool.add(hit.x, hit.z, elapsed, strength); }
    let drag: {
        x: number;
        yaw: number;
        id: number;
    } | null = null;
    const onDown = (e: PointerEvent) => { if (enteredAt !== null)
        return; drag = { x: e.clientX, yaw: targetYaw, id: e.pointerId }; canvas.setPointerCapture(e.pointerId); };
    const onMove = (e: PointerEvent) => { if (drag && drag.id === e.pointerId)
        targetYaw = drag.yaw + (e.clientX - drag.x) * .009; };
    const onUp = () => { drag = null; };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('lostpointercapture', onUp);
    function frame(ms: number) {
        raf = 0;
        if (destroyed || document.hidden)
            return;
        const dt = Math.max(0, Math.min((ms - previous) / 1000, .05));
        previous = ms;
        const before = elapsed;
        elapsed += dt;
        const transition = transitionState(elapsed, enteredAt, paintedAt);
        camera.zoom = 1 + transition.sink * 5;
        camera.updateProjectionMatrix();
        yaw += (targetYaw - yaw) * .15;
        camera.position.set(Math.sin(yaw) * 12 * Math.cos(ELEVATION), 12 * Math.sin(ELEVATION), Math.cos(yaw) * 12 * Math.cos(ELEVATION));
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        waterMaterial.uniforms.time.value = elapsed;
        rainLines.visible = (raining || snowing) && enteredAt === null;
        const waves = advanceRainWaves(wavePool, before, elapsed, rain, (raining || snowing) && enteredAt === null);
        if (snowing) for (const wave of waves) if (wave.time > before) wave.strength *= .3;
        if (weather.sky === 'wind' && Math.floor(before * 7) !== Math.floor(elapsed * 7)) {
            const x = (random() - .5) * 5, z = (random() - .5) * 5;
            wavePool.add(x, z, elapsed, .25 + profile.wind * .6);
        }
        for (let i = 0; i < drops.length; i++) {
            const e = waves[i];
            if (e)
                drops[i].set(e.x, e.z, elapsed - e.time, e.strength);
            else
                drops[i].w = 0;
        }
        for (let i = 0; i < rain.length; i++) {
            const r = rain[i], state = rainSample(elapsed, r), surface = -.015 + waveField(r.x, r.z, elapsed, waves).height, y = state.y + surface;
            const across = new THREE.Vector3(Math.cos(yaw) * (snowing ? .018 : .008), 0, -Math.sin(yaw) * (snowing ? .018 : .008)), head = new THREE.Vector3(r.x - r.lean * state.y, y, r.z), tail = new THREE.Vector3(r.x - r.lean * (state.y + r.length), y + r.length, r.z);
            const points = state.falling ? [head.clone().sub(across), head.clone().add(across), tail.clone().add(across), head.clone().sub(across), tail.clone().add(across), tail.clone().sub(across)] : Array.from({ length: 6 }, () => new THREE.Vector3(0, -100, 0));
            points.forEach((v, j) => rainPositions.set(v.toArray(), i * 18 + j * 3));
        }
        rainGeo.attributes.position.needsUpdate = true;
        postMaterial.uniforms.reveal.value = transition.reveal;
        renderer.setClearColor(0x000000, 0);
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);
        renderer.setRenderTarget(rainTarget);
        renderer.render(rainScene, camera);
        renderer.setRenderTarget(null);
        renderer.setClearColor(0x000000, 1);
        renderer.render(postScene, postCamera);
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
    else if (!destroyed && !raf) {
        previous = performance.now();
        raf = requestAnimationFrame(frame);
    } };
    document.addEventListener('visibilitychange', onVisibility);
    addEventListener('resize', resize);
    resize();
    raf = requestAnimationFrame(frame);
    return {
        enter() { if (destroyed || enteredAt !== null)
            return; enteredAt = elapsed; wavePool.add(0, 1, elapsed, 1.8); },
        touch,
        stir(x, y) { if (elapsed - lastStir < .14)
            return; lastStir = elapsed; touch(x, y, .3); },
        destroy() {
            if (destroyed)
                return;
            destroyed = true;
            canvas.style.touchAction = originalTouchAction;
            cancelAnimationFrame(raf);
            clearTimeout(paintTimer);
            removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', onVisibility);
            canvas.removeEventListener('pointerdown', onDown);
            canvas.removeEventListener('pointermove', onMove);
            canvas.removeEventListener('pointerup', onUp);
            canvas.removeEventListener('pointercancel', onUp);
            canvas.removeEventListener('lostpointercapture', onUp);
            if (drag && canvas.hasPointerCapture(drag.id))
                canvas.releasePointerCapture(drag.id);
            drag = null;
            const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
            for (const root of [scene, rainScene, postScene])
                root.traverse(object => { if (object instanceof THREE.Mesh) {
                    geometries.add(object.geometry);
                    for (const material of Array.isArray(object.material) ? object.material : [object.material])
                        materials.add(material);
                } });
            geometries.forEach(g => g.dispose());
            materials.forEach(m => m.dispose());
            homeTexture.dispose();
            target.dispose();
            rainTarget.dispose();
            renderer.dispose();
        }
    };
}
