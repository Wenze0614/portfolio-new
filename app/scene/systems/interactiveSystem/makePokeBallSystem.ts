import { SceneContext, System, TEXTURE_NAME } from "../../core/types";
import * as THREE from "three";
import vertexShader from '../../shaders/houseShaders/vertex.vert';
import fragmentShader from '../../shaders/houseShaders/fragment.frag';

export default function makePokeBallSystem(ctx: SceneContext):System{
    const pokeballTexture = ctx.state.getTexture(TEXTURE_NAME.POKEBALL_TEXTURE);
    const minecraftTexture = ctx.state.getTexture(TEXTURE_NAME.MINECRAFT_TEXTURE);
    const minecraftWoodTexture = ctx.state.getTexture(TEXTURE_NAME.MINECRAFT_WOOD_TEXTURE);
    const minecraftRoofTexture = ctx.state.getTexture(TEXTURE_NAME.MINECRAFT_ROOF_TEXTURE);

    return {
        init(ctx:SceneContext,meshs: THREE.Mesh[], guiSystem: any, opts: {position: THREE.Vector3}) {
            ctx.loaders.gltf.load('/models/pokeball.glb', (gltf) => {
                const model = gltf.scene;
                model.position.copy(opts.position);
                ctx.scene.add(model);
                const pokeball = model.getObjectByName('pokeball-low');
                const minecraft = model.getObjectByName('minecraft');
                const cabin = model.getObjectByName('cabin');
                // const cabinBody = model.getObjectByName("cabin-body");
                // const cabinRoof = model.getObjectByName("cabin-roof");
                if (pokeball && pokeball instanceof THREE.Mesh) {
                    // pokeball.scale.set(2, 2, 2);
                    // pokeball.position.copy(opts.position);
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
                    // pokeball.layers.enable(ctx.state.postEffectState.bloom.layer);
                    // ctx.scene.add(pokeball);
                    meshs.push(pokeball);
                    guiSystem.updateMeshes(meshs);
                }
                if( minecraft && minecraft instanceof THREE.Mesh){
                    const minecraftMat = new THREE.MeshBasicMaterial({
                        map: minecraftTexture,
                    });
                    minecraft.material = minecraftMat;
                    minecraft.name = "minecraft";
                }
                if( cabin && cabin instanceof THREE.Mesh){
                    const cabinBodyMat = new THREE.ShaderMaterial({
                        vertexShader,
                        fragmentShader,
                        uniforms: {
                            minecraftWoodTexture: { value: minecraftWoodTexture },
                        }
                    });
                    // cabinBody.castShadow = true;
                    // cabinBody.receiveShadow = true;
                    cabin.material = cabinBodyMat;
                    cabin.name = "cabin";
                }
                // if( cabinBody && cabinBody instanceof THREE.Mesh){
                //     const cabinBodyMat = new THREE.ShaderMaterial({
                //         vertexShader,
                //         fragmentShader,
                //         uniforms: {
                //             minecraftWoodTexture: { value: minecraftWoodTexture },
                //         }
                //     });
                //     // cabinBody.castShadow = true;
                //     // cabinBody.receiveShadow = true;
                //     cabinBody.material = cabinBodyMat;
                //     cabinBody.name = "cabinBody";
                // }
                // if( cabinRoof && cabinRoof instanceof THREE.Mesh){
                //     const cabinRoofMat = new THREE.MeshStandardMaterial({
                //         map: minecraftRoofTexture,
                //     });
                //     cabinRoof.castShadow = true;
                //     cabinRoof.receiveShadow = true;
                //     cabinRoof.material = cabinRoofMat;
                //     cabinRoof.name = "cabinRoof";
                // }
                console.log("pokeball model loaded:", model);
            });
        },
        update( dt: number) { },
        dispose() { }
    }
}