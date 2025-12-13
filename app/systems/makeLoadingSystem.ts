import * as THREE from "three";
import { SceneContext, System } from "../core/types";
export function makeLoadingSystem(ctx: SceneContext): System {
    const plane = new THREE.PlaneGeometry(2, 2, 1, 1);
    const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
            uAlpha: { value: 1.0 },
        },
        vertexShader: `
        void main(){
            gl_Position = vec4(position, 1.0);}
        `,
        fragmentShader: `
        uniform float uAlpha;
        void main(){
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);}
        `,
    })
    const overlay = new THREE.Mesh(plane, mat);
    overlay.frustumCulled = false;
    overlay.renderOrder = 9999;
    overlay.name = "loadingOverlay";
    return {
        init() {
            ctx.scene.add(overlay);
        },
        update(dt: number) {
            mat.uniforms.uAlpha.value = dt;
        },
        dispose() {
            // No-op
        }
    }
}