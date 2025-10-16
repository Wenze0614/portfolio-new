import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { SceneContext } from "../core/types";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import * as THREE from "three";
import { OutputPass, UnrealBloomPass } from "three/examples/jsm/Addons.js";
import vertexShader from '../shaders/bloomMixShaders/vertex.vert';
import fragmentShader from '../shaders/bloomMixShaders/fragment.frag';
import { add } from "three/tsl";


const addBloom = (ctx: SceneContext, finalComposer: EffectComposer, bloomComposer: EffectComposer) => {
    const bloom = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        ctx.state.postEffectState.bloom.strength,   // strength (overall intensity)
        ctx.state.postEffectState.bloom.radius,   // radius   (spread)
        ctx.state.postEffectState.bloom.threshold,   // threshold (only pixels brighter than this bloom)
    );
    bloomComposer.addPass(bloom);
    bloomComposer.renderToScreen = false;
    const mixPass = new ShaderPass(new THREE.ShaderMaterial({
        uniforms: {
            baseTexture: { value: null },
            bloomTexture: { value: bloomComposer.renderTarget2.texture },
            uStrength: {value: 0.3}
        },
        vertexShader,
        fragmentShader,
    }), "baseTexture");

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
            if (obj instanceof THREE.Mesh) {
                materials[obj.uuid] = obj.material;
                obj.material = darkMaterial;
            }
        } else {
            console.log("find bloom obj: ", obj);
            console.log("obj layers: ", obj.layers);
        }
    };
    const restoreMaterial = (obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh && materials[obj.uuid]) {
            obj.material = materials[obj.uuid];
            delete materials[obj.uuid];
        }
    }
    return { nonBloom, restoreMaterial };
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

export default function makePostEffectSystem(ctx: SceneContext) {
    ctx.renderer.outputColorSpace = THREE.SRGBColorSpace;
    ctx.renderer.toneMapping = THREE.CineonToneMapping;
    ctx.renderer.toneMappingExposure = 0.8;

    const finalComposer = ctx.composers.finalComposer;
    const bloomComposer = ctx.composers.bloomComposer;

    const { nonBloom, restoreMaterial } = addBloom(ctx, finalComposer, bloomComposer);

    const testComposer = new EffectComposer(ctx.renderer);
    testComposer.addPass(new RenderPass(ctx.scene, ctx.camera));

    return {
        init() {
            return finalComposer;
        },
        update() {
            ctx.scene.fog = null;
            ctx.scene.traverse(nonBloom);
            bloomComposer.render();
            ctx.scene.traverse(restoreMaterial);
            ctx.scene.fog = new THREE.FogExp2(0xDFE9F3, 0.00341);
            finalComposer.render();

            // testComposer.render();
        },
        dispose() { }
    }
}