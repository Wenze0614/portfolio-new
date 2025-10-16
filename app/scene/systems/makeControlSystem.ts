// app/scene/systems/makeControlsSystem.ts
import { System, SceneContext, PLockState, OrbitState, CONTROL_TYPE, ControlSystem } from '../core/types';
import { OrbitControls, PointerLockControls } from 'three/examples/jsm/Addons.js';
import { makeHeightSampler } from '../utils/makeHeightSampler';
import * as THREE from 'three';
import { useRef } from 'react';
import { AudioSystem } from './makeAudioSystem';

const onKeyDown = (event: KeyboardEvent, controlState: PLockState) => {
    switch (event.code) {
        case 'KeyW': controlState.move.forward = true; break;
        case 'KeyS': controlState.move.backward = true; break;
        case 'KeyA': controlState.move.left = true; break;
        case 'KeyD': controlState.move.right = true; break;
        case 'ShiftLeft': controlState.move.run = true; break; // Optional: add running
    }
};

const onKeyUp = (event: KeyboardEvent, controlState: PLockState) => {
    switch (event.code) {
        case 'KeyW': controlState.move.forward = false; break;
        case 'KeyS': controlState.move.backward = false; break;
        case 'KeyA': controlState.move.left = false; break;
        case 'KeyD': controlState.move.right = false; break;
        case 'ShiftLeft': controlState.move.run = false; break; // Optional: add running
    }
};

function createPointerLockControls(controlState: PLockState, { scene, camera, renderer }: SceneContext) {
    const walkControl = new PointerLockControls(camera, renderer.domElement);
    // document.addEventListener('click', (e) => {
    //     if (e.target !== renderer.domElement) return;
    //     if (!walkControl.isLocked) walkControl.lock();
    // });

    // scene.add(walkControl.object);
    return walkControl;
}

function createOrbitControl(controlState: OrbitState, { scene, camera, renderer }: SceneContext) {
    const orbitControl = new OrbitControls(camera, renderer.domElement);
    // orbitControl.enabled = true;
    // orbitControl.enableDamping = true;
    orbitControl.target.set(0, 1.6, -1.6);
    orbitControl.update();
    return orbitControl;
}

function updatePointerLockControls(controlState: PLockState, pControl: PointerLockControls, ctx: SceneContext, heightSampler: { heightAtXZ: (x: number, z: number, scale: number, offset: number) => number }, audioSys: AudioSystem) {

    const camera = ctx.camera;

    const { direction, move, speed, bobFrequency, bobAmplitude, baseY } = controlState;

    direction.z = Number(move.forward) - Number(move.backward);
    direction.x = Number(move.right) - Number(move.left);
    direction.normalize();

    // Optional: add running speed
    const velocity = { x: 0, z: 0 };
    velocity.x = direction.x * speed * (move.run ? 5 : 1);
    velocity.z = direction.z * speed * (move.run ? 5 : 1);

    pControl.moveRight(velocity.x);
    pControl.moveForward(velocity.z);

    // Update walk time only if moving
    const isMoving = direction.lengthSq() > 0;
    if (isMoving) {
        controlState.walkTime += 0.1;
        controlState.timeSinceLastStep += 0.1;
    } else {
        controlState.walkTime = 0;
    }

    // Apply bobbing
    const yOffset = isMoving ? Math.sin(controlState.walkTime * bobFrequency) * bobAmplitude : 0;

    // sample ground height under camera (XZ)
    const x = camera.position.x;
    const z = camera.position.z;
    const groundY = heightSampler ? heightSampler.heightAtXZ(x, z, ctx.state.terrainState.heightScale, ctx.state.terrainState.heightOffset) : 0.0;
    camera.position.y = baseY + yOffset + groundY;


    const stepInterval = 2.0; // seconds between steps
    console.log("timeSinceLastStep: ", controlState.timeSinceLastStep);
    if(isMoving && controlState.walkTime > 0.8 &&  controlState.timeSinceLastStep > stepInterval) {
        if(groundY < 0.1) {
            console.log("play step sound");
            audioSys.play("terrainStep");
            controlState.timeSinceLastStep = 0;
        } else {
            audioSys.play("grassStep");
            controlState.timeSinceLastStep = 0;
        }

    }

}

