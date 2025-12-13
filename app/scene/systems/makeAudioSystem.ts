import { SceneContext } from "../core/types";
import * as THREE from "three";

export interface AudioSystem {

    init(): Promise<void>;
    update(dt: number): void;
    dispose(): void;
    play(name: string): void;
    stop(): void;
    bindPiano(name: string, mesh: THREE.Mesh):void;
    playPiano():void;
    playCatSound(mesh: THREE.Mesh):void;
    // isStepPlaying: () => boolean;
}

export default function makeAudioSystem(ctx: SceneContext): AudioSystem {
    const envSound = new THREE.Audio(ctx.listener);
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
    const catSounds: Record<string, THREE.PositionalAudio> = {};
    const pianoSounds: Record<string, THREE.PositionalAudio> = {};
    let currentStepSound: THREE.Audio | null = null;
    let currentPianoSound: THREE.PositionalAudio | null = null;
    let currentCatSound: THREE.PositionalAudio | null = null;

    async function loadSound(name: string, url: string, loop = false, volume = 1, piano = false, cat = false) {
        const buffer = await audioLoader.loadAsync(url);
        const sound = piano || cat ? new THREE.PositionalAudio(ctx.listener) : new THREE.Audio(ctx.listener);
        sound.setBuffer(buffer);
        sound.setLoop(loop);
        sound.setVolume(volume);
        if(piano) {
            pianoSounds[name] = sound as THREE.PositionalAudio;
        } else if(cat) {
            catSounds[name] = sound as THREE.PositionalAudio;
        }
        else{
            sounds[name] = sound as THREE.Audio;
        }
        return sound;
    }
    return {
        async init() {
            audioLoader.load('/audio/env.wav', (buffer) => {
                //console.log('audio loaded: ', buffer);
                envSound.setBuffer(buffer);
                envSound.setLoop(true);
                envSound.setVolume(0.3);
                envSound.play();
            })
            await loadSound("grassStep", '/audio/walk_grass_2_trim.mp3')
            await loadSound("terrainStep", '/audio/walk_terrain.mp3')
            await loadSound("lune", "/audio/lune.mp3", false, 1, true)
            await loadSound("cat", "/audio/catSound.mp3", true, 0.5, false, true)
            //console.log("sounds loaded: ", sounds);
            //console.log("piano sounds loaded: ", pianoSounds);
        },
        update(dt: number) { },
        dispose() { },
        play(name: "grassStep" | "terrainStep") {
            currentStepSound = sounds[name];
            currentStepSound.setVolume(0.4);
            if(name === "terrainStep") {
                currentStepSound.setVolume(0.8); //todo: need to update volume later
            }
            if (!currentStepSound || currentStepSound.isPlaying) return;
            currentStepSound.play();

            // currentStepSound.setLoop(true);
        },
        stop() {
            if (currentStepSound && currentStepSound.isPlaying) {
                currentStepSound.stop();
                currentStepSound = null;
            }
        },
        bindPiano(name: string, mesh: THREE.Mesh) {
            currentPianoSound = pianoSounds[name];
            currentPianoSound.setVolume(1.2);
            //console.log('pianoSounds: ', pianoSounds);
            //console.log("play piano sound: ", currentPianoSound);
            if (!currentPianoSound || currentPianoSound.isPlaying) return;
            mesh.add(currentPianoSound);
            currentPianoSound.setRefDistance(2);
            //currentPianoSound.play();
        },
        playPiano() {
            if(!currentPianoSound || currentPianoSound.isPlaying) return;
            currentPianoSound.play();
        },
        playCatSound(mesh: THREE.Mesh) {
            currentCatSound = catSounds["cat"];
            console.log("play cat sound: ", currentCatSound);
            currentCatSound.setVolume(0.5);
            if (!currentCatSound || currentCatSound.isPlaying) return;
            mesh.add(currentCatSound);
            currentCatSound.setRefDistance(0.5);
            currentCatSound.play();
        }

    }

}