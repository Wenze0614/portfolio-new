import { SceneContext, System } from "../../core/types";
import * as THREE from "three";
import makePianoSystem from "./makePianoSystem";
import makePokeBallSystem from "./makePokeBallSystem";
import makeFireflySystem from "../makeFireflySystem";
import { AudioSystem } from "../makeAudioSystem";

export interface InteractiveSystem {
    init(meshs: THREE.Mesh[], guiSystem: any): void;
    update(dt: number): void;
    dispose(): void;
}

export default function makeInteractiveSystem(ctx: SceneContext, audioSys:AudioSystem): InteractiveSystem {
    const pokeballPosition = new THREE.Vector3(-30, 3, 7);
    const pianoPosition = new THREE.Vector3(10, 0.2, 50);
    const pianoSystem = makePianoSystem(ctx, audioSys)
    const pokeBallSystem = makePokeBallSystem(ctx)
    const fireflySys1 = makeFireflySystem(ctx)
    fireflySys1.init(pianoPosition, 5);
    const fireflySys2 = makeFireflySystem(ctx)
    fireflySys2.init(pokeballPosition, 5);
    return {
        init(meshs: THREE.Mesh[], guiSystem: any) {
            pianoSystem.init(ctx, meshs, guiSystem, {position: pianoPosition});
            pokeBallSystem.init(ctx, meshs, guiSystem, {position: pokeballPosition});

        },
        update(dt: number) {
            fireflySys1.update(dt);
            fireflySys2.update(dt);
            pianoSystem.update(dt);
        },
        dispose() {
            //clean up event listeners or other resources here
        }
    }
}