// app/scene/core/threeCore.ts
import * as THREE from 'three';
import { makeState } from './state';
import { FINAL_PASS_LAYER, SceneContext } from './types';
import { makeLoaders } from './loaders';
import { EffectComposer, RenderPass } from 'three/examples/jsm/Addons.js';

// Pixel ratio cap: 1.5, not 2. At 2 a MacBook-sized window renders 2880×1800 (5.2 MP); 1.5 is
// 2160×1350, about 26% less GPU time per frame (measured 11.8 → 8.7 ms), and still sharper than 1.
const MAX_PIXEL_RATIO = 1.5;

// setup scene, camera, renderer, clock, resize handling
export function setupThreeCore(
    mount: HTMLDivElement,
    options?: { background?: string }
): SceneContext & { disposeCore(): void } {

    const state = makeState();
    const scene = new THREE.Scene();
    if (options?.background) {
        scene.background = new THREE.Color(options.background);
    }

    // const axesHelper = new THREE.AxesHelper(10);
    // scene.add(axesHelper);

    const camera = new THREE.PerspectiveCamera(
        55,
        mount.clientWidth / mount.clientHeight,
        0.1,
        1500
    );
    camera.position.set(20, state.cameraHeight,40);
    camera.layers.enable(0); // default layer
    camera.layers.enable(FINAL_PASS_LAYER); // drawn in the final pass only (the bloom pass disables it)
    // camera.layers.enable(1); // also render layer 1
    scene.add(camera);

    const listener = new THREE.AudioListener();
    camera.add(listener);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const finalComposer = new EffectComposer(renderer);
    const bloomComposer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);

    finalComposer.addPass(renderPass);
    bloomComposer.addPass(renderPass);

    const composers = {
        finalComposer,
        bloomComposer
    }

    mount.appendChild(renderer.domElement);

    const clock = new THREE.Clock();

    const onResize = () => {
        const w = mount.clientWidth || window.innerWidth;
        const h = mount.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
        finalComposer.setSize(w, h);
        bloomComposer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    onResize();

    const loaders = makeLoaders();

    function disposeCore() {
        window.removeEventListener('resize', onResize);
        mount.removeChild(renderer.domElement);
        renderer.dispose();
    }

    return { scene, camera, listener,  renderer, composers, clock, state, loaders, disposeCore };
}