import { SceneContext, System, TEXTURE_NAME } from "../../core/types";
import * as THREE from "three";
import vertexShader from '../../shaders/houseShaders/vertex.vert';
import fragmentShader from '../../shaders/houseShaders/fragment.frag';
import vertexDepth from '../../shaders/houseShaders/vertexDepth.vert';

export default function makePokeBallSystem(ctx: SceneContext): System {
    const pokeballTexture = ctx.state.getTexture(TEXTURE_NAME.POKEBALL_TEXTURE);
    const minecraftTexture = ctx.state.getTexture(TEXTURE_NAME.MINECRAFT_TEXTURE);
    const minecraftWoodTexture = ctx.state.getTexture(TEXTURE_NAME.MINECRAFT_WOOD_TEXTURE);
    const minecraftRoofTexture = ctx.state.getTexture(TEXTURE_NAME.MINECRAFT_ROOF_TEXTURE);
    const houseTexture = ctx.state.getTexture(TEXTURE_NAME.HOUSE_TEXTURE);

    const baseUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.lambert.uniforms);
    const customHouseUniform = {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(1, 1) },
        minecraftWoodTexture: { value: minecraftWoodTexture },
    }
    const houseUniforms = THREE.UniformsUtils.merge([baseUniforms, customHouseUniform]);

    return {
        init(ctx: SceneContext, meshs: THREE.Mesh[], guiSystem: any, opts: { position: THREE.Vector3 }) {
            ctx.loaders.gltf.load('/models/house-v9.glb', (gltf)=> {
                const model = gltf.scene;
                // model.position.copy(opts.position);
                // model.position.y += 0.5;
                model.position.set(-35, -0.3, -27);
                model.scale.set(2,2,2);
                model.rotateY(-Math.PI/6);
                ctx.scene.add(model);
                const house = model.getObjectByName('house');
                const fence = model.getObjectByName('fence');
                if( house && house instanceof THREE.Mesh){
                    house.material = new THREE.MeshBasicMaterial({
                        map: houseTexture,
                    })
                    house.castShadow = true;
                }
                // if( fence && fence instanceof THREE.Mesh){
                //     fence.material = new THREE.MeshBasicMaterial({
                //         map: houseTexture,
                //     })
                //     fence.castShadow = true;
                // }
                
            })
            // ctx.loaders.gltf.load('/models/pokeball.glb', (gltf) => {
            //     const model = gltf.scene;
            //     model.position.copy(opts.position);
            //     ctx.scene.add(model);
            //     const pokeball = model.getObjectByName('pokeball-low');
            //     const minecraft = model.getObjectByName('minecraft');
            //     const cabin = model.getObjectByName('cabin');
            //     // const cabinBody = model.getObjectByName("cabin-body");
            //     // const cabinRoof = model.getObjectByName("cabin-roof");
            //     if (pokeball && pokeball instanceof THREE.Mesh) {
            //         // pokeball.scale.set(2, 2, 2);
            //         // pokeball.position.copy(opts.position);
            //         // pokeball.rotateY(1);
            //         pokeball.castShadow = true;
            //         const pokeballMat = new THREE.MeshBasicMaterial({
            //             map: pokeballTexture,
            //         });
            //         // pokeballMat.onBeforeCompile = (shader) => {
            //         //     modifyShader(shader);
            //         // }
            //         pokeball.material = pokeballMat;
            //         pokeball.name = "pokeball";
            //         // pokeball.layers.enable(ctx.state.postEffectState.bloom.layer);
            //         // ctx.scene.add(pokeball);
            //         meshs.push(pokeball);
            //         guiSystem.updateMeshes(meshs);
            //     }
            //     if (minecraft && minecraft instanceof THREE.Mesh) {
            //         const minecraftMat = new THREE.MeshBasicMaterial({
            //             map: minecraftTexture,
            //         });
            //         minecraft.material = minecraftMat;
            //         minecraft.name = "minecraft";
            //     }
            //     if (cabin && cabin instanceof THREE.Mesh) {
            //         const cabinBodyMat = new THREE.ShaderMaterial({
            //             vertexShader,
            //             fragmentShader,
            //             uniforms: houseUniforms,
            //             lights: true,
            //         });
            //         // const cabinBodyMat = new THREE.MeshStandardMaterial({
            //         //     map: minecraftWoodTexture,
            //         // });

            //         // cabinBody.castShadow = true;
            //         // cabinBody.receiveShadow = true;
            //         cabin.material = cabinBodyMat;
            //         // cabin.geometry.computeVertexNormals();
            //         cabin.castShadow = true;
            //         cabin.receiveShadow = true;
            //         cabin.name = "cabin";
            //         cabin.customDepthMaterial = new THREE.ShaderMaterial({
            //             uniforms: houseUniforms,
            //             vertexShader: vertexDepth,
            //             fragmentShader: `
            //             varying vec2 vUv;
            //             varying vec3 vNormalWS;
            //               void main() {
            //                 gl_FragColor = vec4( vec3( gl_FragCoord.z ), 1.0 );
            //               }
            //             `,
            //         });
            //         cabin.rotateY(Math.PI / 6);
            //         // const direcitonalLight = new THREE.DirectionalLight(0xffffff, 1);
            //         // direcitonalLight.position.copy(cabin.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(5,3,5)));
            //         // direcitonalLight.castShadow = true;
            //         // direcitonalLight.shadow.mapSize.width = 512;
            //         // direcitonalLight.shadow.mapSize.height = 512;
            //         // direcitonalLight.shadow.camera.near = 0.5;
            //         // direcitonalLight.shadow.camera.far = 10;
            //         // direcitonalLight.shadow.camera.left = -10;
            //         // direcitonalLight.shadow.camera.right = 10;
            //         // direcitonalLight.shadow.camera.top = 10;
            //         // direcitonalLight.shadow.camera.bottom = -10;
            //         // ctx.scene.add(direcitonalLight);
            //     }
            //     // if( cabinBody && cabinBody instanceof THREE.Mesh){
            //     //     const cabinBodyMat = new THREE.ShaderMaterial({
            //     //         vertexShader,
            //     //         fragmentShader,
            //     //         uniforms: {
            //     //             minecraftWoodTexture: { value: minecraftWoodTexture },
            //     //         }
            //     //     });
            //     //     // cabinBody.castShadow = true;
            //     //     // cabinBody.receiveShadow = true;
            //     //     cabinBody.material = cabinBodyMat;
            //     //     cabinBody.name = "cabinBody";
            //     // }
            //     // if( cabinRoof && cabinRoof instanceof THREE.Mesh){
            //     //     const cabinRoofMat = new THREE.MeshStandardMaterial({
            //     //         map: minecraftRoofTexture,
            //     //     });
            //     //     cabinRoof.castShadow = true;
            //     //     cabinRoof.receiveShadow = true;
            //     //     cabinRoof.material = cabinRoofMat;
            //     //     cabinRoof.name = "cabinRoof";
            //     // }
            //     console.log("pokeball model loaded:", model);
            // });
        },
        update(dt: number) { },
        dispose() { }
    }
}