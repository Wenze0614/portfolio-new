import { ControlSystem, SceneContext, System } from "../../core/types";
import * as THREE from "three";
import makePianoSystem from "./makeMusicBar";
import makePokeBallSystem from "./makePokeBallSystem";
import { AudioSystem } from "../makeAudioSystem";
import makeMusicBar from "./makeMusicBar";

export interface InteractiveSystem {
    init(meshs: THREE.Mesh[], guiSystem?: any): void;
    update(dt: number): void;
    dispose(): void;
    getInteractables(): THREE.Mesh[];
}

export default function makeInteractiveSystem(ctx: SceneContext, audioSys: AudioSystem, controlSystem:ControlSystem): InteractiveSystem {
    const pokeballPosition = new THREE.Vector3(-35, 0, 5);
    // const pianoPosition = new THREE.Vector3(10, 0.2, 50);
    // const barSys = makeMusicBar(ctx, audioSys)
    const pokeBallSystem = makePokeBallSystem(ctx)
    // (the old always-on firefly cloud by the cabin was removed: night fireflies now fill the
    // whole forest, see makeForestFireflySystem)
    return {
        async init(meshs: THREE.Mesh[], guiSystem: any) {
            //barSys.init(ctx, meshs, guiSystem, {position: pianoPosition});
            await pokeBallSystem.init(ctx, meshs, guiSystem, { position: pokeballPosition }, controlSystem, audioSys);

        },
        update(dt: number) {
            pokeBallSystem.update(dt);
            //barSys.update(dt);
        },
        dispose() {
            //clean up event listeners or other resources here
        },
        getInteractables() {
            const interactables = pokeBallSystem.getinteractables()
            //console.log("interactiveSystem interactables: ", interactables);
            return interactables;
        }
    }
}