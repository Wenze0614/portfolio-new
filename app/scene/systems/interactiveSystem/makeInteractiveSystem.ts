import { ControlSystem, SceneContext, System } from "../../core/types";
import * as THREE from "three";
import makePianoSystem from "./makeMusicBar";
import makePokeBallSystem from "./makePokeBallSystem";
import makeFireflySystem from "./makeFireflySystem";
import { AudioSystem } from "../makeAudioSystem";
import makeMusicBar from "./makeMusicBar";

export interface InteractiveSystem {
    init(meshs: THREE.Mesh[], guiSystem: any): void;
    update(dt: number): void;
    dispose(): void;
    getInteractables(): THREE.Mesh[];
}

export default function makeInteractiveSystem(ctx: SceneContext, audioSys: AudioSystem, controlSystem:ControlSystem): InteractiveSystem {
    const pokeballPosition = new THREE.Vector3(-35, 0, 5);
    // const pianoPosition = new THREE.Vector3(10, 0.2, 50);
    // const barSys = makeMusicBar(ctx, audioSys)
    const pokeBallSystem = makePokeBallSystem(ctx)
    const fireflySys1 = makeFireflySystem(ctx)
    // fireflySys1.init(pianoPosition, 5);
    const fireflySys2 = makeFireflySystem(ctx)
    fireflySys2.init(pokeballPosition, 5);
    return {
        async init(meshs: THREE.Mesh[], guiSystem: any) {
            //barSys.init(ctx, meshs, guiSystem, {position: pianoPosition});
            await pokeBallSystem.init(ctx, meshs, guiSystem, { position: pokeballPosition }, controlSystem, audioSys);

        },
        update(dt: number) {
            fireflySys1.update(dt);
            fireflySys2.update(dt);
            pokeBallSystem.update(dt);
            //barSys.update(dt);
        },
        dispose() {
            //clean up event listeners or other resources here
        },
        getInteractables() {
            const interactables = pokeBallSystem.getinteractables()
            console.log("interactiveSystem interactables: ", interactables);
            return interactables;
        }
    }
}