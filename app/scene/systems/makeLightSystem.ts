import { LightSystem, SceneContext, System } from "../core/types";
import * as THREE from "three";

export default function makeLightSystem(): LightSystem {
    const sun1Color = new THREE.Color("#E9E4C5");
    const sun1 = new THREE.DirectionalLight(sun1Color, 4.3);
    sun1.position.set(10, 5, 1);
    sun1.target.position.set(0, 0, 0);
    sun1.name = 'yellow sun';
    sun1.castShadow = true;
    sun1.shadow.camera.left = -20;
    sun1.shadow.camera.right = 20;
    sun1.shadow.camera.top = 20;
    sun1.shadow.camera.bottom = -20;
    sun1.shadow.camera.near = 0.5;
    sun1.shadow.camera.far = 20;
    sun1.shadow.mapSize.set(2048, 2048);
    sun1.shadow.bias = -0.0005;
    sun1.shadow.normalBias = 0.02; // reduces acne when surfaces are coplanar-ish
    const sun1Helper = new THREE.DirectionalLightHelper(sun1, 1, 'red');
    // Add a helper temporarily
    // scene.add(new THREE.CameraHelper(sun1.shadow.camera));

    const sun2Color = new THREE.Color("#8FC6DC");
    const sun2 = new THREE.DirectionalLight(sun2Color, 3.14);
    sun2.position.set(-8.65, 3.41, 3.79,);
    sun2.name = 'blue sun';
    sun2.layers.set(1);
    const sun2Helper = new THREE.DirectionalLightHelper(sun2, 1, 'blue');

    return {
        init(ctx: SceneContext) {

            ctx.scene.add(sun1);
            ctx.scene.add(sun1Helper)

            ctx.scene.add(sun2);
            ctx.scene.add(sun2Helper)
        },
        update(ctx: SceneContext) { },
        dispose() { },
        getLights() {
            return [sun1, sun2];
        }
    }
}