import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SceneContext, System } from "../core/types";
import { STREET_LAMPS } from "../data/streetLamps";
import vertexShader from "../shaders/streetLampShaders/vertex.vert";
import fragmentShader from "../shaders/streetLampShaders/fragment.frag";

// Street lamps along the path (positions in data/streetLamps.ts). They switch on one by one as
// night falls, each with a short flicker, and off again at dawn.
//
// Built from primitives and merged into two meshes, iron and glass: two draw calls for all of them.
// The glass gets its brightness from ctx.state.dayNight.uLampLevels, which this system writes and the
// ground and tree shaders also read for the lamps' warm light pools (see registerNightShaderChunk).

// The order lamps come on in as uNight rises (indexes into STREET_LAMPS). Mixed up so they don't
// light up in a line along the path; each comes on at 0.3 + 0.07 × its place in this list.
const SWITCH_ORDER = [3, 0, 6, 1, 5, 7, 2, 4];
const FIRST_SWITCH = 0.3;
const SWITCH_STEP = 0.07;
const FADE_OUT_SECONDS = 0.3;

/** Brightness of a lamp `t` seconds after it was switched on: a few quick flickers, then steady. */
function flickerOn(t: number) {
    if (t < 0.06) return 0.9;
    if (t < 0.13) return 0.1;
    if (t < 0.2) return 0.8;
    if (t < 0.32) return 0.15;
    return Math.min(1, 0.6 + (t - 0.32) * 4); // settles at full by 0.42 s
}

/** One lamp's iron and glass parts, with its foot at the origin. */
function lampParts() {
    const iron = [
        new THREE.CylinderGeometry(0.13, 0.18, 0.55, 10).translate(0, 0.125, 0), // base, sunk 0.15 into the ground
        new THREE.CylinderGeometry(0.05, 0.06, 2.4, 8).translate(0, 1.6, 0),     // post
        new THREE.CylinderGeometry(0.12, 0.08, 0.08, 8).translate(0, 2.8, 0),    // collar under the lantern
        new THREE.ConeGeometry(0.27, 0.22, 4).rotateY(Math.PI / 4).translate(0, 3.35, 0), // roof
        new THREE.SphereGeometry(0.045, 8, 6).translate(0, 3.5, 0),              // finial
    ];
    // square lantern, wider at the top; its middle (3.04) is about LAMP_LIGHT_HEIGHT
    const glass = new THREE.CylinderGeometry(0.19, 0.13, 0.4, 4).rotateY(Math.PI / 4).translate(0, 3.04, 0);
    return { iron, glass };
}

