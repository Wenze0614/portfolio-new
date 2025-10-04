import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { SceneContext } from "../core/types";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

export default function makePostEffectSystem() {
    return {
        init(ctx: SceneContext) {
            // 2) composer
            const composer = new EffectComposer(ctx.renderer);
            composer.addPass(new RenderPass(ctx.scene, ctx.camera));

            // 3) grayscale shader (with strength control)
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
            composer.addPass(grayPass);
            return composer;
        },
        update(ctx: SceneContext) { },
        dispose() { }
    }
}