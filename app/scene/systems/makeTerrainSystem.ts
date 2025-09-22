import { SceneContext, System } from "../core/types";
import * as THREE from "three";
import makeGrassSystem from "./makeGrassSystem";

export default function makeTerrainSystem(): System {
    let grassSystem: System;
    return {
        init(ctx: SceneContext) {
            const terrainTexture = ctx.loaders.texture.load('/textures/terrain.png');
            ctx.loaders.gltf.load('/models/terrain.glb', (gltf) => {
                const model = gltf.scene;
                const terrain = model.getObjectByName('terrain');
                if (terrain && terrain instanceof THREE.Mesh) {
                    terrain.material = new THREE.MeshToonMaterial({
                        map: terrainTexture,
                    });
                    terrain.receiveShadow = true;
                }
                ctx.scene.add(model);
                console.log("model loaded:", model);
            }, undefined, (error) => {
                console.error('An error happened while loading the model:', error);
            });

            grassSystem = makeGrassSystem(terrainTexture);
            grassSystem.init(ctx);
        },
        update(ctx: SceneContext, dt: number) {
            if (grassSystem) {
                grassSystem.update(ctx, dt);
            }
        },
        dispose() { }
    }
}