import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { FINAL_PASS_LAYER, SceneContext } from "../core/types";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import * as THREE from "three";
import { OutputPass, UnrealBloomPass } from "three/examples/jsm/Addons.js";
import vertexShader from '../shaders/bloomMixShaders/vertex.vert';
import fragmentShader from '../shaders/bloomMixShaders/fragment.frag';
import { add, overlay } from "three/tsl";


const addBloom = (ctx: SceneContext, finalComposer: EffectComposer, bloomComposer: EffectComposer) => {
    const bloom = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        ctx.state.postEffectState.bloom.strength,   // strength (overall intensity)
        ctx.state.postEffectState.bloom.radius,   // radius   (spread)
        ctx.state.postEffectState.bloom.threshold,   // threshold (only pixels brighter than this bloom)
    );
    bloomComposer.addPass(bloom);
    bloomComposer.renderToScreen = false;
    const mixMat = new THREE.ShaderMaterial({
        uniforms: {
            baseTexture: { value: null },
            bloomTexture: { value: null },
            uStrength: { value: 0.6 },
            hasBloom: { value: false },
        },
        vertexShader,
        fragmentShader,
    });
    const mixPass = new ShaderPass(mixMat, "baseTexture");

    finalComposer.addPass(mixPass);

    finalComposer.renderToScreen = true;
    const outputPass = new OutputPass();
    // finalComposer.addPass(outputPass);

    const bloomLayer = new THREE.Layers();
    bloomLayer.set(ctx.state.postEffectState.bloom.layer);
    const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const materials: { [key: string]: THREE.Material } = {};
    const nonBloom = (obj: THREE.Object3D) => {
        if (bloomLayer.test(obj.layers) === false) {
            if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
                materials[obj.uuid] = obj.material;
                obj.material = darkMaterial;
            }
        }
    };
    const restoreMaterial = (obj: THREE.Object3D) => {
        if (materials[obj.uuid]) {
            if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
                obj.material = materials[obj.uuid];
                delete materials[obj.uuid];
            }
        }
    }
    return { nonBloom, restoreMaterial, mixMat };
}

const addGrayScale = (ctx: SceneContext, finalComposer: EffectComposer) => {
    const GrayscaleShader = {
        uniforms: {
            tDiffuse: { value: null },
            strength: { value: 1.0 }, // 0 = normal color, 1 = full B&W
        },
        vertexShader: /* glsl */`
                    varying vec2 vUv;
                    void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                    }
                `,
        fragmentShader: /* glsl */`
                    uniform sampler2D tDiffuse;
                    uniform float strength;
                    varying vec2 vUv;

                    void main() {
                    vec4 col = texture2D(tDiffuse, vUv);
                    // Rec.709 luminance (perceptual)
                    float luma = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
                    vec3 bw = vec3(luma);
                    gl_FragColor = vec4(mix(col.rgb, bw, strength), col.a);
                    }
                `
    };

    const grayPass = new ShaderPass(GrayscaleShader);
    grayPass.material.uniforms.strength.value = 1.0; // set to 0–1 as needed
    finalComposer.addPass(grayPass);
}

