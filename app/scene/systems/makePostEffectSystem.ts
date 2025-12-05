import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { SceneContext } from "../core/types";
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

    const OverlayPass = new ShaderPass({
        uniforms: {
            tDiffuse: { value: null },                  // previous pass
            uAlpha: { value: 1.0 },
            uColor: { value: new THREE.Color(0x000000) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = vec4(position,1.0); }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float uAlpha;
          uniform vec3 uColor;
          varying vec2 vUv;
          void main(){
            vec4 base = texture2D(tDiffuse, vUv);
            vec4 over = vec4(uColor, uAlpha);
            gl_FragColor = mix(base, over, over.a);
          }
        `
    });
    let loaded = false;

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

    ctx.loaders.loaderManager.onLoad = () => {
        //OverlayPass.material.uniforms.uAlpha.value = 0.0;
        loaded = true;
    }

    return {
        init() {
            return finalComposer;
        },
        update(dt: number) {
            const deltaTime = ctx.clock.getDelta();
            // disable fog and set background to black for bloom pass
            ctx.scene.fog = null;
            ctx.scene.background = new THREE.Color(0x000000);
            ctx.camera.layers.disable(3); //disable unwanter occluder for bloom
            ctx.scene.traverse(nonBloom);
            // // ctx.camera.layers.set(ctx.state.postEffectState.bloom.layer); //this method does not work with occluders
            bloomComposer.render();
            ctx.scene.traverse(restoreMaterial);
            ctx.scene.fog = new THREE.FogExp2(0xDFE9F3, 0.00341);

            mixMat.uniforms.bloomTexture.value = bloomComposer.readBuffer.texture;
            mixMat.uniforms.hasBloom.value = true;
            ctx.camera.layers.enable(3);
            if(loaded && OverlayPass.material.uniforms.uAlpha.value > 0.0) {
                OverlayPass.material.uniforms.uAlpha.value -= deltaTime * 0.1;
                if(OverlayPass.material.uniforms.uAlpha.value < 0.0) OverlayPass.material.uniforms.uAlpha.value = 0.0;
            }
            finalComposer.render();

            // testComposer.render();
        },
        dispose() { }
    }
}