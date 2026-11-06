import { SceneContext } from "../core/types";
import * as THREE from "three";
import { ASSET_URLS } from "../core/loaders";

export interface AudioSystem {

    init(): Promise<void>;
    update(dt: number): void;
    dispose(): void;
    play(name: string): void;
    stop(): void;
    bindPiano(name: string, mesh: THREE.Mesh):void;
    playPiano():void;
    preloadMusic():void;
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

    // Music: loaded lazily so the ~9 MB file isn't on the critical loading path.
    let pianoBinding: { name: string, mesh: THREE.Mesh } | null = null;
    let pianoPlayRequested = false;
    let musicPromise: Promise<THREE.PositionalAudio> | null = null;
    function loadMusic(): Promise<THREE.PositionalAudio> {
        if (!musicPromise) {
            musicPromise = audioLoader.loadAsync(ASSET_URLS.music).then((buffer) => {
                const sound = new THREE.PositionalAudio(ctx.listener);
                sound.setBuffer(buffer);
                sound.setLoop(false);
                sound.setVolume(1.2);
                sound.setRefDistance(2);
                pianoSounds[pianoBinding?.name ?? "lune"] = sound;
                pianoBinding?.mesh.add(sound);
                currentPianoSound = sound;
                return sound;
            });
            musicPromise.catch(() => { musicPromise = null; }); // allow a retry on the next E press
        }
        return musicPromise;
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
            // small sounds, loaded in parallel. The music (lune.mp3, ~9 MB) is not loaded here:
            // see preloadMusic / playPiano
            await Promise.all([
                loadSound("grassStep", '/audio/walk_grass_2_trim.mp3'),
                loadSound("terrainStep", '/audio/walk_terrain.mp3'),
                loadSound("cat", "/audio/catSound.mp3", true, 0.5, false, true),
            ]);
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
            // the music isn't loaded yet; remember where to attach it once it is
            pianoBinding = { name, mesh };
        },
        preloadMusic() {
            // start the download in the background (called once the scene is ready)
            loadMusic().catch((err) => console.error("music failed to load", err));
        },
        playPiano() {
            if (currentPianoSound?.isPlaying || pianoPlayRequested) return;
            pianoPlayRequested = true;
            // usually already downloaded by preloadMusic; otherwise this waits for it
            loadMusic()
                .then((sound) => sound.play())
                .catch((err) => console.error("music failed to load", err))
                .finally(() => { pianoPlayRequested = false; });
        },
        playCatSound(mesh: THREE.Mesh) {
            currentCatSound = catSounds["cat"];
            //console.log("play cat sound: ", currentCatSound);
            currentCatSound.setVolume(0.5);
            if (!currentCatSound || currentCatSound.isPlaying) return;
            mesh.add(currentCatSound);
            currentCatSound.setRefDistance(0.5);
            currentCatSound.play();
        }

    }

}