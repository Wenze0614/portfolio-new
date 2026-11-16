import { isTouchDevice } from "./isTouchDevice";

/**
 * Touch devices have no keyboard, so each key toggle (N, F) also gets a small round button in the
 * top-right corner (the joystick lives bottom-left). `slot` 0 is the corner, 1 sits left of it, ...
 */
export function wantsTouchButtons() {
    // phones/tablets, plus touch-only devices the user-agent check misses (e.g. a Surface without
    // its keyboard). A touchscreen laptop also gets them, which is harmless.
    return isTouchDevice() || navigator.maxTouchPoints > 0;
}

export function makeTouchButton(id: string, slot: number, onClick: () => void) {
    const button = document.createElement("button");
    button.id = id;
    Object.assign(button.style, {
        position: "fixed",
        top: "16px",
        right: `${16 + slot * 56}px`,
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
    // blur after a tap or click: a focused button would toggle again on Space / Enter
    const handleClick = () => { onClick(); button.blur(); };
    button.addEventListener("click", handleClick);
    document.body.appendChild(button);
    return {
        element: button,
        /** "︎" after a glyph asks for the text version, not an emoji */
        set(glyph: string, label: string) {
            button.textContent = glyph;
            button.setAttribute("aria-label", label);
        },
        remove() {
            button.removeEventListener("click", handleClick);
            button.remove();
        },
    };
}
