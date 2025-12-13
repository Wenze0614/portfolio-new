// app/scene/systems/makeControlsSystem.ts
import { System, SceneContext, PLockState, OrbitState, CONTROL_TYPE, ControlSystem, TEXTURE_NAME } from '../core/types';
import { OrbitControls, PointerLockControls } from 'three/examples/jsm/Addons.js';
import { makeHeightSampler } from '../utils/makeHeightSampler';
import * as THREE from 'three';
import { AudioSystem } from './makeAudioSystem';
import { Octree } from "three/examples/jsm/math/Octree.js";
import { Capsule } from "three/examples/jsm/math/Capsule.js";

// import nipplejs from 'nipplejs';


const onKeyDown = (event: KeyboardEvent, controlState: PLockState, ctx: SceneContext) => {
    if (ctx.state.controlState.controlType !== CONTROL_TYPE.Walk) return;
    switch (event.code) {
        case 'KeyW': controlState.move.forward = true; break;
        case 'KeyS': controlState.move.backward = true; break;
        case 'KeyA': controlState.move.left = true; break;
        case 'KeyD': controlState.move.right = true; break;
        case 'ShiftLeft': controlState.move.run = true; break; // Optional: add running
    }
};

const onKeyUp = (event: KeyboardEvent, controlState: PLockState, ctx: SceneContext) => {
    if (ctx.state.controlState.controlType !== CONTROL_TYPE.Walk) return;
    switch (event.code) {
        case 'KeyW': controlState.move.forward = false; break;
        case 'KeyS': controlState.move.backward = false; break;
        case 'KeyA': controlState.move.left = false; break;
        case 'KeyD': controlState.move.right = false; break;
        case 'ShiftLeft': controlState.move.run = false; break; // Optional: add running
    }
};

const WORLD_BOUNDS = {
    minX: -50,
    maxX: 50,
    minZ: -50,
    maxZ: 50,
};

// function addTouchLook(pControl: PointerLockControls, domElement: HTMLElement) {
//     let startX = 0;
//     let startY = 0;
//     let isDragging = false;

//     // optional: vertical rotation clamp
//     const maxPitch = Math.PI / 2 - 0.1; // ~89°
//     const minPitch = -Math.PI / 2 + 0.1;

//     // these refer to the internal objects in PointerLockControls
//     const pitchObject = pControl.getObject().children[0]; // camera holder
//     const yawObject = pControl.getObject();

//     domElement.addEventListener('touchstart', (e) => {
//         if (e.touches.length === 1) {
//             isDragging = true;
//             startX = e.touches[0].clientX;
//             startY = e.touches[0].clientY;
//         }
//     });

//     domElement.addEventListener('touchmove', (e) => {
//         if (!isDragging) return;

//         const touch = e.touches[0];
//         const dx = (touch.clientX - startX) * 0.0025; // sensitivity
//         const dy = (touch.clientY - startY) * 0.0025;

//         startX = touch.clientX;
//         startY = touch.clientY;

//         // apply yaw (left/right rotation)
//         yawObject.rotation.y -= dx;

//         // apply pitch (up/down rotation)
//         pitchObject.rotation.x -= dy;
//         pitchObject.rotation.x = Math.max(
//             minPitch,
//             Math.min(maxPitch, pitchObject.rotation.x)
//         );
//     });

//     domElement.addEventListener('touchend', () => {
//         isDragging = false;
//     });
// }

function createJoystickZone(): HTMLElement {
    let zone = document.getElementById('joystick-zone') as HTMLElement | null;
    if (!zone) {
        zone = document.createElement('div');
        zone.id = 'joystick-zone';
        Object.assign(zone.style, {
            position: 'absolute',
            left: '0',
            bottom: '0',
            width: '40vw',     // covers lower-left corner
            height: '40vh',
            touchAction: 'none',
            zIndex: '10',      // on top of canvas for input
        });
        document.body.appendChild(zone);
    }
    return zone;
}