export default function makeStreetLampSystem(ctx: SceneContext): System {
    const levels = ctx.state.dayNight.uLampLevels.value;
    const bloomLayer = ctx.state.postEffectState.bloom.layer;

    // --- geometry: every lamp's parts, placed and merged ---
    const ironParts: THREE.BufferGeometry[] = [];
    const glassParts: THREE.BufferGeometry[] = [];
    const placement = new THREE.Matrix4();
    STREET_LAMPS.forEach((lamp, i) => {
        // a different turn for each so the square lanterns don't all face the same way
        placement.makeRotationY(i * 0.7).setPosition(lamp.x, lamp.y, lamp.z);
        const { iron, glass } = lampParts();
        for (const g of iron) ironParts.push(g.applyMatrix4(placement));
        glass.applyMatrix4(placement);
        glass.setAttribute("aLamp", new THREE.Float32BufferAttribute(new Array(glass.attributes.position.count).fill(i), 1));
        glassParts.push(glass);
    });
    // the glass has an extra attribute (aLamp), so it's merged separately, not as a group
    const ironGeometry = mergeGeometries(ironParts)!;
    const glassGeometry = mergeGeometries(glassParts)!;
    for (const g of [...ironParts, ...glassParts]) g.dispose();

    const ironMaterial = new THREE.MeshLambertMaterial({ color: "#4b4741" });
    const iron = new THREE.Mesh(ironGeometry, ironMaterial);
    iron.name = "streetLampIron";
    iron.castShadow = true;
    iron.receiveShadow = true;

    const glassMaterial = new THREE.ShaderMaterial({
        defines: { LAMP_COUNT: STREET_LAMPS.length },
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib.fog,
            {
                uOffColor: { value: new THREE.Color("#b9b29e") },
                uOnColor: { value: new THREE.Color(2.2, 1.45, 0.6) },
            },
        ]),
        vertexShader,
        fragmentShader,
        fog: true,
    });
    // shared objects (merge clones), so they follow the day & night state with no copying
    glassMaterial.uniforms.uNight = ctx.state.dayNight.uNight;
    glassMaterial.uniforms.uLampLevels = ctx.state.dayNight.uLampLevels;
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.name = "streetLampGlass";
    // In the bloom pass the glass is drawn with this instead (see makePostEffectSystem's nonBloom):
    // only the lit lanterns' light, so the unlit ones don't glow while their neighbours are on.
    // Same shaders and the same uniforms object, so it follows the lamp levels too.
    const glowMaterial = new THREE.ShaderMaterial({
        defines: { LAMP_COUNT: STREET_LAMPS.length, GLOW_ONLY: 1 },
        uniforms: glassMaterial.uniforms,
        vertexShader,
        fragmentShader,
    });
    glass.userData.bloomMaterial = glowMaterial;
    // Tiny, and its bounds span the whole path anyway; this also guarantees the bloom pass draws it
    // during the warm-up frames below.
    glass.frustumCulled = false;
    // On the bloom layer for the first few frames after loading (all lamps off, so it draws black
    // there): that compiles the glow shader during the intro instead of on the first switch to night.
    // compileAsync at boot only compiles each material's on-screen version.
    let warmupFrames = 3;

    // --- switching ---
    const threshold = new Float32Array(STREET_LAMPS.length);
    STREET_LAMPS.forEach((_, i) => {
        // a lamp missing from SWITCH_ORDER (lamps added later) keeps its place in STREET_LAMPS
        const place = SWITCH_ORDER.indexOf(i);
        threshold[i] = FIRST_SWITCH + SWITCH_STEP * (place >= 0 ? place : i);
    });
    const on = STREET_LAMPS.map(() => false);
    const switchedAt = new Float64Array(STREET_LAMPS.length); // elapsed seconds: keep full precision
    const levelAtSwitch = new Float32Array(STREET_LAMPS.length);
    let glowing = false; // glass is on the bloom layer

    return {
        init() {
            ctx.scene.add(iron, glass);
        },
        update(elapsed: number) {
            const night = ctx.state.dayNight.uNight.value;
            let anyLit = false;
            for (let i = 0; i < levels.length; i++) {
                const wantOn = night > threshold[i];
                if (wantOn !== on[i]) {
                    on[i] = wantOn;
                    switchedAt[i] = elapsed;
                    levelAtSwitch[i] = levels[i];
                }
                const t = elapsed - switchedAt[i];
                levels[i] = on[i] ? flickerOn(t) : levelAtSwitch[i] * Math.max(0, 1 - t / FADE_OUT_SECONDS);
                if (levels[i] > 0) anyLit = true;
            }
            // Only on the bloom layer while a lamp is lit (or warming up): by day the post-effect
            // system can then skip the bloom pass when nothing else glows.
            const wantGlow = anyLit || warmupFrames > 0;
            if (warmupFrames > 0) warmupFrames--;
            if (wantGlow !== glowing) {
                glowing = wantGlow;
                if (glowing) glass.layers.enable(bloomLayer);
                else glass.layers.disable(bloomLayer);
            }
        },
        dispose() {
            ctx.scene.remove(iron, glass);
            ironGeometry.dispose();
            glassGeometry.dispose();
            ironMaterial.dispose();
            glassMaterial.dispose();
            glowMaterial.dispose();
        },
    };
}