export interface ComposerSystem {
    init(): EffectComposer;
    setReady(): void;
    update(dt: number): void;
    dispose(): void;
}
export default function makePostEffectSystem(ctx: SceneContext): ComposerSystem {
    ctx.renderer.outputColorSpace = THREE.SRGBColorSpace;
    ctx.renderer.toneMapping = THREE.CineonToneMapping;
    ctx.renderer.toneMappingExposure = 0.8;

    const finalComposer = ctx.composers.finalComposer;
    const bloomComposer = ctx.composers.bloomComposer;

    const { nonBloom, restoreMaterial, mixMat } = addBloom(ctx, finalComposer, bloomComposer);

    const testComposer = new EffectComposer(ctx.renderer);
    testComposer.addPass(new RenderPass(ctx.scene, ctx.camera));

    // set resolution uniform to actual pixels
    const dpr = ctx.renderer.getPixelRatio?.() ?? 1;
    const size = ctx.renderer.getSize(new THREE.Vector2());
    //updateMatResolution(new THREE.Vector2(size.width * dpr, size.height * dpr));

    const overlayPassUniforms = {
        tDiffuse: { value: null },                  // previous pass
        uAlpha: { value: 1.0 },
        uColor: { value: new THREE.Color("#ffffff") },
        uResolution: { value: new THREE.Vector2(size.width * dpr, size.height * dpr) },
        uTime: { value: 0.0},
        uRadius: { value: 0.5},
        uStretch: { value: new THREE.Vector2(0.0)},
    }

    const OverlayPass = new ShaderPass({
        uniforms: overlayPassUniforms,
        vertexShader: `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = vec4(position,1.0); }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float uAlpha;
          uniform vec3 uColor;
          uniform vec2 uResolution;
          uniform float uTime;
          uniform float uRadius;
          uniform vec2 uStretch;
          varying vec2 vUv;

          // small helper: cheap 2D noise
        float hash(vec2 p) {
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345);
        return fract(p.x * p.y);
        }
        float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }


          void main(){
            // move uv origin to center
            float aspect = uResolution.x / uResolution.y;
            vec2 p = (vUv - 0.5) * 2.0;
            p.x *= aspect;
            float opacity = 1.0;
            float radius = uRadius;
            vec2 stretch = vec2(1.0 + uStretch.x, 1.0 + uStretch.y);
            float distance = length(p/stretch - vec2(0.0));
            float ang = atan(p.y, p.x);

            // --- Wavy edge distortion ---
            float wave1 = sin(ang * 5.0 + uTime * 2.0) * 0.02;
            float wave2 = sin(ang * 10.0 - uTime * 1.3) * 0.01;

            // add some organic noise along the edge (sample noise in polar-ish space)
            float n = noise(vec2(ang * 2.0, uTime * 0.4));
            float wobble = (n - 0.5) * 0.03;

            float warpedRadius = radius + wave1 + wave2;
            float edge = 1.5;
            float mask = smoothstep(warpedRadius, warpedRadius + edge, distance);
            //float mask = distance < warpedRadius ? 0.0: 1.0;

            vec3 color = uColor;
            opacity = mix(uAlpha, 1.0, mask);
            color = mix(vec3(0.2), uColor, mask);

            // if(distance < radius) {
            //     opacity = uAlpha;
            //     color = vec3(0.2);
            // }
            vec4 base = texture2D(tDiffuse, vUv);
            vec4 over = vec4(color, opacity);
            gl_FragColor = mix(base, over, over.a);
            }
        `
    });
    let loaded = false;
    let start = false;

    finalComposer.addPass(OverlayPass);

    // function* iterTexturesFromMaterial(mat: any) {
    //     // direct map slots on standard materials
    //     for (const k in mat) {
    //         const v = (mat as any)[k];
    //         if (v && v.isTexture) yield { label: k, tex: v, scope: 'material' };
    //     }
    //     // shader uniforms
    //     if (mat.uniforms) {
    //         for (const k in mat.uniforms) {
    //             const v = mat.uniforms[k]?.value;
    //             if (v && v.isTexture) yield { label: `uniform:${k}`, tex: v, scope: 'uniform' };
    //         }
    //     }
    // }

    // function listPendingTextures(scene: THREE.Scene, composer: any) {
    //     const pending: any[] = [];

    //     // scan scene materials
    //     scene.traverse((obj: any) => {
    //         const m = obj.material;
    //         const mats = Array.isArray(m) ? m : m ? [m] : [];
    //         mats.forEach((mat) => {
    //             for (const t of iterTexturesFromMaterial(mat)) {
    //                 const img: any = t.tex.image;
    //                 const ok = !!img && (img.width || img.videoWidth || img.naturalWidth);
    //                 if (!ok) pending.push({ from: obj.name || obj.type, ...t, texName: t.tex.name, uuid: t.tex.uuid });
    //             }
    //         });
    //     });

    //     // scan postprocessing passes
    //     if (composer && composer.passes) {
    //         composer.passes.forEach((pass: any) => {
    //             const mats = [pass.material, pass.copyMaterial, pass.fsQuad?.material].filter(Boolean);
    //             mats.forEach((mat: any) => {
    //                 for (const t of iterTexturesFromMaterial(mat)) {
    //                     const img: any = t.tex.image;
    //                     const ok = !!img && (img.width || img.videoWidth || img.naturalWidth);
    //                     if (!ok) pending.push({ from: pass.constructor?.name ?? 'Pass', ...t, texName: t.tex.name, uuid: t.tex.uuid });
    //                 }
    //             });
    //         });
    //     }

    //     console.table(pending.map(p => ({
    //         from: p.from,
    //         slot: p.label,
    //         texName: p.texName ?? '',
    //         uuid: p.uuid,
    //     })));

    //     return pending;
    // }
    // listPendingTextures(ctx.scene, finalComposer);

    // for debugging: warn if setting needsUpdate on a texture with no image
    (function patchNeedsUpdateLog() {
        const desc = Object.getOwnPropertyDescriptor(THREE.Texture.prototype, 'needsUpdate')!;
        Object.defineProperty(THREE.Texture.prototype, 'needsUpdate', {
            set(v: boolean) {
                // @ts-ignore
                if (v && (!this.image || !(this.image as any).width)) {
                    // @ts-ignore
                    console.warn('needsUpdate on texture with no image:', this.name || this.uuid, this);
                }
                // @ts-ignore
                desc.set!.call(this, v);
            },
            get() { /* @ts-ignore */ return desc.get!.call(this); }
        });
    })();

    // const progressBar = document.getElementById('progress-bar') as HTMLProgressElement;
    const progressLabel = document.getElementById('loading-label') as HTMLLabelElement;
    const progressBarContainer = document.getElementById('progress-bar-container') as HTMLDivElement;

    ctx.loaders.loaderManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        //console.log("items total: ", itemsTotal);
        const p = (itemsLoaded / itemsTotal) * 100;
        const capped = Math.min(p, 0.9);           // stop at 95% until ready
        // progressBar.value = capped * 100;
    }

    // Called by page.tsx once every asset is loaded and shaders are compiled.
    // (This used to be LoadingManager.onLoad + a fixed 6 s sleep; onLoad fired early, between sequential loads.)
    function setReady() {
        // progressBar.value = 100;
        progressLabel.textContent = 'Click to Explore';
        loaded = true;
        // progressBarContainer.style.display = 'none';
    }

    window.addEventListener('click', () => {
        if (loaded) {
            progressBarContainer.style.display = 'none';
            start = true;
        }
    })

    // reused every frame instead of allocating new objects
    const _size = new THREE.Vector2();
    const BLACK = new THREE.Color(0x000000);

    return {
        init() {
            return finalComposer;
        },
        setReady,
        update(dt: number) {
            const dpr = ctx.renderer.getPixelRatio?.() ?? 1;
            const size = ctx.renderer.getSize(_size);
            OverlayPass.uniforms.uResolution.value.set(size.width * dpr, size.height * dpr);
            OverlayPass.uniforms.uTime.value = dt;
            const deltaTime = ctx.clock.getDelta();
            // disable fog and set background to black for bloom pass.
            // Keep the same fog object and put it back afterwards: three.js re-checks a material's
            // shader program whenever scene.fog is a different object, so a new FogExp2 every frame
            // made every fogged material go through that check every frame.
            const fog = ctx.scene.fog;
            ctx.scene.fog = null;
            ctx.scene.background = BLACK;
            ctx.camera.layers.disable(FINAL_PASS_LAYER); // final-pass-only lights and procedural meshes are skipped in the bloom pass
            ctx.scene.traverse(nonBloom);
            // // ctx.camera.layers.set(ctx.state.postEffectState.bloom.layer); //this method does not work with occluders
            // three.js re-renders every shadow map on each render() call. The bloom pass draws
            // everything black or unlit, so it doesn't need fresh shadows: let the final pass update them.
            ctx.renderer.shadowMap.autoUpdate = false;
            bloomComposer.render();
            ctx.renderer.shadowMap.autoUpdate = true;
            ctx.scene.traverse(restoreMaterial);
            ctx.scene.fog = fog;

            mixMat.uniforms.bloomTexture.value = bloomComposer.readBuffer.texture;
            mixMat.uniforms.hasBloom.value = true;
            ctx.camera.layers.enable(FINAL_PASS_LAYER);
            if (loaded && OverlayPass.material.uniforms.uAlpha.value > 0.0) {
                OverlayPass.material.uniforms.uAlpha.value -= deltaTime * 0.1;
                if (OverlayPass.material.uniforms.uAlpha.value < 0.0) OverlayPass.material.uniforms.uAlpha.value = 0.0;
            }
            if(start) {
                OverlayPass.material.uniforms.uRadius.value < 0.9 && (OverlayPass.material.uniforms.uRadius.value += deltaTime * 0.4);
                OverlayPass.material.uniforms.uStretch.value.x < 1.5 && (OverlayPass.material.uniforms.uStretch.value.x += deltaTime * 0.6);
                OverlayPass.material.uniforms.uStretch.value.y < 0.1 && (OverlayPass.material.uniforms.uStretch.value.y += deltaTime * 0.4);
            }
            finalComposer.render();

            // testComposer.render();
        },
        dispose() { }
    }
}