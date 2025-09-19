// core/types.ts

import { init } from "next/dist/compiled/webpack/webpack";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";


export interface System {
    init(ctx: SceneContext): Promise<void> | void;
    update(ctx: SceneContext, dt?: number): void;
    dispose(): void;
  }

export interface ControlSystem extends System {
    switchControl: (ctx: SceneContext) => void;
};

export interface GUISystem extends System {
    toggleControl: (ctx: SceneContext, switchControl: (ctx: SceneContext) => void) => void;
    updateLights: (lights: THREE.Light[]) => void;
}

export interface LightSystem extends System {
    getLights: () => THREE.Light[];
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
    bobFrequency: number;     // Controls how fast the bobbing is
    bobAmplitude: number;  // Controls how much the camera bobs
    baseY: number;          // Default head height
}

export interface AppState {
    controlState: OrbitState | PLockState;
    setControlType(t: CONTROL_TYPE): void;
    isFullScreen: boolean;
}

export interface SceneContext {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
    clock: THREE.Clock;
    loaders: {
        gltf: GLTFLoader;
        texture: THREE.TextureLoader;
    };
    state: AppState; // your store/event bus
}