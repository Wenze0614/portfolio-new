// app/scene/core/state.ts
import * as THREE from 'three';
import { AppState, CONTROL_TYPE, PLockState, OrbitState, TerrainState } from './types';

export function makeState(): AppState {
    const isFullScreen = false; // placeholder, implement fullscreen logic as needed

    let _controlState: PLockState | OrbitState = {
        controlType: CONTROL_TYPE.Walk,
        move: { forward: false, backward: false, left: false, right: false, run: false },
        direction: new THREE.Vector3(),
        walkTime: 0,
        timeSinceLastStep: 0,
        speed: 0.06,
        bobFrequency: 1.5,
        bobAmplitude: 0.02,
        baseY: 1.6,
    } as PLockState;

    const _terrainState: TerrainState = {
        tileSize:25,
        tileResolution:20,
        terrainWidth: 200,
        terrainLength: 200,
        heightScale: 1.0,
        heightOffset: 0.0
    }

    const _windState = {
        windSpeed: 1.0, // default wind speed
        windDirection : new THREE.Vector2(1, 1).normalize(), // default wind direction
    };

    const _fogState = {
        fogColor: new THREE.Color(0xDFE9F3),
    }

    const _postEffectState = {
        bloom: {
            strength: 0.6,
            layer:1,
            radius:0.5,
            threshold:0.6,
        }
    }

    const _walkStateDefaults: PLockState = {
        controlType: CONTROL_TYPE.Walk,
        move: { forward: false, backward: false, left: false, right: false, run: false },
        direction: new THREE.Vector3(),
        walkTime:  0,
        timeSinceLastStep:  0,
        speed: 0.03,
        bobFrequency: 1.5,
        bobAmplitude: 0.02,
        baseY: 1.6,
    }

    const _OrbitStateDefaults: OrbitState = {
        controlType: CONTROL_TYPE.Orbit,
    }

    function setControlType(t: CONTROL_TYPE, options?: Partial<PLockState>) {
        if (t === _controlState.controlType) return;
        _controlState = t === CONTROL_TYPE.Walk
            ? _walkStateDefaults
            : _OrbitStateDefaults;
    }

    return { get controlState() { return _controlState; }, setControlType, get terrainState() { return _terrainState }, get windState() {return _windState}, get fogState() {return _fogState}, get postEffectState() {return _postEffectState},isFullScreen, get walkStateDefaults() { return _walkStateDefaults; } };
}