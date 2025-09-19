import { useEffect } from "react";
import GUI from "lil-gui";
import * as THREE from "three";
import { CONTROL_TYPE } from "../core/types";
import { GUISystem, SceneContext, System } from "../core/types";
// import gsap from "gsap";

export default function makeGUISystem(): GUISystem {
    const gui = new GUI({ container: document.body });
    return {
        init(ctx: SceneContext) {
            gui.close();
            const displayGui = (key: KeyboardEvent) => {
                if (key.key === "g") {
                    gui.show(gui._hidden);
                }
            };
            window.addEventListener("keydown", displayGui);
            // Position the GUI using CSS.
            gui.domElement.style.position = "fixed";
            gui.domElement.style.bottom = "10px";
            gui.domElement.style.right = "10px";
            gui.domElement.style.zIndex = "1000"; // Ensure it stays on top.


        },
        toggleControl(ctx: SceneContext, switchControl: (ctx: SceneContext) => void) {
            const updateControlMode = (mode: CONTROL_TYPE) => {
                console.log("updating control to ", mode);
                ctx.state.setControlType(mode);
                console.log("ctx state: ", ctx.state.controlState.controlType);
                switchControl(ctx);
            }
            gui.add(ctx.state.controlState, 'controlType', [CONTROL_TYPE.Walk, CONTROL_TYPE.Orbit])
                .name('Control Mode')
                .onChange((mode: CONTROL_TYPE) => {
                    updateControlMode(mode);
                });
            window.addEventListener("keydown", (key) => {
                if (key.key === "c") {
                    const newMode = ctx.state.controlState.controlType === CONTROL_TYPE.Walk ? CONTROL_TYPE.Orbit : CONTROL_TYPE.Walk;
                    console.log("shortcut to update control to ", newMode);
                    updateControlMode(newMode);
                }
            }
            )
        },
        updateLights(lights: THREE.Light[]) {
            if (lights.length === 0) return;
            const lightFolder = gui.addFolder('Lights');
            lights.forEach((light) => {
                const lightTweak = lightFolder.addFolder(`${light.name}`);
                lightTweak.close();
                lightTweak.add(light, 'visible').name(`${light.name} visible`);
                if ('intensity' in light) {
                    lightTweak.add(light, 'intensity', 0, 10, 0.01).name(`${light.name} intensity`);
                }
                if (light instanceof THREE.DirectionalLight || light instanceof THREE.SpotLight) {
                    lightTweak.add(light.position, 'x', -20, 20, 0.01).name(`${light.name} position X`);
                    lightTweak.add(light.position, 'y', -20, 20, 0.01).name(`${light.name} position Y`);
                    lightTweak.add(light.position, 'z', -20, 20, 0.01).name(`${light.name} position Z`);
                }
                const colorParams = { color: `#${light.color.getHexString()}` }; // initial color as hex
                lightTweak.addColor(colorParams, 'color')
                    .name(`${light.name} color`)
                    .onChange((val: string) => {
                        light.color.set(val);
                    });
            });
            lightFolder.open();
        },
        update(ctx: SceneContext) { },
        dispose() { }

    }
}
