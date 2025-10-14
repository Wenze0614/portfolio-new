import { GUISystem, SceneContext } from "../core/types";
import * as THREE from "three";

export default function makePianoSystem(ctx: SceneContext) {

    return {
        init(meshs: THREE.Mesh[], guiSystem: GUISystem) {
            const pianoTexture = ctx.loaders.texture.load('/textures/piano_texture.jpg');
            pianoTexture.flipY = false;
            pianoTexture.colorSpace = THREE.SRGBColorSpace;
            pianoTexture.needsUpdate = true;

            ctx.loaders.gltf.load('/models/piano.glb', (gltf) => {
                const model = gltf.scene;
                console.log("piano gltf: ", gltf);
                const piano = model.getObjectByName('keyboard-ready-singleMat');
                if (piano && piano instanceof THREE.Mesh) {
                    piano.material = new THREE.MeshBasicMaterial({
                        map: pianoTexture,
                    })
                    piano.scale.set(1.2, 1.2, 1.2);
                    piano.position.set(5, 0.2, -10);
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