import { System } from "../core/types";
import { fogClear } from "./makeFogSystem";
import { makeTouchButton, wantsTouchButtons } from "../utils/touchButton";

// Fog on / off: G (or a button on touch devices) fades between the normal fog and "fog off", where
// only a light haze stays and the map edge is still fogged so it never shows (see the fog chunk in
// makeFogSystem). Drives one shared uniform, fogClear, so switching recompiles nothing.

const TRANSITION_SECONDS = 1.0;

export interface FogToggleSystem extends System {
    toggle(): void;
    /** Where the fog is heading (true = normal fog), not where the fade is. */
    isFogOn(): boolean;
}

export default function makeFogToggleSystem(): FogToggleSystem {
    let target = fogClear.value >= 0.5 ? 1 : 0; // 1 = fog off
    let progress = target;                      // linear 0..1; fogClear is this, eased
    let lastElapsed: number | null = null;

    let button: ReturnType<typeof makeTouchButton> | null = null;
    const updateButton = () => {
        if (!button) return;
        const fogOn = target === 0;
        button.set("≋", fogOn ? "Turn fog off" : "Turn fog on"); // ≋
        button.element.style.opacity = fogOn ? "1" : "0.55";        // dimmed while the fog is off
    };

    const toggle = () => {
        target = target === 1 ? 0 : 1;
        updateButton();
    };

    const onKeyDown = (e: KeyboardEvent) => {
        // G, next to F (fullscreen); not with modifiers, which belong to the browser
        if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== "g") return;
        toggle();
    };

    return {
        init() {
            window.addEventListener("keydown", onKeyDown);
            if (wantsTouchButtons()) {
                button = makeTouchButton("fog-toggle", 1, toggle); // left of the day/night button
                updateButton();
            }
        },
        update(elapsed: number) {
            const frameSeconds = lastElapsed === null ? 0 : Math.max(elapsed - lastElapsed, 0);
            lastElapsed = elapsed;
            if (progress !== target) {
                const step = frameSeconds / TRANSITION_SECONDS;
                progress = target > progress ? Math.min(progress + step, target) : Math.max(progress - step, target);
            }
            fogClear.value = progress * progress * (3 - 2 * progress); // smoothstep: eases in and out
        },
        dispose() {
            window.removeEventListener("keydown", onKeyDown);
            button?.remove();
            button = null;
        },
        toggle,
        isFogOn: () => target === 0,
    };
}
