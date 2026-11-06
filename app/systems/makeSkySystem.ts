import * as THREE from 'three';
import { ASSET_URLS } from '../core/loaders';
import { SceneContext, System } from '../core/types';
import modifyShader from '../utils/modifyShader';

// makeSkySystem.ts
// This system is responsible for creating and managing the sky in the scene.


export function makeSkySystem(ctx: SceneContext): System {
    //use an HDRI for the sky for now
    const geometry = new THREE.SphereGeometry(1000, 50, 30);
    geometry.scale(-1, 1, 1); // invert normals

    //todo: remove hdr later and use procedural sky
    // The HDR is requested at boot (page.tsx); wait on that same request and attach it when it arrives.
    const material = new THREE.MeshBasicMaterial();
    material.onBeforeCompile = (shader) => {
        modifyShader(shader);
    }
    const skyReady = ctx.loaders.loadHDR(ASSET_URLS.skyHDR).then((skyTexture) => {
        skyTexture.mapping = THREE.EquirectangularReflectionMapping;
        skyTexture.magFilter = THREE.NearestFilter;
        skyTexture.minFilter = THREE.NearestFilter;
        skyTexture.colorSpace = THREE.SRGBColorSpace;
        material.map = skyTexture;
        material.needsUpdate = true; // adding a map changes the shader
    });
    // const cubeImages = [
    //     ctx.loaders.texture.load('/textures/sky/px.png'),
    //     ctx.loaders.texture.load('/textures/sky/nx.png'),
    //     ctx.loaders.texture.load('/textures/sky/py.png'),
    //     ctx.loaders.texture.load('/textures/sky/pz.png'),
    //     ctx.loaders.texture.load('/textures/sky/nz.png'),
    // ]
    // cubeImages.forEach(tex => {
    //     tex.magFilter = THREE.NearestFilter;
    //     tex.minFilter = THREE.NearestFilter;
    //     tex.colorSpace = THREE.SRGBColorSpace;
    // })
    // const skyMat = [
    //     new THREE.MeshBasicMaterial({ map: cubeImages[0], side: THREE.BackSide }),
    //     new THREE.MeshBasicMaterial({ map: cubeImages[1], side: THREE.BackSide }),
    //     new THREE.MeshBasicMaterial({ map: cubeImages[2], side: THREE.BackSide }),
    //     new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }), // blank bottom
    //     new THREE.MeshBasicMaterial({ map: cubeImages[3], side: THREE.BackSide }),
    //     new THREE.MeshBasicMaterial({ map: cubeImages[4], side: THREE.BackSide }),
    // ]

    const skySphere = new THREE.Mesh(geometry, material);
    skySphere.rotateY(Math.PI * 1.5);
    skySphere.position.set(0, 0, 0);
    // ctx.scene.environment = skyTexture;

    // const skyGeo = new THREE.BoxGeometry(1000, 1000, 1000);
    // const skyBox = new THREE.Mesh(skyGeo, skyMat);
    // skyBox.position.set(0.0, 0.0, 0.0);
    // ctx.scene.add(skyBox);
    // ctx.scene.fog = new THREE.FogExp2(0xefd1b5, 0.00025);

    ctx.scene.add(skySphere);
    // ctx.scene.background = skyTexture;
    // ctx.scene.environment = skyTexture;

    // 1) Sky mesh (infinite-looking)
    // const sky = new Sky();
    // sky.scale.setScalar(10000);
    // ctx.scene.add(sky);

    // const sun = new THREE.Vector3();
    // const phi = THREE.MathUtils.degToRad(90 - 15); // elevation
    // const theta = THREE.MathUtils.degToRad(90);      // azimuth
    // sun.setFromSphericalCoords(1, phi, theta);

    // // 3) Sky params (tweak for style)
    // const skyMat = sky.material;
    // skyMat.uniforms['turbidity'].value = 2.0;
    // skyMat.uniforms['rayleigh'].value = 1.2;
    // skyMat.uniforms['mieCoefficient'].value = 0.005;
    // skyMat.uniforms['mieDirectionalG'].value = 0.8;
    // skyMat.uniforms['sunPosition'].value.copy(sun);

    return {
        init() {
            // resolves once the sky texture is attached
            return skyReady;
        },
        update( dt: number) {
            //skySphere.rotation.y = 0.0001 * (dt || 0); // Slow rotation for dynamic effect
        },
        dispose() {
        }
    }
}