import { SceneContext, System } from "../core/types";
import * as THREE from "three";
import makeGrassSystem from "./makeGrassSystem";
import vertexShader from "../shaders/terrainShaders/vertex.vert";
import fragmentShader from "../shaders/terrainShaders/fragment.frag";


export default function makeTerrainSystem(ctx: SceneContext): System {
    let grassSystem: System;

    const terrainTexture = ctx.loaders.texture.load('/textures/terrain-5.png');
    // terrainTexture.flipY = false;
    terrainTexture.wrapS = terrainTexture.wrapT = THREE.ClampToEdgeWrapping; // or RepeatWrapping if you tile
    terrainTexture.anisotropy = ctx.renderer.capabilities.getMaxAnisotropy?.() || 1;
    terrainTexture.needsUpdate = true;

    // load heightmap as DATA (linear), not sRGB
    const heightMap = ctx.loaders.texture.load('/textures/terrain_height.jpg');
    // heightMap.flipY = false;
    heightMap.colorSpace = THREE.NoColorSpace;
    heightMap.wrapS = heightMap.wrapT = THREE.ClampToEdgeWrapping;
    heightMap.minFilter = THREE.LinearFilter;
    heightMap.magFilter = THREE.LinearFilter;

    const windNoise = ctx.loaders.texture.load('/textures/wind-noise-1.png');
    windNoise.wrapS = THREE.RepeatWrapping;
    windNoise.wrapT = THREE.RepeatWrapping;
    windNoise.repeat.set(1, 1);
    windNoise.minFilter = THREE.LinearFilter;
    windNoise.magFilter = THREE.LinearFilter;
    windNoise.colorSpace = THREE.NoColorSpace;
    windNoise.generateMipmaps = false;
    windNoise.needsUpdate = true;

    const grassMask = ctx.loaders.texture.load('/textures/terrain_grassmask.png');
    // grassMask.flipY = false;
    grassMask.needsUpdate = true;

    const W = ctx.state.terrainState.terrainWidth, L = ctx.state.terrainState.terrainLength;         // your world size (x,z)
    const RES_X = 256, RES_Z = 512; // vertices; start modest, increase if needed
    const geom = new THREE.PlaneGeometry(W, L, RES_X, RES_Z);
    geom.rotateX(-Math.PI / 2);     // make it XZ plane, Y up

    const terrainMat = new THREE.ShaderMaterial({
        uniforms: {
            terrainSize: { value: new THREE.Vector2(W, L) },
            heightMap: { value: heightMap },
            heightScale: { value: ctx.state.terrainState.heightScale },            // world units of relief
            heightOffset: { value: ctx.state.terrainState.heightOffset },             // base Y
            texel: { value: new THREE.Vector2(1 / 1024, 1 / 2048) }, // if your map is 1024x2048
            terrainColorMap: { value: terrainTexture },
            uWindSpeed: { value: ctx.state.windState.windSpeed },
            uWindDirection: { value: ctx.state.windState.windDirection },
            windNoise: { value: windNoise },
            time: { value: 0 },
            grassMask: {value: grassMask}
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    });
    const terrain = new THREE.Mesh(geom, terrainMat);
    terrain.receiveShadow = true;
    return {
        init(ctx: SceneContext) {


            // ctx.loaders.gltf.load('/models/terrain.glb', (gltf) => {
            //     const model = gltf.scene;
            //     const terrain = model.getObjectByName('terrain');
            //     if (terrain && terrain instanceof THREE.Mesh) {
            //         terrain.material = new THREE.MeshToonMaterial({
            //             map: terrainTexture,
            //         });
            //         terrain.receiveShadow = true;
            //     }
            //     ctx.scene.add(model);
            //     console.log("model loaded:", model);
            // }, undefined, (error) => {
            //     console.error('An error happened while loading the model:', error);
            // });
            ctx.scene.add(terrain);

            grassSystem = makeGrassSystem(ctx, heightMap, terrainTexture, windNoise, grassMask);
            grassSystem.init(ctx);
        },
        update(ctx: SceneContext, dt: number) {
            terrainMat.uniforms.time.value = dt;
            if (grassSystem) {
                grassSystem.update(ctx, dt);
            }
        },
        dispose() { }
    }
}