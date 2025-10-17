// core/types.ts

import { init } from "next/dist/compiled/webpack/webpack";
import * as THREE from "three";
import { EffectComposer, GLTFLoader } from "three/examples/jsm/Addons.js";


export interface System {
    init(ctx: SceneContext, meshes?: THREE.Mesh[], guiSystem?: GUISystem, opts?:{position: THREE.Vector3}): Promise<void> | void;
    update( dt: number): void;
    dispose(): void;
  }

export interface UpdateParams {
    ctx: SceneContext;
    dt?: number;
}

export interface ControlSystem extends System {
    switchControl: (ctx: SceneContext) => void;
};

export interface GUISystem extends System {
    toggleControl: (ctx: SceneContext, switchControl: (ctx: SceneContext) => void) => void;
    updateLights: (lights: THREE.Light[]) => void;
    updateMeshes: (meshes: THREE.Mesh[]) => void;
}

export interface LightSystem extends System {
    getLights: () => THREE.Light[];
    addComposer: (composer: EffectComposer) => void;
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
        gltf: GLTFLoader;
        texture: THREE.TextureLoader;
        audio: THREE.AudioLoader;
    };
    state: AppState; // your store/event bus
}