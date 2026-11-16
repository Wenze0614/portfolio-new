import * as THREE from 'three';
import { FINAL_PASS_LAYER, SceneContext, System } from '../core/types';
import { SUN_DIRECTION } from './makeLightSystem';
import vertexShader from '../shaders/skyShaders/vertex.vert';
import fragmentShader from '../shaders/skyShaders/fragment.frag';

// Procedural sky dome (replaced a 5.4 MB HDR photo sky, which looked pasted-on once the fog could be
// turned off). Gradient from the fog colour at the horizon to a blue zenith, a sun disc and glow,
// drifting clouds; at night a dark zenith, stars and the moon. All in the shader (skyShaders), driven
// by the shared day & night value; nothing to download.

const RADIUS = 1000; // inside the camera's far plane (1500), outside the distant hills (makeSurroundingsSystem)

export function makeSkySystem(ctx: SceneContext): System {
    const geometry = new THREE.SphereGeometry(RADIUS, 48, 24);

    const material = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib.fog,
            {
                uTime: { value: 0 },
                uSunDir: { value: SUN_DIRECTION.clone().normalize() },
                uHorizon: { value: new THREE.Color() },     // follows scene.fog.color, set in update()
                uZenithDay: { value: new THREE.Color('#4f86c6') },
                uZenithNight: { value: new THREE.Color('#060a18') },
                uSunColor: { value: new THREE.Color(1.5, 1.35, 1.0) },
                uMoonColor: { value: new THREE.Color('#cfd8ff') },
            },
        ]),
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,  // seen from inside
        depthWrite: false,     // always behind everything
        // With the fog on, the chunk fogs the sky completely below ~30° and about half overhead, as it
        // did the HDR sky, so the default look is unchanged; the sky shows properly with the fog off.
        fog: true,
        // the fog chunk leaves the sky out of the fog-off distance haze: it has its own horizon colour
        defines: { SKY_DOME: 1 },
    });
    material.uniforms.uNight = ctx.state.dayNight.uNight; // shared, not cloned

    const sky = new THREE.Mesh(geometry, material);
    sky.name = 'sky';
    // Last of the opaque objects: the depth test then skips the (noise-heavy) sky shader wherever the
    // forest already covers the screen. Transparent objects (fireflies) still draw after it.
    sky.renderOrder = 1000;
    sky.frustumCulled = false;     // the camera is always inside it
    sky.layers.set(FINAL_PASS_LAYER); // nothing in it glows: skip the bloom pass

    return {
        init() {
            ctx.scene.add(sky);
        },
        update(elapsed: number) {
            material.uniforms.uTime.value = elapsed;
            const fog = ctx.scene.fog;
            if (fog) material.uniforms.uHorizon.value.copy(fog.color);
            // the dome is centred on the camera so its horizon stays level wherever you walk
            sky.position.copy(ctx.camera.position);
        },
        dispose() {
            ctx.scene.remove(sky);
            geometry.dispose();
            material.dispose();
        },
    };
}