const updateOrbitControls = (oControl: OrbitControls) => {
    oControl.update();
}

export function makeControlsSystem(ctx: SceneContext, audioSys:AudioSystem): ControlSystem {
    let orbit: OrbitControls | null = null;
    let plock: PointerLockControls | null = null;

    // click to lock when orbit is off
    const clickToLock = () => {
        if (plock && orbit) {
            if (!orbit.enabled) plock.lock()
        };
    };

    const terrainWidth = ctx.state.terrainState.terrainWidth;
    const terrainHeight = ctx.state.terrainState.terrainLength;
    //const heightMapRef = useRef<THREE.Texture | null>(null);

    let heightSampler:{
        heightAtXZ(x: number, z: number, heightScale: number, heightOffset: number): number;
    }

    (async () => {
        // if (!heightMapRef.current) {
        //     heightMapRef.current = await ctx.loaders.texture.loadAsync('/textures/terrain_height.jpg');
        // }
        const heightMap = await ctx.loaders.texture.loadAsync('/textures/terrain_height_3.jpg');
        console.log('heightmap width: ', heightMap.image)
        const terrainMin = new THREE.Vector2(-terrainWidth * 0.5, -terrainHeight * 0.5);
        const terrainMax = new THREE.Vector2(terrainWidth * 0.5, terrainHeight * 0.5);
        heightSampler = makeHeightSampler(heightMap, terrainMin, terrainMax, { flipV: true });
    })()

    document.addEventListener('keydown', (e) => onKeyDown(e, ctx.state.controlState as PLockState));
    document.addEventListener('keyup', (e) => onKeyUp(e, ctx.state.controlState as PLockState));

    return {
        init(ctx: SceneContext) {
            plock = createPointerLockControls(ctx.state.controlState as PLockState, ctx);
            orbit = createOrbitControl(ctx.state.controlState as OrbitState, ctx);
            orbit.enableDamping = true;
            orbit.enabled = false;

            switch (ctx.state.controlState.controlType) {
                case CONTROL_TYPE.Walk:
                    ctx.renderer.domElement.addEventListener('click', clickToLock);
                    ctx.scene.add(plock.object);
                    break;
                case CONTROL_TYPE.Orbit:
                    orbit.enabled = true;
                    if (plock.isLocked) plock.unlock();
                    ctx.scene.remove(plock.object);
                    break;
            }

            // store disposers on closures
            (this as any)._cleanup = () => {
                ctx.renderer.domElement.removeEventListener('click', clickToLock);
                // off();
                orbit?.dispose();
            };
        },
        update(ctx: SceneContext) {
            ctx.state.controlState.controlType === 'Walk'
                ? updatePointerLockControls(ctx.state.controlState as PLockState, plock!, ctx, heightSampler, audioSys)
                : updateOrbitControls(orbit!);
        },
        dispose() {
            (this as any)._cleanup?.();
        },
        switchControl(ctx: SceneContext) {
            console.log("switching control to ", ctx.state.controlState.controlType);
            switch (ctx.state.controlState.controlType) {
                case CONTROL_TYPE.Walk:
                    orbit!.enabled = false;
                    ctx.scene.add(plock!.object);
                    ctx.renderer.domElement.addEventListener('click', clickToLock);
                    ctx.camera.position.set(0, 0, 0);
                    break;
                case CONTROL_TYPE.Orbit:
                    ctx.scene.remove(plock!.object);
                    ctx.renderer.domElement.removeEventListener('click', clickToLock);
                    orbit!.enabled = true;
                    if (plock!.isLocked) plock!.unlock();
                    break;
            }
        }
    };
}