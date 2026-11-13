import * as THREE from "three";
import { SceneContext, System } from "../core/types";
import { isTouchDevice } from "../utils/isTouchDevice";
import { LAMP_LIGHT_HEIGHT, STREET_LAMPS } from "../data/streetLamps";

// Day & night. This system owns the switch (N key, or a button on touch devices) and the eased
// transition. Everything else reads one number, ctx.state.dayNight.uNight.value (0 = day, 1 = night):
// the light and sky systems in their update(), the custom shaders through the shared uNight uniform.

const TRANSITION_SECONDS = 1.5;
// Night fog is a lighter blue than you'd expect, and thinner: by day the bright fog is what lights
// up the haze between the trees, so a near-black night fog turned the whole forest black.
const NIGHT_FOG_COLOR = new THREE.Color("#33476b");
const NIGHT_FOG_DENSITY = 0.0022;

/**
 * Adds `#include <night_pars_fragment>` for the custom shaders (grass, terrain, trunk, foliage):
 * the uNight and uLampLevels uniforms and nightGrade(color, worldPos), which darkens and cools a
 * lit colour toward moonlight and adds the warm light of the street lamps that are on.
 * Applied after shadows and before fog, so moon shadows stay visible and the night fog colour
 * still blends on top. Call before any of those materials compile (page.tsx does it at boot).
 *
 * The lamps' light isn't three.js lights: these shaders do their own lighting, and adding point
 * lights would recompile every lit material (three bakes the light count into the shaders).
 * Their positions are constants here; their brightness comes from uLampLevels.
 */
export function registerNightShaderChunk() {
    const n = STREET_LAMPS.length;
    const lamps = STREET_LAMPS
        .map((l) => `vec3(${l.x.toFixed(3)}, ${(l.y + LAMP_LIGHT_HEIGHT).toFixed(3)}, ${l.z.toFixed(3)})`)
        .join(", ");
    // ShaderChunk's type lists only three's own chunks; adding one at runtime is supported
    (THREE.ShaderChunk as Record<string, string>)["night_pars_fragment"] = /* glsl */ `
uniform float uNight;
uniform float uLampLevels[${n}];
const vec3 STREET_LAMP_POS[${n}] = vec3[${n}](${lamps});

// warm light from the street lamps at worldPos, as a multiplier for the surface colour as the
// shader lit it (its daytime lighting, before this grade)
vec3 streetLampLight(vec3 worldPos) {
    float sum = 0.0;
    for (int i = 0; i < ${n}; i++) {
        float level = uLampLevels[i];
        if (level <= 0.0) continue;
        vec3 d = STREET_LAMP_POS[i] - worldPos;
        float dist2 = dot(d, d);
        // soft inverse-square falloff, faded to exactly 0 by 8 units (dist2 = 64)
        sum += level / (1.0 + dist2 * 0.12) * (1.0 - smoothstep(25.0, 64.0, dist2));
    }
    return vec3(1.0, 0.72, 0.4) * (sum * 2.2);
}

vec3 nightGrade(vec3 color, vec3 worldPos) {
    if (uNight <= 0.0) return color; // daytime: the lamps are off too
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    vec3 moonlit = mix(color, vec3(luma), 0.35) * vec3(0.62, 0.8, 1.05) * 0.85;
    // The pools grow with the dark: a lamp that comes on at dusk (uNight 0.3, ground still mostly
    // daylit) would otherwise add its full light on top of near-daylight and look overexposed.
    float lampVisibility = smoothstep(0.2, 0.85, uNight);
    return mix(color, moonlit, uNight) + color * streetLampLight(worldPos) * lampVisibility;
}
`;
}

export interface DayNightSystem extends System {
    toggle(): void;
    isNight(): boolean;
}

export default function makeDayNightSystem(ctx: SceneContext): DayNightSystem {
    const state = ctx.state.dayNight;
    const dayFogColor = ctx.state.fogState.fogColor.clone();
    let target = state.uNight.value >= 0.5 ? 1 : 0; // where the transition is heading
    let progress = target;                          // linear 0..1; uNight is this, eased
    let lastElapsed: number | null = null;
    let dayFogDensity: number | null = null; // read from scene.fog on the first update

    // Touch devices have no N key: a small moon/sun button in the top-right corner
    // (the joystick lives bottom-left). "︎" asks for the text glyph, not an emoji.
    let button: HTMLButtonElement | null = null;
    const updateButton = () => {
        if (!button) return;
        const goingToNight = target === 0;
        button.textContent = goingToNight ? "☾︎" : "☀︎";
        button.setAttribute("aria-label", goingToNight ? "Switch to night" : "Switch to day");
    };

    const toggle = () => {
        target = target === 1 ? 0 : 1;
        updateButton();
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.repeat || e.key.toLowerCase() !== "n") return;
        toggle();
    };

    return {
        init() {
            window.addEventListener("keydown", onKeyDown);
            // phones/tablets, plus touch-only devices the user-agent check misses (e.g. a Surface
            // without its keyboard). A touchscreen laptop also gets it, which is harmless.
            if (isTouchDevice() || navigator.maxTouchPoints > 0) {
                button = document.createElement("button");
                button.id = "day-night-toggle";
                Object.assign(button.style, {
                    position: "fixed",
                    top: "16px",
                    right: "16px",
                    width: "44px",
                    height: "44px",
                    borderRadius: "22px",
                    border: "1px solid rgba(255,255,255,.35)",
                    background: "rgba(0,0,0,.45)",
                    color: "white",
                    fontSize: "22px",
                    lineHeight: "1",
                    zIndex: "1000", // under the loading overlay (2000), above the canvas
                    touchAction: "manipulation",
                } satisfies Partial<CSSStyleDeclaration>);
                button.addEventListener("click", toggle);
                updateButton();
                document.body.appendChild(button);
            }
        },
        update(elapsed: number) {
            // not capped (unlike movement): a slow frame should finish the fade on time, not stretch it
            const frameSeconds = lastElapsed === null ? 0 : Math.max(elapsed - lastElapsed, 0);
            lastElapsed = elapsed;

            if (progress !== target) {
                const step = frameSeconds / TRANSITION_SECONDS;
                progress = target > progress ? Math.min(progress + step, target) : Math.max(progress - step, target);
            }
            state.uNight.value = progress * progress * (3 - 2 * progress); // smoothstep: eases in and out

            // fog colour and density (the custom fog chunk reads scene.fog)
            const fog = ctx.scene.fog as THREE.FogExp2 | null;
            if (fog) {
                dayFogDensity ??= fog.density;
                fog.color.lerpColors(dayFogColor, NIGHT_FOG_COLOR, state.uNight.value);
                fog.density = THREE.MathUtils.lerp(dayFogDensity, NIGHT_FOG_DENSITY, state.uNight.value);
            }
        },
        dispose() {
            window.removeEventListener("keydown", onKeyDown);
            button?.removeEventListener("click", toggle);
            button?.remove();
            button = null;
        },
        toggle,
        isNight: () => target === 1,
    };
}
