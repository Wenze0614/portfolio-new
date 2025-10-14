import { GUISystem, SceneContext } from "../core/types";
import * as THREE from "three";
import vertexShader from '../shaders/pianoShaders/vertex.vert';
import fragmentShader from '../shaders/pianoShaders/fragment.frag';

export default function makePianoSystem(ctx: SceneContext) {
    const pianoTexture = ctx.loaders.texture.load('/textures/piano_texture.jpg');
    pianoTexture.flipY = false;
    pianoTexture.colorSpace = THREE.SRGBColorSpace;
    pianoTexture.needsUpdate = true;

    const customUniforms = {
        pianoTexture: { value: pianoTexture },
    }
    const baseUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.lambert.uniforms);
    const pianoUniforms = THREE.UniformsUtils.merge([baseUniforms, customUniforms]);

    return {
        init(meshs: THREE.Mesh[], guiSystem: GUISystem) {

            ctx.loaders.gltf.load('/models/piano.glb', (gltf) => {
                const model = gltf.scene;
                console.log("piano gltf: ", gltf);
                const piano = model.getObjectByName('keyboard-ready-singleMat');
                if (piano && piano instanceof THREE.Mesh) {
                    piano.material = new THREE.ShaderMaterial({
                        uniforms:pianoUniforms,
                        vertexShader,
                        fragmentShader,
                        lights: true,
                        fog: true,
                    })
                    piano.castShadow = true;
                    piano.receiveShadow = true;
                    piano.scale.set(1.2, 1.2, 1.2);
                    piano.position.set(10, 0.2, 50);
                    piano.rotation.y = -Math.PI/2;
                    // piano.castShadow = true;
                    // piano.receiveShadow = true;
                    ctx.scene.add(piano);
                    meshs.push(piano);
                }else{
                    console.error("piano not found in piano.glb");
                }
                console.log("piano model loaded:", model);
                guiSystem.updateMeshes(meshs);
            });
        },
        update() { },
        dispose() { }
    }
}