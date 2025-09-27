import { SceneContext } from "../../core/types";
import * as THREE from "three";
import makeFoliageSystem from "./makeFoliageSystem";


export default function makeTreeSystem(ctx: SceneContext) {
    makeFoliageSystem(ctx);
    return {
        init(ctx: SceneContext) {
            ctx.loaders.gltf.load('/models/tree-trunk.glb', (gltf) => {
                const model = gltf.scene;
                model.position.set(-30, 0, 20);
                const treeTrunk = model.getObjectByName('treeTrunk');
                if (treeTrunk && treeTrunk instanceof THREE.Mesh) {
                    treeTrunk.castShadow = true;
                    treeTrunk.material = new THREE.MeshToonMaterial({
                        map: ctx.loaders.texture.load('/textures/trees/tree_trunk_baseColor.png'),
                    });
                    //ctx.scene.add(treeTrunk);
                }
            });
        },
        update(ctx: SceneContext) { },
        dispose() { }
    }
}