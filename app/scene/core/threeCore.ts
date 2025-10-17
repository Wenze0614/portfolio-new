// app/scene/core/threeCore.ts
import * as THREE from 'three';
import { makeState } from './state';
import { SceneContext } from './types';
import { makeLoaders } from './loaders';
import { EffectComposer, RenderPass } from 'three/examples/jsm/Addons.js';

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
        30,
        mount.clientWidth / mount.clientHeight,
        0.1,
        1500
    );
    camera.position.set(-52, 1.6, 52);
    camera.layers.enable(0); // default layer
    // camera.layers.enable(1); // also render layer 1
    scene.add(camera);

    const listener = new THREE.AudioListener();
    camera.add(listener);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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