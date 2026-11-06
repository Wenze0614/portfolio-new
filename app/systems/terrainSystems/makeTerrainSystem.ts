import { FINAL_PASS_LAYER, SceneContext, System, TEXTURE_NAME } from "../../core/types";
import * as THREE from "three";
import makeGrassSystem from "./makeGrassSystem";
import vertexShader from "../../shaders/terrainShaders/vertex.vert";
import fragmentShader from "../../shaders/terrainShaders/fragment.frag";


export default function makeTerrainSystem(ctx: SceneContext): System {
    let grassSystem: System;

    const terrainTexture = ctx.state.getTexture(TEXTURE_NAME.TERRAIN_TEXTURE);
 
    const grassTexture = ctx.state.getTexture(TEXTURE_NAME.GRASS_TEXTURE);

    // load heightmap as DATA (linear), not sRGB
    const heightMap = ctx.state.getTexture(TEXTURE_NAME.TERRAIN_HEIGHT_MAP);

    const windNoise = ctx.state.getTexture(TEXTURE_NAME.WIND_NOISE_TEXTURE);

    const W = ctx.state.terrainState.terrainWidth, L = ctx.state.terrainState.terrainLength;         // world size (x,z)
    // const RES_X = 256, RES_Z = 256; // vertices; start modest, increase if needed
    // const geom = new THREE.PlaneGeometry(W, L, RES_X, RES_Z);
    // geom.rotateX(-Math.PI / 2);     // make it XZ plane, Y up

    const tileSize = ctx.state.terrainState.tileSize;
    const tileRes = ctx.state.terrainState.tileResolution;

    // Start from lambert uniforms (has ambient, directional, etc.)
    const baseUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.lambert.uniforms);
    const customUniforms = {
        terrainSize: { value: new THREE.Vector2(W, L) },
        heightMap: { value: heightMap },
        heightScale: { value: ctx.state.terrainState.heightScale },            // world units of relief
        heightOffset: { value: ctx.state.terrainState.heightOffset },             // base Y
        texel: { value: new THREE.Vector2(1 / 4096, 1 / 4096) }, // texture texel, used for derivative and normal calc
        terrainColorMap: { value: terrainTexture },
        uWindSpeed: { value: ctx.state.windState.windSpeed },
        uWindDirection: { value: ctx.state.windState.windDirection },
        windNoise: { value: windNoise },
        time: { value: 0 },
        grassMask: { value: heightMap },
        grassTexture: { value: grassTexture },
        terrainTexture: { value: terrainTexture },
        textureTileSize: { value: 25 }
    };
    const terrainUniforms = THREE.UniformsUtils.merge([baseUniforms, customUniforms]);

    //console.log('terrain uniforms:', terrainUniforms);

    const terrainMat = new THREE.ShaderMaterial({
        uniforms: terrainUniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        lights: true,
        fog: true,
    });
    // const terrain = new THREE.Mesh(geom, terrainMat);
    // terrain.receiveShadow = true;
    //terrain.castShadow = true;

    const terrainTileIM = new THREE.InstancedMesh(
        new THREE.PlaneGeometry(tileSize, tileSize, tileRes, tileRes).rotateX(-Math.PI / 2),
        terrainMat,
        (ctx.state.terrainState.terrainWidth / tileSize) * (ctx.state.terrainState.terrainLength / tileSize)
    )

    terrainTileIM.frustumCulled = false; // todo: update the bounding box instead
    terrainTileIM.layers.set(FINAL_PASS_LAYER); // skip the bloom pass (see FINAL_PASS_LAYER)

    // custom depth material for shadows
    const depthMat = new THREE.MeshDepthMaterial({
        depthPacking: THREE.RGBADepthPacking,
    });

    depthMat.onBeforeCompile = (shader) => {
        // add height uniforms
        shader.uniforms.heightMap = { value: heightMap };  // NoColorSpace
        shader.uniforms.heightScale = { value: ctx.state.terrainState.heightScale };
        shader.uniforms.heightOffset = { value: ctx.state.terrainState.heightOffset };
        shader.uniforms.terrainWidth = { value: ctx.state.terrainState.terrainWidth };
        shader.uniforms.terrainLength = { value: ctx.state.terrainState.terrainLength };

        // inject the same displacement used in the visible vertex shader:
        shader.vertexShader = shader.vertexShader
            .replace(
                '#include <common>',
                `#include <common>
             uniform sampler2D heightMap;
             uniform float heightScale;
             uniform float heightOffset;
             uniform vec2 texel;
             uniform float terrainWidth;
             uniform float terrainLength;`
            )
            .replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
             // UVs on PlaneGeometry are vec2 uv (0..1). If you flipped V elsewhere, mirror here too.
             float h = texture2D(heightMap, uv).r;
             transformed.y = heightOffset + h * heightScale;`
            );
    };

    //terrain.customDepthMaterial = depthMat;
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
            ctx.scene.add(terrainTileIM);

            grassSystem = makeGrassSystem(ctx, heightMap, terrainTexture, windNoise, heightMap);
            grassSystem.init(ctx);

            // const largeTerrain  = new THREE.Mesh(
            //     new THREE.PlaneGeometry(32000, 32000, 1, 1).rotateX(-Math.PI / 2),
            //     new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.62, 0.24) })
            // );
            // largeTerrain.position.y = -0.3;
            // ctx.scene.add(largeTerrain);
        },
        update(dt: number) {
            terrainMat.uniforms.time.value = dt;
            if (grassSystem) {
                grassSystem.update(dt);
            }
        },
        dispose() { }
    }
}