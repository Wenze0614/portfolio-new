import { BloomPass, EffectComposer, ShaderPass, UnrealBloomPass } from "three/examples/jsm/Addons.js";
import { CONTROL_TYPE, LightSystem, SceneContext, System } from "../core/types";
import * as THREE from "three";
import { normalize } from "three/src/math/MathUtils.js";
import { drawIndex } from "three/tsl";

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
    const sun1Color = new THREE.Color("#f0edd8");
    const sun1 = new THREE.DirectionalLight(sun1Color, 1.34);
    sun1.position.copy(SUN_DIRECTION);
    sun1.target.position.set(0, 0, 0);
    sun1.castShadow = true;
    sun1.name = 'yellow sun';
    sun1.shadow.camera.near = 1;
    sun1.shadow.camera.far = 150;
    // Shadow box ±90 (was ±150): the player is clamped to ±50 and the fog hides the ground beyond
    // ~35-50 units, so the box edge stays out of sight while the same 2048² map covers 2.8× less
    // area: ~0.09 units per shadow-map pixel instead of ~0.15 (sharper forest shadows, same cost).
    sun1.shadow.camera.left = -90;
    sun1.shadow.camera.right = 90;
    sun1.shadow.camera.top = 90;
    sun1.shadow.camera.bottom = -90;
    // fitDirLightToCamera(sun1, ctx.camera);
    sun1.shadow.mapSize.set(2048, 2048);
    sun1.shadow.bias = -0.0005;
    sun1.shadow.normalBias = 0.02; // reduces acne when surfaces are coplanar-ish
    sun1.layers.enable(ctx.state.postEffectState.bloom.layer);

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

    const sun2Color = new THREE.Color("#f0edd8");
    const sun2 = new THREE.DirectionalLight(sun2Color, 3.14);
    sun2.position.set(20, 5, -3);
    sun2.target.position.set(-21, 0, -25);
    // No shadow: with far = 20 its shadow box ends ~27 units short of the cabin it points at, and the
    // custom shaders only read the first directional shadow (sun1), so this shadow was never visible.
    // (To give the cabin sun2 shadows instead, set castShadow = true and shadow.camera.far ≈ 60.)
    sun2.castShadow = false;
    sun2.name = 'yellow sun 2';
    sun2.shadow.camera.near = 1;
    sun2.shadow.camera.far = 20;
    sun2.shadow.camera.left = -30;
    sun2.shadow.camera.right = 30;
    sun2.shadow.camera.top = 20;
    sun2.shadow.camera.bottom = -20;
    // fitDirLightToCamera(sun1, ctx.camera);
    sun2.shadow.mapSize.set(2048, 2048);
    sun2.shadow.bias = -0.0005;
    sun2.shadow.normalBias = 0.02; // reduces acne when surfaces are coplanar-ish
    sun2.layers.enable(ctx.state.postEffectState.bloom.layer);
    sun2.layers.set(3);

    const sun3Color = new THREE.Color("#f8fcf9");
    const sun3 = new THREE.DirectionalLight(sun3Color, 3.14);
    sun3.position.set(-24, 9, 5);
    sun3.target.position.set(-21, 0, -25);
    sun3.castShadow = false;
    sun3.name = 'blue sun 3';
    sun3.layers.set(3);

    // const pointLight  = new THREE.PointLight(0xffffff, 10, 10, 2);
    // const forward = new THREE.Vector3();
    // ctx.camera.getWorldDirection(forward);
    // pointLight.position.copy(ctx.camera.position).add(forward.multiplyScalar(1)); ;
    // pointLight.castShadow = true;

    const pointLight  = new THREE.PointLight("#ffe0ce", 6, 10, 1);
    pointLight.name = 'point light';
    pointLight.position.set(-28, 3, -35)
    pointLight.castShadow = true;
    // A point-light shadow is a cube: 6 extra scene renders. Nothing that casts a visible shadow moves
    // within this lamp's 10-unit range (the CD only spins in place), so render it once after the scene
    // has loaded (refreshStaticShadows) instead of every frame.
    // 1024 per face (was 2048): looks the same through the soft shadow filter, ~64 MB of GPU memory instead of ~256 MB.
    pointLight.shadow.autoUpdate = false;
    pointLight.shadow.mapSize.set(1024, 1024);
    pointLight.shadow.bias = -0.0005;
    pointLight.shadow.normalBias = 0.02;
    ctx.scene.add(pointLight);
    // const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.5);
    // ctx.scene.add(pointLightHelper);
    pointLight.layers.enable(ctx.state.postEffectState.bloom.layer);

    const rotomPointLight = new THREE.PointLight("#baf9f6", 5, 3, 0.5);
    rotomPointLight.name = 'rotom light';
    rotomPointLight.position.set(-33.8, 4.4, -25)
    rotomPointLight.castShadow = false;
    ctx.scene.add(rotomPointLight);
    // const rotomPointLightHelper = new THREE.PointLightHelper(rotomPointLight, 0.5);
    // ctx.scene.add(rotomPointLightHelper);
    rotomPointLight.layers.enable(ctx.state.postEffectState.bloom.layer);


    return {
        init(ctx: SceneContext) {

            ctx.scene.add(sun1);
            ctx.scene.add(sun2);
            // ctx.scene.add(pointLight);
            ctx.scene.add(sun3);
            // ctx.scene.add(sun1Helper)

            // ctx.scene.add(sun2);
            // ctx.scene.add(sun2Helper)
        },
        update(dt: number) {
            // if(ctx.state.controlState.controlType === CONTROL_TYPE.Walk) fitDirLightToCamera(sun1, ctx.camera);
            // sun1Helper.update();
            // shadowCameraHelper.update();

            // move point light with camera
            // const dir = new THREE.Vector3();
            // ctx.camera.getWorldDirection(dir);
            // pointLight.position.copy(ctx.camera.position).add(dir.multiplyScalar(1));
        },
        dispose() { },
        getLights() {
            return [sun1, sun2, sun3, pointLight];
        },
        refreshStaticShadows() {
            pointLight.shadow.needsUpdate = true; // re-render the lamp's shadow on the next frame
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