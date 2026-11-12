import * as THREE from "three";
import { SceneContext, System } from "../core/types";
import { isTouchDevice } from "../utils/isTouchDevice";
import vertexShader from "../shaders/forestFireflyShaders/vertex.vert";
import fragmentShader from "../shaders/forestFireflyShaders/fragment.frag";

// Night-only fireflies through the whole forest. One Points draw call; the shader wraps them around
// the camera (see vertex.vert), so a few hundred cover everywhere you can walk. They fade in and out
// with ctx.state.dayNight.uNight and are hidden entirely by day, so daytime costs nothing.

const AREA = 40;           // side of the square of fireflies kept around the player (world units)
// The shader bobs them ±0.35 vertically and the terrain rises to 0.4 (heightScale), so the lowest
// stays above ground. Below it they'd still glow: the bloom pass doesn't draw the terrain to hide them.
const MIN_HEIGHT = 0.9;
const MAX_HEIGHT = 3.6;
// Fireflies wrap around the camera, so without a no-fly zone they'd float around inside the cabin
// when you walk in. The zone is the cabin wall mesh's footprint, measured at init (the cabin is
// rotated, so it's a rotated rectangle rather than an axis-aligned box).
const CABIN_MESH_NAME = "houseWall";

/** The x/z footprint of a mesh's bounding box in world space, as a rotated rectangle. */
function footprintOf(mesh: THREE.Mesh) {
    mesh.updateWorldMatrix(true, false);
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox!;
    // one horizontal side of the box: the mesh's local x axis in world space, flattened
    const axis3 = new THREE.Vector3().setFromMatrixColumn(mesh.matrixWorld, 0);
    const axis = new THREE.Vector2(axis3.x, axis3.z).normalize();
    const perp = new THREE.Vector2(-axis.y, axis.x);
    const center3 = box.getCenter(new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);
    const center = new THREE.Vector2(center3.x, center3.z);
    const half = new THREE.Vector2();
    const corner = new THREE.Vector3();
    const d = new THREE.Vector2();
    for (let i = 0; i < 8; i++) {
        corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z)
            .applyMatrix4(mesh.matrixWorld);
        d.set(corner.x - center.x, corner.z - center.y);
        half.x = Math.max(half.x, Math.abs(d.dot(axis)));
        half.y = Math.max(half.y, Math.abs(d.dot(perp)));
    }
    return { center, axis, half };
}

export default function makeForestFireflySystem(ctx: SceneContext): System {
    const count = isTouchDevice() ? 220 : 450;

    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = Math.random() * AREA;
        positions[i * 3 + 1] = MIN_HEIGHT + Math.random() * (MAX_HEIGHT - MIN_HEIGHT);
        positions[i * 3 + 2] = Math.random() * AREA;
        for (let k = 0; k < 4; k++) seeds[i * 4 + k] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uNight: ctx.state.dayNight.uNight, // shared object, not a copy
            uPixelRatio: { value: ctx.renderer.getPixelRatio() },
            uSize: { value: 150 },
            uArea: { value: AREA },
            uCenter: { value: new THREE.Vector3() },
            // set in init(); until then (or if the cabin isn't found) a zone so far away it never applies
            uNoFlyCenter: { value: new THREE.Vector2(1e6, 1e6) },
            uNoFlyAxis: { value: new THREE.Vector2(1, 0) },
            uNoFlyHalf: { value: new THREE.Vector2(0, 0) },
            // above 1.0 on purpose: brighter cores feed the bloom pass more glow
            uColor: { value: new THREE.Color(1.5, 1.8, 0.75) },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,          // glows don't hide each other
        blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.name = "forestFireflies";
    points.frustumCulled = false;   // positions are moved in the shader; the CPU bounds mean nothing
    // Drawn (at zero size, uNight = 0) for the first few frames after loading, then hidden by day.
    // That compiles its shader during the intro instead of on the first switch to night. compileAsync
    // at boot isn't enough: it compiles for the screen, but the composer draws into render targets,
    // which use a different shader variant.
    let warmupFrames = 3;
    // also on the bloom layer, so they keep their material in the bloom pass and glow
    points.layers.enable(ctx.state.postEffectState.bloom.layer);

    return {
        init() {
            ctx.scene.add(points);
            // the cabin is loaded before this system is created (page.tsx awaits the house first)
            const cabin = ctx.scene.getObjectByName(CABIN_MESH_NAME);
            if (cabin instanceof THREE.Mesh) {
                const { center, axis, half } = footprintOf(cabin);
                material.uniforms.uNoFlyCenter.value.copy(center);
                material.uniforms.uNoFlyAxis.value.copy(axis);
                material.uniforms.uNoFlyHalf.value.copy(half);
            } else {
                console.warn(`forest fireflies: "${CABIN_MESH_NAME}" not found, so no cabin no-fly zone`);
            }
        },
        update(elapsed: number) {
            points.visible = warmupFrames > 0 || ctx.state.dayNight.uNight.value > 0.001;
            if (warmupFrames > 0) warmupFrames--;
            if (!points.visible) return;
            material.uniforms.uTime.value = elapsed;
            material.uniforms.uCenter.value.copy(ctx.camera.position);
            material.uniforms.uPixelRatio.value = ctx.renderer.getPixelRatio();
        },
        dispose() {
            ctx.scene.remove(points);
            geometry.dispose();
            material.dispose();
        },
    };
}
