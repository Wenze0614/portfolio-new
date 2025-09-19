// app/scene/core/state.ts
import * as THREE from 'three';
import { AppState, CONTROL_TYPE, PLockState, OrbitState } from './types';

export function makeState(): AppState {
    const isFullScreen = false; // placeholder, implement fullscreen logic as needed

    let _controlState: PLockState | OrbitState = {
        controlType: CONTROL_TYPE.Walk,
        move: { forward: false, backward: false, left: false, right: false, run: false },
        direction: new THREE.Vector3(),
        walkTime: 0,
        speed: 0.03,
        bobFrequency: 1.5,
        bobAmplitude: 0.02,
        baseY: 1.6,
    } as PLockState;

    function setControlType(t: CONTROL_TYPE, options?: Partial<PLockState>) {
        if (t === _controlState.controlType) return;
        _controlState = t === CONTROL_TYPE.Walk
            ? {
                controlType: CONTROL_TYPE.Walk,
                move: { forward: false, backward: false, left: false, right: false, run: false },
                direction: new THREE.Vector3(),
                walkTime: options?.walkTime ?? 0,
                speed: options?.speed ?? 0.03,
                bobFrequency: options?.bobFrequency ?? 1.5,
                bobAmplitude: options?.bobAmplitude ?? 0.02,
                baseY: options?.baseY ?? 1.6,
            }
            : { controlType: CONTROL_TYPE.Orbit } as OrbitState;
    }

    return { get controlState() { return _controlState; }, setControlType, isFullScreen, };
}