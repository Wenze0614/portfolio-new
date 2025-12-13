import GUI from "lil-gui";
import * as THREE from "three";
import { CONTROL_TYPE } from "../core/types";
import { GUISystem, SceneContext, System } from "../core/types";
// import gsap from "gsap";

export default function makeGUISystem(ctx: SceneContext): GUISystem {
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
                lightTweak.domElement.style.marginLeft = '10px';
                lightTweak.close();
                lightTweak.add(light, 'visible').name(`${light.name} visible`);
                if ('intensity' in light) {
                    lightTweak.add(light, 'intensity', 0, 10, 0.01).name(`${light.name} intensity`);
                }
                if (light instanceof THREE.DirectionalLight || light instanceof THREE.SpotLight || light instanceof THREE.PointLight) {
                    lightTweak.add(light.position, 'x', -ctx.state.terrainState.terrainWidth * 0.5, ctx.state.terrainState.terrainWidth * 0.5, 0.001).name(`${light.name} position X`);
                    lightTweak.add(light.position, 'y', -20, 20, 0.01).name(`${light.name} position Y`);
                    lightTweak.add(light.position, 'z', -ctx.state.terrainState.terrainLength * 0.5, ctx.state.terrainState.terrainLength * 0.5, 0.001).name(`${light.name} position Z`);
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
        updateMeshes(meshes: THREE.Mesh[]) {
            if (!meshes) return;
            const meshFolder = gui.addFolder('Meshes');
            meshes.forEach((child) => {
                if (child instanceof THREE.Mesh) {
                    const meshTweak = meshFolder.addFolder(`${child.name || 'mesh'}`);
                    meshTweak.domElement.style.marginLeft = '10px';
                    meshTweak.close();
                    meshTweak.add(child, 'visible').name(`${child.name || 'mesh'} visible`);
                    meshTweak.add(child.position, 'x', -ctx.state.terrainState.terrainWidth * 0.5, ctx.state.terrainState.terrainWidth * 0.5, 0.001).name(`${child.name || 'mesh'} position X`);
                    meshTweak.add(child.position, 'y', -20, 20, 0.001).name(`${child.name || 'mesh'} position Y`);
                    meshTweak.add(child.position, 'z', -ctx.state.terrainState.terrainLength * 0.5, ctx.state.terrainState.terrainLength * 0.5, 0.001).name(`${child.name || 'mesh'} position Z`);
                    meshTweak.add(child.scale, 'x', 0.01, 10, 0.001).name(`${child.name || 'mesh'} scale X`);
                    meshTweak.add(child.scale, 'y', 0.01, 10, 0.001).name(`${child.name || 'mesh'} scale Y`);
                    meshTweak.add(child.scale, 'z', 0.01, 10, 0.001).name(`${child.name || 'mesh'} scale Z`);
                }
            })
        },
        updateSprites(sprites: THREE.Sprite[]) {
            if (!sprites) return;
            const spriteFolder = gui.addFolder('Sprites');
            sprites.forEach((sprite) => {
                const spriteTweak = spriteFolder.addFolder(`${sprite.name || 'sprite'}`);
                spriteTweak.domElement.style.marginLeft = '10px';
                spriteTweak.close();
                spriteTweak.add(sprite, 'visible').name(`${sprite.name || 'sprite'} visible`);
                spriteTweak.add(sprite.position, 'x', -ctx.state.terrainState.terrainWidth * 0.5, ctx.state.terrainState.terrainWidth * 0.5, 0.001).name(`${sprite.name || 'sprite'} position X`);
                spriteTweak.add(sprite.position, 'y', -20, 20, 0.001).name(`${sprite.name || 'sprite'} position Y`);
                spriteTweak.add(sprite.position, 'z', -ctx.state.terrainState.terrainLength * 0.5, ctx.state.terrainState.terrainLength * 0.5, 0.001).name(`${sprite.name || 'sprite'} position Z`);
                spriteTweak.add(sprite.scale, 'x', -1, 10, 0.001).name(`${sprite.name || 'sprite'} scale X`);
                spriteTweak.add(sprite.scale, 'y', -1, 10, 0.001).name(`${sprite.name || 'sprite'} scale Y`);
                spriteTweak.add(sprite.scale, 'z', -1, 10, 0.001).name(`${sprite.name || 'sprite'} scale Z`);
            })
        },
        update(dt:number) { },
        dispose() { }

    }
}