function pointInRect(x: number, y: number, rect: DOMRect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

async function setupMobileControls(plock: PointerLockControls, ctx: SceneContext, controlState: PLockState) {
    // Guard SSR
    if (typeof window === 'undefined') return;
    if (!/Mobi|Android|iPhone/i.test(navigator.userAgent)) return;

    // dynamic import (client only)
    const { default: nipplejs } = await import('nipplejs');

    const zoneEl = createJoystickZone();

    // create joystick
    const joystick = nipplejs.create({
        zone: zoneEl,       // or a dedicated overlay div
        mode: 'dynamic',
        // position: { left: '25%', bottom: '25%' },
        color: 'white',
        size: 120,
    });

    const moveHandler = (_evt: any, data: any) => {
        if (ctx.state.controlState.controlType !== CONTROL_TYPE.Walk) return;
        const { x, y } = data.vector; // [-1..1]
        controlState.move.forward = (y > -0.3);
        controlState.move.backward = (y < 0.3);
        controlState.move.left = (x < -0.3);
        controlState.move.right = (x > 0.3);
    };
    const endHandler = () => {
        if (ctx.state.controlState.controlType !== CONTROL_TYPE.Walk) return;
        controlState.move.forward = controlState.move.backward =
            controlState.move.left = controlState.move.right = false;
    };

    joystick.on('move', moveHandler);
    joystick.on('end', endHandler);

    // drag-to-look (touch) — emulate pointer lock mouse deltas
    //horizontal (yaw) and vertical (pitch) rotation
    const pitchObject = plock.getObject().children[0] as THREE.Object3D; // camera holder
    const yawObject = plock.getObject();

    let startX = 0, startY = 0, dragging = false;
    const minPitch = -Math.PI / 2 + 0.1, maxPitch = Math.PI / 2 - 0.1;
    const sens = 0.0025;

    const el = ctx.renderer.domElement;

    const onStart = (e: TouchEvent) => {
        // if (e.touches.length !== 1) return;
        const joystickRect = zoneEl.getBoundingClientRect();
        if (pointInRect(e.touches[0].clientX, e.touches[0].clientY, joystickRect)) return; // ignore if touching joystick area
        dragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
        if (!dragging) return;
        const t = e.touches[0];
        const dx = (t.clientX - startX) * sens;
        const dy = (t.clientY - startY) * sens;
        startX = t.clientX;
        startY = t.clientY;

        yawObject.rotation.y -= dx;
        pitchObject.rotation.x = THREE.MathUtils.clamp(pitchObject.rotation.x - dy, minPitch, maxPitch);
    };
    const onEnd = () => { dragging = false; };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });

    // Return a disposer so your system can clean up
    return () => {
        try {
            joystick.off('move', moveHandler);
            joystick.off('end', endHandler);
            joystick.destroy();
        } catch { }
        el.removeEventListener('touchstart', onStart as any);
        el.removeEventListener('touchmove', onMove as any);
        el.removeEventListener('touchend', onEnd as any);
    };
}
function createPointerLockControls(controlState: PLockState, ctx: SceneContext) {


    const walkControl = new PointerLockControls(ctx.camera, ctx.renderer.domElement);

    // if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    //     const joystick = nipplejs.create({
    //         zone: ctx.renderer.domElement,
    //         mode: 'static',
    //         position: { left: '20%', bottom: '20%' }
    //     });
    //     joystick.on('move', (evt, data) => {
    //         const { x, y } = data.vector; // values in [-1..1]
    //         if (ctx.state.controlState.controlType !== CONTROL_TYPE.Walk) return;
    //         ctx.state.controlState.move.forward = (y < -0.3);
    //         ctx.state.controlState.move.backward = (y > 0.3);
    //         ctx.state.controlState.move.left = (x < -0.3);
    //         ctx.state.controlState.move.right = (x > 0.3);
    //     });
    //     joystick.on('end', () => {
    //         if (ctx.state.controlState.controlType !== CONTROL_TYPE.Walk) return;
    //         ctx.state.controlState.move.forward = false;
    //         ctx.state.controlState.move.backward = false;
    //         ctx.state.controlState.move.left = false;
    //         ctx.state.controlState.move.right = false;
    //     });
    //     addTouchLook(walkControl, ctx.renderer.domElement);
    // }

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
    orbitControl.target.set(-35, 2.2, 50);
    orbitControl.update();
    return orbitControl;
}

