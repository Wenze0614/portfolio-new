// app/scene/core/state.ts
import * as THREE from 'three';
import { AppState, CONTROL_TYPE, PLockState, OrbitState, TerrainState, TextureDict, TEXTURE_NAME, VideoTextureDict, VIDEOTEXTURE_NAME } from './types';

export function makeState(): AppState {
    const isFullScreen = false; // placeholder, implement fullscreen logic as needed

    const cameraHeight = 2.2;

    let _controlState: PLockState | OrbitState = {
        controlType: CONTROL_TYPE.Walk,
        move: { forward: false, backward: false, left: false, right: false, run: false },
        direction: new THREE.Vector3(),
        walkTime: 0,
        timeSinceLastStep: 0,
        speed: 0.06,
        bobFrequency: 1.5,
        bobAmplitude: 0.02,
        baseY: cameraHeight,
    } as PLockState;

    const _terrainState: TerrainState = {
        tileSize: 25,
        tileResolution: 20,
        terrainWidth: 200,
        terrainLength: 200,
        heightScale: 0.4,
        heightOffset: 0.0
    }

    const _windState = {
        windSpeed: 1.0, // default wind speed
        windDirection: new THREE.Vector2(1, 1).normalize(), // default wind direction
        windStrength: 0.12
    };

    const _fogState = {
        fogColor: new THREE.Color(0xDFE9F3),
    }

    const _postEffectState = {
        bloom: {
            strength: 0.8,
            layer: 1,
            radius: 0.7,
            threshold: 0.01,
        }
    }

    const _walkStateDefaults: PLockState = {
        controlType: CONTROL_TYPE.Walk,
        move: { forward: false, backward: false, left: false, right: false, run: false },
        direction: new THREE.Vector3(),
        walkTime: 0,
        timeSinceLastStep: 0,
        speed: 0.03,
        bobFrequency: 1.5,
        bobAmplitude: 0.02,
        baseY: cameraHeight,
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

    const textures: TextureDict = {
        grassTexture: undefined,
        archieTexture: undefined,
        terrainHeightMap: undefined,
        fogNoiseTexture: undefined,
        terrainTexture: undefined,
        windNoiseTexture: undefined,
        pianoTexture: undefined,
        barTexture: undefined,
        pokeballTexture: undefined,
        foliageTexture: undefined,
        treebarkTexture: undefined,
        starTexture: undefined,
        minecraftTexture: undefined,
        minecraftRoofTexture:undefined,
        minecraftWoodTexture:undefined,
        houseTexture: undefined,
        textureSetTwo: undefined,
        textureSetThree: undefined,
        rotomTexture: undefined,
        textureSetFour: undefined,
        archiePhoto: undefined,
        certificate: undefined,
        leafTexture: undefined,
        pikachuStatueTexture: undefined,
        bootTexture: undefined,
        woodTexture: undefined,
        wallTexture: undefined,
        bookCover: undefined,
        jolteonIcon: undefined,
        zTexture: undefined,
        cdCover: undefined,
    };
    function setTexture(name: TEXTURE_NAME, texture: THREE.Texture) {
        textures[name] = texture;
    }

    const placeHolderTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); //placeholder white texture
    function getTexture(name: TEXTURE_NAME): THREE.Texture {
        if (textures[name] === undefined) {
            console.warn(`Texture ${name} not found in state.`);
            return placeHolderTexture;
        }
        return textures[name];
    }

    const videoTextures: VideoTextureDict = {
        singing1: undefined,
    }

    function setVideoTexture(name: VIDEOTEXTURE_NAME, texture: THREE.VideoTexture) {
        videoTextures[name] = texture;
    }

    function getVideoTexture(name: VIDEOTEXTURE_NAME): THREE.VideoTexture {
        if (videoTextures[name] === undefined) {
            console.warn(`Video Texture ${name} not found in state.`);
            return THREE.VideoTexture.prototype;
        }
        return videoTextures[name];
    }


    return { get controlState() { return _controlState; }, setControlType, get terrainState() { return _terrainState }, get windState() { return _windState }, get fogState() { return _fogState }, get postEffectState() { return _postEffectState }, isFullScreen, get walkStateDefaults() { return _walkStateDefaults; }, setTexture, getTexture, setVideoTexture, getVideoTexture, cameraHeight };
};
