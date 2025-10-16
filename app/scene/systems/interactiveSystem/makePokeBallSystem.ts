import { SceneContext, System } from "../../core/types";
import * as THREE from "three";
export default function makePokeBallSystem(ctx: SceneContext):System{
    const pokeballTexture = ctx.loaders.texture.load('/textures/pokeball_BaseColor.png');
    pokeballTexture.flipY = false;
    pokeballTexture.colorSpace = THREE.SRGBColorSpace;

    return {
        init(ctx:SceneContext,meshs: THREE.Mesh[], guiSystem: any, opts: {position: THREE.Vector3}) {
            ctx.loaders.gltf.load('/models/pokeball.glb', (gltf) => {
                const model = gltf.scene;
                const pokeball = model.getObjectByName('pokeball-low');
                if (pokeball && pokeball instanceof THREE.Mesh) {
                    pokeball.scale.set(2, 2, 2);
                    pokeball.position.copy(opts.position);
                    // pokeball.rotateY(1);
                    pokeball.castShadow = true;
                    const pokeballMat = new THREE.MeshBasicMaterial({
                        map: pokeballTexture,
                    });
                    // pokeballMat.onBeforeCompile = (shader) => {
                    //     modifyShader(shader);
                    // }
                    pokeball.material = pokeballMat;
                    pokeball.name = "pokeball";
                    pokeball.layers.enable(ctx.state.postEffectState.bloom.layer);
                    ctx.scene.add(pokeball);
                    meshs.push(pokeball);
                    guiSystem.updateMeshes(meshs);
                }
            });
        },
        update(ctx: SceneContext, dt: number) { },
        dispose() { }
    }
}