import * as THREE from "three";
import { SceneContext, System } from "../core/types";
import { isTouchDevice } from "../utils/isTouchDevice";

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
 * a uNight uniform and nightGrade(color), which darkens and cools a lit colour toward moonlight.
 * Applied after shadows and before fog, so moon shadows stay visible and the night fog colour
 * still blends on top. Call before any of those materials compile (page.tsx does it at boot).
 */
export function registerNightShaderChunk() {
    // ShaderChunk's type lists only three's own chunks; adding one at runtime is supported
    (THREE.ShaderChunk as Record<string, string>)["night_pars_fragment"] = /* glsl */ `
uniform float uNight;
vec3 nightGrade(vec3 color) {
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    vec3 moonlit = mix(color, vec3(luma), 0.35) * vec3(0.62, 0.8, 1.05) * 0.85;
    return mix(color, moonlit, uNight);
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
