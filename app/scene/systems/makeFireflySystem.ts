import { SceneContext } from "../core/types";
import * as THREE from "three";
import vertexShader from '../shaders/fireflyShaders/vertex.vert';
import fragmentShader from '../shaders/fireflyShaders/fragment.frag';

export default function makeFireflySystem(ctx: SceneContext) {
    const fireflyCount = 50;
    const fireflyGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(fireflyCount * 3);
    const scales = new Float32Array(fireflyCount);
    const fireflyMaterial = new THREE.ShaderMaterial({
        uniforms:{
            uPixelRatio: {value: Math.min(2, window.devicePixelRatio)},
            uSize: {value: 200.0},
            uTime: {value: 0},
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    return {
        init(center: THREE.Vector3, radius: number) {
            for (let i = 0; i < fireflyCount; i++) {
                const vi = i * 3;
                positions[vi + 0] = center.x + (Math.random() * 2 - 1) * radius;
                positions[vi + 1] = Math.random() * 5 + 0.3;
                positions[vi + 2] = center.z + (Math.random() * 2 - 1) * radius;
                scales[i] = Math.random() * 0.5 + 0.5;
            }
            fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            fireflyGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

            const fireflyPoints = new THREE.Points(fireflyGeometry, fireflyMaterial);
            fireflyPoints.frustumCulled = false;
            ctx.scene.add(fireflyPoints);
        },
        update(dt:number) {
            fireflyMaterial.uniforms.uTime.value = dt;
         },
        dispose() { }
    }
}