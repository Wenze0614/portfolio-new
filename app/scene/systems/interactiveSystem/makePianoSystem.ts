import { GUISystem, SceneContext, System } from "../../core/types";
import * as THREE from "three";
import vertexShader from '../../shaders/pianoShaders/vertex.vert';
import fragmentShader from '../../shaders/pianoShaders/fragment.frag';
import { AudioSystem } from "../makeAudioSystem";

export default function makePianoSystem(ctx: SceneContext, audioSys:AudioSystem): System {
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
        init(ctx: SceneContext, meshs: THREE.Mesh[], guiSystem: GUISystem, opts: { position: THREE.Vector3 }) {
            ctx.loaders.gltf.load('/models/piano.glb', (gltf) => {
                const model = gltf.scene;
                console.log("piano gltf: ", gltf);
                const piano = model.getObjectByName('keyboard-ready-singleMat');
                if (piano && piano instanceof THREE.Mesh) {
                    piano.material = new THREE.ShaderMaterial({
                        uniforms: pianoUniforms,
                        vertexShader,
                        fragmentShader,
                        lights: true,
                    })
                    // piano.material = new THREE.MeshBasicMaterial({
                    //     map: pianoTexture,
                    // })
                    piano.castShadow = true;
                    piano.receiveShadow = true;
                    piano.scale.set(1.2, 1.2, 1.2);
                    piano.position.copy(opts.position);
                    piano.rotation.y = -Math.PI / 2;
                    piano.layers.enable(ctx.state.postEffectState.bloom.layer);
                    // piano.castShadow = true;
                    // piano.receiveShadow = true;
                    ctx.scene.add(piano);
                    meshs.push(piano);
                    audioSys.playPiano("lune", piano);
                } else {
                    console.error("piano not found in piano.glb");
                }
                console.log("piano model loaded:", model);
                guiSystem.updateMeshes(meshs);
            });
        },
        update(dt:number) { },
        dispose() { }
    }
}