import { System } from "../core/types";
import { isTouchDevice } from "../utils/isTouchDevice";

// The keys, shown in a small panel in the bottom-right corner (desktop only: touch devices have the
// joystick and the round buttons instead). The N and G rows say what pressing them does next
// ("night" / "day", "fog off" / "fog on"), read from the systems each frame. H hides the panel.

interface KeyHintsSources {
    isNight(): boolean;   // where the day & night switch is heading
    isFogOn(): boolean;
}

const PANEL_STYLE: Partial<CSSStyleDeclaration> = {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    display: "grid",
    gridTemplateColumns: "auto auto",
    columnGap: "10px",
    rowGap: "5px",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "rgba(0,0,0,.35)",
    color: "rgba(255,255,255,.88)",
    fontFamily: "sans-serif",
    fontSize: "12px",
    lineHeight: "1",
    pointerEvents: "none",
    userSelect: "none",
    zIndex: "1000", // under the loading overlay (2000), above the canvas
};

const KEYCAP_STYLE: Partial<CSSStyleDeclaration> = {
    display: "inline-block",
    minWidth: "18px",
    padding: "3px 5px",
    marginRight: "3px",
    border: "1px solid rgba(255,255,255,.55)",
    borderRadius: "4px",
    textAlign: "center",
    fontFamily: "ui-monospace, monospace",
    fontSize: "11px",
};

export default function makeKeyHintsSystem(sources: KeyHintsSources): System {
    let panel: HTMLDivElement | null = null;
    const labels = new Map<string, HTMLSpanElement>(); // row id → its label, for the rows that change

    const addRow = (keys: string[], label: string, id?: string) => {
        const keyCell = document.createElement("span");
        for (const k of keys) {
            const cap = document.createElement("span");
            Object.assign(cap.style, KEYCAP_STYLE);
            cap.textContent = k;
            keyCell.appendChild(cap);
        }
        const labelCell = document.createElement("span");
        labelCell.textContent = label;
        panel!.append(keyCell, labelCell);
        if (id) labels.set(id, labelCell);
    };

    const setLabel = (id: string, text: string) => {
        const el = labels.get(id);
        if (el && el.textContent !== text) el.textContent = text; // touch the DOM only on a change
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== "h" || !panel) return;
        panel.style.display = panel.style.display === "none" ? "grid" : "none";
    };

    return {
        init() {
            if (isTouchDevice()) return;
            panel = document.createElement("div");
            panel.id = "key-hints";
            panel.setAttribute("aria-label", "Keyboard controls");
            Object.assign(panel.style, PANEL_STYLE);
            addRow(["W", "A", "S", "D"], "move");
            addRow(["Shift"], "run");
            addRow(["E"], "interact");
            addRow(["N"], "", "night");
            addRow(["G"], "", "fog");
            addRow(["F"], "fullscreen");
            addRow(["H"], "hide keys");
            document.body.appendChild(panel);
            window.addEventListener("keydown", onKeyDown);
        },
        update() {
            if (!panel) return;
            setLabel("night", sources.isNight() ? "day" : "night");
            setLabel("fog", sources.isFogOn() ? "fog off" : "fog on");
        },
        dispose() {
            window.removeEventListener("keydown", onKeyDown);
            panel?.remove();
            panel = null;
            labels.clear();
        },
    };
}
