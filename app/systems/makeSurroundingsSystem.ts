import * as THREE from "three";
import { FINAL_PASS_LAYER, SceneContext, System, TEXTURE_NAME } from "../core/types";
import ringVertex from "../shaders/surroundingsShaders/ringVertex.vert";
import ringFragment from "../shaders/surroundingsShaders/ringFragment.frag";
import groundVertex from "../shaders/surroundingsShaders/groundVertex.vert";
import groundFragment from "../shaders/surroundingsShaders/groundFragment.frag";

// What lies beyond the map: open ground past the terrain's edge, then rings of distant scenery
// (two tree lines, hills, mountains), all procedural. With the fog on (the default) it's fogged out
// like anything that far away; with the fog off (G) the fog chunk's distance haze fades each ring
// a little more into the horizon, so the layers read as depth. Fixed around the map's centre, so
// walking towards an edge brings that side's tree line closer.
//
// 5 draw calls, final pass only (nothing here glows).

const GROUND_INNER = 99;  // just inside the terrain's edge (±100), so there's no gap at its middle
const GROUND_OUTER = 950; // out under the mountains
const RING_FOOT = -5;     // rings start below the ground so their foot never shows

interface RingSpec {
    radius: number;
    base: number; amp: number; freq: number; ridge: number;
    crowns: number; crownAmp: number;
    seed: number;
    day: string; night: string;
}

// nearest first; heights in world units (the camera is ~2.2 up)
const RINGS: RingSpec[] = [
    { radius: 150, base: 9, amp: 5, freq: 2.5, ridge: 0, crowns: 300, crownAmp: 3.5, seed: 1.3, day: "#365634", night: "#0a1115" },  // tree line
    { radius: 240, base: 13, amp: 10, freq: 2.0, ridge: 0, crowns: 380, crownAmp: 4.5, seed: 7.1, day: "#3c5d40", night: "#0b1318" }, // tree line behind it
    { radius: 420, base: 18, amp: 55, freq: 1.6, ridge: 0.15, crowns: 520, crownAmp: 4, seed: 3.9, day: "#486b53", night: "#0d161c" }, // wooded hills
    { radius: 700, base: 30, amp: 170, freq: 1.3, ridge: 0.85, crowns: 0, crownAmp: 0, seed: 11.4, day: "#6a7f99", night: "#121a28" }, // mountains
];

export default function makeSurroundingsSystem(ctx: SceneContext): System {
    const group = new THREE.Group();
    group.name = "surroundings";
    const disposables: { dispose(): void }[] = [];

    // --- ground past the terrain ---
    // Its own copy of the grass texture, set to repeat (the terrain samples it in 0..1 per tile).
    // Shares the image, so no extra download.
    const grassTexture = ctx.state.getTexture(TEXTURE_NAME.GRASS_TEXTURE).clone();
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.needsUpdate = true;
    const groundGeometry = new THREE.RingGeometry(GROUND_INNER, GROUND_OUTER, 128, 1).rotateX(-Math.PI / 2);
    const groundMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { grassTexture: { value: null } }]),
        vertexShader: groundVertex,
        fragmentShader: groundFragment,
        fog: true,
    });
    groundMaterial.uniforms.grassTexture.value = grassTexture; // after merge: merge would clone the texture again
    // shared, not cloned: the night chunk reads these (the street lamps are too far to reach it)
    groundMaterial.uniforms.uNight = ctx.state.dayNight.uNight;
    groundMaterial.uniforms.uLampLevels = ctx.state.dayNight.uLampLevels;
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.name = "outerGround";
    ground.position.y = -0.03; // just under the terrain (which starts at 0) where they overlap
    group.add(ground);
    disposables.push(grassTexture, groundGeometry, groundMaterial);

    // --- rings of distant scenery ---
    for (const spec of RINGS) {
        // tall enough for the tallest silhouette: the noise octaves' weights add up to ~1.03, not 1
        const height = spec.base + spec.amp * 1.04 + spec.crownAmp - RING_FOOT + 1;
        const geometry = new THREE.CylinderGeometry(spec.radius, spec.radius, height, 128, 1, true)
            .translate(0, RING_FOOT + height / 2, 0);
        const material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
                uBase: { value: spec.base },
                uAmp: { value: spec.amp },
                uFreq: { value: spec.freq },
                uRidge: { value: spec.ridge },
                uCrowns: { value: spec.crowns },
                uCrownAmp: { value: spec.crownAmp },
                uSeed: { value: spec.seed },
                uColorDay: { value: new THREE.Color(spec.day) },
                uColorNight: { value: new THREE.Color(spec.night) },
            }]),
            vertexShader: ringVertex,
            fragmentShader: ringFragment,
            side: THREE.BackSide, // seen from inside
            fog: true,
        });
        material.uniforms.uNight = ctx.state.dayNight.uNight;
        const ring = new THREE.Mesh(geometry, material);
        ring.name = `surroundingsRing${spec.radius}`;
        group.add(ring);
        disposables.push(geometry, material);
    }

    group.traverse((o) => o.layers.set(FINAL_PASS_LAYER)); // skip the bloom pass

    return {
        init() {
            ctx.scene.add(group);
        },
        update() { },
        dispose() {
            ctx.scene.remove(group);
            for (const d of disposables) d.dispose();
        },
    };
}
