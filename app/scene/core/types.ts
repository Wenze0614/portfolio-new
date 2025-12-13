// core/types.ts

import * as THREE from "three";
import { EffectComposer, GLTFLoader } from "three/examples/jsm/Addons.js";
import { AudioSystem } from "../systems/makeAudioSystem";


export interface System {
    init(ctx: SceneContext, meshes?: THREE.Mesh[], guiSystem?: GUISystem, opts?:{position: THREE.Vector3},  controlSystem?: ControlSystem, audioSystem?: AudioSystem): Promise<void> | void;
    update( dt: number): void;
    dispose(): void;
  }

export interface UpdateParams {
    ctx: SceneContext;
    dt?: number;
}

export interface ControlSystem extends System {
    switchControl: (ctx: SceneContext) => void;
    buildCollisionOctree: (collidersGroup: THREE.Group) => void;
};

export interface GUISystem extends System {
    toggleControl: (ctx: SceneContext, switchControl: (ctx: SceneContext) => void) => void;
    updateLights: (lights: THREE.Light[]) => void;
    updateMeshes: (meshes: THREE.Mesh[]) => void;
    updateSprites: (sprites: THREE.Sprite[]) => void;
}

export interface LightSystem extends System {
    getLights: () => THREE.Light[];
    addComposer: (composer: EffectComposer) => void;
}

export interface ScreenSystem extends System {
    setPosition: (position: THREE.Vector3) => void;
}

export enum CONTROL_TYPE {
    Walk = "Walk",
    Orbit = "Orbit",
};

export interface OrbitState {
    controlType: CONTROL_TYPE.Orbit;
}

export interface PLockState {
    controlType: CONTROL_TYPE.Walk;
    speed:number;
    direction: THREE.Vector3;
    move: { forward: boolean; backward: boolean; left: boolean; right: boolean; run: boolean; };
    walkTime: number;
    timeSinceLastStep: number; // Time since the last footstep sound was played
    bobFrequency: number;     // Controls how fast the bobbing is
    bobAmplitude: number;  // Controls how much the camera bobs
    baseY: number;          // Default head height
}

export interface TerrainState {
    terrainWidth: number,
    terrainLength: number,
    heightScale: number,
    heightOffset: number
    tileSize:number,
    tileResolution:number,
}

export interface WindState {
    windSpeed: number,
    windDirection: THREE.Vector2,
    windStrength: number
}

export interface FogState {
    fogColor: THREE.Color,
}

export interface BloomState {
    strength: number,
    layer:number,
    radius:number,
    threshold:number,
}

export interface PostEffectState {
    bloom: BloomState,
}


export interface AppState {
    controlState: OrbitState | PLockState;
    setControlType(t: CONTROL_TYPE): void;
    terrainState: TerrainState;
    windState: WindState;
    fogState: FogState;
    postEffectState:PostEffectState;
    isFullScreen: boolean;
    walkStateDefaults: PLockState;
    setTexture(name: string, texture: THREE.Texture): void;
    getTexture(name: string): THREE.Texture;
    setVideoTexture(name: string, texture: THREE.VideoTexture): void;
    getVideoTexture(name: string): THREE.VideoTexture;
    cameraHeight: number;
}

export interface SceneContext {
    scene: THREE.Scene;
    camera: THREE.Camera;
    listener: THREE.AudioListener;
    renderer: THREE.WebGLRenderer;
    composers: {
        finalComposer: EffectComposer;
        bloomComposer: EffectComposer;
    }
    clock: THREE.Clock;
    loaders: {
        loaderManager: THREE.LoadingManager;
        gltf: GLTFLoader;
        texture: THREE.TextureLoader;
        audio: THREE.AudioLoader;
    };
    state: AppState; // your store/event bus
}

export enum TEXTURE_NAME {
    GRASS_TEXTURE = "grassTexture",
    ARCHIE_TEXTURE = "archieTexture",
    TERRAIN_HEIGHT_MAP = "terrainHeightMap",
    FOG_NOISE_TEXTURE = "fogNoiseTexture",
    TERRAIN_TEXTURE = "terrainTexture",
    WIND_NOISE_TEXTURE = "windNoiseTexture",
    PIANO_TEXTURE = "pianoTexture",
    BAR_TEXTURE = "barTexture",
    POKEBALL_TEXTURE = "pokeballTexture",
    FOLIAGE_TEXTURE = "foliageTexture",
    TREEBARK_TEXTURE = "treebarkTexture",
    STAR_TEXTURE = "starTexture",
    MINECRAFT_TEXTURE = "minecraftTexture",
    MINECRAFT_WOOD_TEXTURE = "minecraftWoodTexture",
    MINECRAFT_ROOF_TEXTURE = "minecraftRoofTexture",
    HOUSE_TEXTURE = "houseTexture",
    TEXTURE_SET_TWO = "textureSetTwo",
    TEXTURE_SET_THREE = "textureSetThree",
    ROTOM_TEXTURE = "rotomTexture",
    TEXTURE_SET_FOUR = "textureSetFour",
    Archie_Photo = "archiePhoto",
    Certificate = "certificate",
    Leaf_Texture = "leafTexture",
    Pikachu_Statue_Texture = "pikachuStatueTexture",
    Boot_Texture = "bootTexture",
    WOOD_TEXTURE = "woodTexture",
    WALL_TEEXTURE = "wallTexture",
    BOOK_COVER = "bookCover",
    JOLTEON_ICON = "jolteonIcon",
    Z_TEXTURE = "zTexture",
    CD_COVER = "cdCover",
}

export enum VIDEOTEXTURE_NAME {
    SINGING_1 = "singing1",
}

export type TextureDict = Record<TEXTURE_NAME, THREE.Texture| undefined>;

export type VideoTextureDict = Record<VIDEOTEXTURE_NAME, THREE.VideoTexture| undefined>;
