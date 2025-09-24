import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { SceneContext, System } from '../core/types';

// makeSkySystem.ts
// This system is responsible for creating and managing the sky in the scene.


export function makeSkySystem(ctx: SceneContext): System {
    //use an HDRI for the sky for now
    const rgbeLoader = new RGBELoader();
    const geometry = new THREE.SphereGeometry(1000, 60, 40);
    geometry.scale(-1, 1, 1); // invert normals

    //todo: remove hdr later and use procedural sky
    const skyTexture = rgbeLoader.load('/textures/sky-night.hdr');
    skyTexture.mapping = THREE.EquirectangularReflectionMapping;
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: skyTexture });
    const skySphere = new THREE.Mesh(geometry, material);
    ctx.scene.add(skySphere);
    
    return {
        init() {
            // Initialization logic if needed
        },     
        update(ctx: SceneContext, dt?: number) {
            skySphere.rotation.y = 0.0001 * (dt || 0); // Slow rotation for dynamic effect
        },
        dispose() {
        }
    }
}