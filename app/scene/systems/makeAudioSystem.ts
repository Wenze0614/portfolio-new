import { SceneContext } from "../core/types";
import * as THREE from "three";

export interface AudioSystem {

    init(): Promise<void>;
    update(dt: number): void;
    dispose(): void;
    play(name: string): void;
    stop(): void;
    // isStepPlaying: () => boolean;
}

export default function makeAudioSystem(ctx: SceneContext): AudioSystem {
    const sound = new THREE.Audio(ctx.listener);
    const audioLoader = ctx.loaders.audio;

    // const listener = new THREE.AudioListener();
    // ctx.camera.add(listener);

    // const sound = new THREE.Audio(listener);
    // const audioLoader = new THREE.AudioLoader();

    window.addEventListener('click', () => {
        const listenerCtx = ctx.listener.context;
        if (listenerCtx.state !== 'running') listenerCtx.resume();
    });

    const sounds: Record<string, THREE.Audio> = {};
    let currentStepSound: THREE.Audio | null = null;

    async function loadSound(name: string, url: string, loop = false, volume = 1) {
        const buffer = await audioLoader.loadAsync(url);
        const sound = new THREE.Audio(ctx.listener);
        sound.setBuffer(buffer);
        sound.setLoop(loop);
        sound.setVolume(volume);
        sounds[name] = sound;
        return sound;
    }
    return {
        async init() {
            audioLoader.load('/audio/env.wav', (buffer) => {
                console.log('audio loaded: ', buffer);
                sound.setBuffer(buffer);
                sound.setLoop(true);
                sound.setVolume(0.75);
                sound.play();
            })
            await loadSound("grassStep", '/audio/walk_grass_2_trim.mp3')
            await loadSound("terrainStep", '/audio/walk_terrain.mp3')
        },
        update(dt: number) { },
        dispose() { },
        play(name: "grassStep" | "terrainStep") {
            currentStepSound = sounds[name];
            currentStepSound.setVolume(0.4);
            if (!currentStepSound || currentStepSound.isPlaying) return;
            currentStepSound.play();

            // currentStepSound.setLoop(true);
        },
        stop() {
            if (currentStepSound && currentStepSound.isPlaying) {
                currentStepSound.stop();
                currentStepSound = null;
            }
        }

    }

}