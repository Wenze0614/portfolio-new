import { BloomPass, EffectComposer, ShaderPass, UnrealBloomPass } from "three/examples/jsm/Addons.js";
import { CONTROL_TYPE, LightSystem, SceneContext, System } from "../core/types";
import * as THREE from "three";

const SUN_DIRECTION = new THREE.Vector3(50, 80, 0)

function fitDirLightToCamera(light: THREE.DirectionalLight, camera: THREE.Camera, margin = 20) {
    const pos = camera.position;

    // 1. Position the sun relative to the camera
    light.position.copy(pos).add(SUN_DIRECTION.normalize());
    light.target.position.copy(pos);
    light.target.updateMatrixWorld();

    // 2. Define how wide/tall the shadow box is around the camera
    const halfW = 60; // half the width in world units
    const halfH = 60; // half the height in world units

    const cam = light.shadow.camera; // this is the light's ortho cam
    cam.left = -halfW;
    cam.right = halfW;
    cam.top = halfH;
    cam.bottom = -halfH;
    cam.near = -50;
    cam.far = 100;

    // 3. Tell Three to recompute projection
    cam.updateProjectionMatrix();
}

export default function makeLightSystem(ctx: SceneContext): LightSystem {
    const sun1Color = new THREE.Color("#E9E4C5");
    const sun1 = new THREE.DirectionalLight(sun1Color, 1.34);
    sun1.position.copy(SUN_DIRECTION);
    sun1.target.position.set(0, 0, 0);
    sun1.castShadow = true;
    sun1.name = 'yellow sun';
    sun1.shadow.camera.near = 1;
    sun1.shadow.camera.far = 150;
    sun1.shadow.camera.left = -150;
    sun1.shadow.camera.right = 150;
    sun1.shadow.camera.top = 150;
    sun1.shadow.camera.bottom = -150;
    // fitDirLightToCamera(sun1, ctx.camera);
    sun1.shadow.mapSize.set(2048, 2048);
    sun1.shadow.bias = -0.0005;
    sun1.shadow.normalBias = 0.02; // reduces acne when surfaces are coplanar-ish
    // const sun1Helper = new THREE.DirectionalLightHelper(sun1, 1, 'red');
    // Add a helper temporarily
    // const shadowCameraHelper = new THREE.CameraHelper(sun1.shadow.camera);
    // ctx.scene.add(shadowCameraHelper);

    // const sun2Color = new THREE.Color("#8FC6DC");
    // const sun2 = new THREE.DirectionalLight(sun2Color, 3.14);
    // sun2.position.set(-8.65, 3.41, 3.79,);
    // sun2.name = 'blue sun';
    // sun2.layers.set(1);
    // const sun2Helper = new THREE.DirectionalLightHelper(sun2, 1, 'blue');

    return {
        init(ctx: SceneContext) {

            ctx.scene.add(sun1);
            // ctx.scene.add(sun1Helper)

            // ctx.scene.add(sun2);
            // ctx.scene.add(sun2Helper)
        },
        update(ctx: SceneContext) {
            // if(ctx.state.controlState.controlType === CONTROL_TYPE.Walk) fitDirLightToCamera(sun1, ctx.camera);
            // sun1Helper.update();
            // shadowCameraHelper.update();
        },
        dispose() { },
        getLights() {
            return [sun1];
        },
        addComposer(composer: EffectComposer) {
            // const params = {
            //     density: 0.0001,
            //     maxDensity: 0.01,
            //     edgeStrength: 0.1,
            //     edgeRadius: 2,
            //     distanceAttenuation: 0.9,
            //     color: new THREE.Color("0xffffff"),
            //     raymarchSteps: 30,
            //     blur: true,
            //     gammaCorrection: true,
            // };

            // const godraysPass = new GodraysPass(sun1, ctx.camera, params);
            // godraysPass.renderToScreen = true;
            // composer.addPass(godraysPass);
        }
    }
}