function updatePointerLockControls(controlState: PLockState, pControl: PointerLockControls, ctx: SceneContext, heightSampler: { heightAtXZ: (x: number, z: number, scale: number, offset: number) => number }, audioSys: AudioSystem, playerCollider: Capsule, worldOctree: Octree) {

    const camera = ctx.camera;

    const { direction, move, speed, bobFrequency, bobAmplitude, baseY } = controlState;

    direction.z = Number(move.forward) - Number(move.backward);
    direction.x = Number(move.right) - Number(move.left);
    direction.normalize();

    // Optional: add running speed
    const velocity = { x: 0, z: 0 };
    velocity.x = direction.x * speed * (move.run ? 5 : 1);
    velocity.z = direction.z * speed * (move.run ? 5 : 1);

    const forward = new THREE.Vector3();
    ctx.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, ctx.camera.up).normalize();

    // world-space movement this frame
    const deltaMove = new THREE.Vector3()
        .addScaledVector(right, velocity.x)
        .addScaledVector(forward, velocity.z);

    playerCollider.translate(deltaMove);


    // collision test
    const hit = worldOctree.capsuleIntersect(playerCollider);
    if (hit) {
        // push capsule out of wall
        playerCollider.translate(hit.normal.multiplyScalar(hit.depth));

        // optional: remove velocity into wall (sliding)
        deltaMove.addScaledVector(hit.normal, -hit.normal.dot(deltaMove));
    }

    const dx = playerCollider.end.x - playerCollider.start.x;
    const dy = playerCollider.end.y - playerCollider.start.y;
    const dz = playerCollider.end.z - playerCollider.start.z;

    // Clamp end position
    const clampedX = THREE.MathUtils.clamp(
        playerCollider.end.x,
        WORLD_BOUNDS.minX,
        WORLD_BOUNDS.maxX
    );

    const clampedZ = THREE.MathUtils.clamp(
        playerCollider.end.z,
        WORLD_BOUNDS.minZ,
        WORLD_BOUNDS.maxZ
    );

    // If clamped, move entire capsule consistently
    if (clampedX !== playerCollider.end.x || clampedZ !== playerCollider.end.z) {
        playerCollider.end.set(clampedX, playerCollider.end.y, clampedZ);
        playerCollider.start.set(
            clampedX - dx,
            playerCollider.start.y,
            clampedZ - dz
        );
    }

    // sync camera to capsule
    ctx.camera.position.copy(playerCollider.end);

    // pControl.moveRight(velocity.x);
    // pControl.moveForward(velocity.z);

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
    // console.log("timeSinceLastStep: ", controlState.timeSinceLastStep);
    if (isMoving && controlState.walkTime > 0.8 && controlState.timeSinceLastStep > stepInterval) {
        if (groundY < 0.1) {
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

export function makeControlsSystem(ctx: SceneContext, audioSys: AudioSystem): ControlSystem {
    let orbit: OrbitControls | null = null;
    let plock: PointerLockControls | null = null;
    let disposeMobileControls: (() => void) | undefined;
    const camPos = ctx.camera.position.clone();
    // Player capsule (radius ~0.35, height ~1.6)
    const playerCollider = new Capsule(
        new THREE.Vector3(
            camPos.x,
            camPos.y - ctx.state.cameraHeight + 0.2,
            camPos.z
        ),
        new THREE.Vector3(
            camPos.x,
            camPos.y,
            camPos.z
        ),
        0.35
    );
    // playerCollider.translate(ctx.camera.position);
    const worldOctree = new Octree();

    // click to lock when orbit is off
    const clickToLock = () => {
        if (plock && orbit) {
            if (!orbit.enabled) plock.lock()
        };
    };

    const terrainWidth = ctx.state.terrainState.terrainWidth;
    const terrainHeight = ctx.state.terrainState.terrainLength;
    //const heightMapRef = useRef<THREE.Texture | null>(null);

    let heightSampler: {
        heightAtXZ(x: number, z: number, heightScale: number, heightOffset: number): number;
    }

    (async () => {
        const heightMap = ctx.state.getTexture(TEXTURE_NAME.TERRAIN_HEIGHT_MAP);
        // console.log('heightmap width: ', heightMap.image)
        const terrainMin = new THREE.Vector2(-terrainWidth * 0.5, -terrainHeight * 0.5);
        const terrainMax = new THREE.Vector2(terrainWidth * 0.5, terrainHeight * 0.5);
        heightSampler = makeHeightSampler(heightMap, terrainMin, terrainMax, { flipV: true });
    })()

    document.addEventListener('keydown', (e) => onKeyDown(e, ctx.state.controlState as PLockState, ctx));
    document.addEventListener('keyup', (e) => onKeyUp(e, ctx.state.controlState as PLockState, ctx));


    return {
        async init(ctx: SceneContext) {
            plock = createPointerLockControls(ctx.state.controlState as PLockState, ctx);
            orbit = createOrbitControl(ctx.state.controlState as OrbitState, ctx);
            orbit.enableDamping = true;
            orbit.enabled = false;

            disposeMobileControls = await setupMobileControls(plock, ctx, ctx.state.controlState as PLockState);

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
        update(dt: number) {
            ctx.state.controlState.controlType === 'Walk'
                ? updatePointerLockControls(ctx.state.controlState as PLockState, plock!, ctx, heightSampler, audioSys, playerCollider, worldOctree)
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
        },
        buildCollisionOctree(collidersGroup: THREE.Group) {
            // Put ALL static collidable level geometry under one group (walls/floor/etc)
            worldOctree.fromGraphNode(collidersGroup);



            // Store velocity between frames if you want smoother motion
            // const playerVelocity = new THREE.Vector3();
        }

    };
}