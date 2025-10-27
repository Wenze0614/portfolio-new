import { SceneContext, TEXTURE_NAME } from "../core/types";
import * as THREE from "three";

export default async function makeTextureLoaderSys(ctx: SceneContext) {
    const grassTexture = await ctx.loaders.texture.loadAsync('/textures/greenTexture3.png');
    grassTexture.wrapS = grassTexture.wrapT = THREE.MirroredRepeatWrapping;
    grassTexture.repeat.set(1, 1);
    grassTexture.name = "grassTexture";
    grassTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.GRASS_TEXTURE, grassTexture);

    const archieTexture = await ctx.loaders.texture.loadAsync('/textures/maya_baseColor.png');
    archieTexture.name = "archieTexture";
    archieTexture.flipY = false;
    archieTexture.colorSpace = THREE.SRGBColorSpace;
    archieTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.ARCHIE_TEXTURE, archieTexture);

    const heightMap = await ctx.loaders.texture.loadAsync('/textures/terrain_height_3.jpg');
    heightMap.name = "terrainHeightMap";
    heightMap.colorSpace = THREE.NoColorSpace;
    heightMap.wrapS = heightMap.wrapT = THREE.RepeatWrapping;
    heightMap.minFilter = THREE.LinearFilter;
    heightMap.magFilter = THREE.LinearFilter;
    heightMap.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.TERRAIN_HEIGHT_MAP, heightMap);

    const fogNoiseTexture = await ctx.loaders.texture.loadAsync('/textures/noise.png');
    fogNoiseTexture.name = "fogNoiseTexture";
    ctx.state.setTexture(TEXTURE_NAME.FOG_NOISE_TEXTURE, fogNoiseTexture);

    const terrainTexture = await ctx.loaders.texture.loadAsync('/textures/terrain.jpg');
    terrainTexture.name = "terrainTexture";
    terrainTexture.wrapS = terrainTexture.wrapT = THREE.MirroredRepeatWrapping; // or RepeatWrapping if you tile
    terrainTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.TERRAIN_TEXTURE, terrainTexture);

    const windNoiseTexture = await ctx.loaders.texture.loadAsync('/textures/wind-noise-1.png');
    windNoiseTexture.name = "windNoiseTexture";
    windNoiseTexture.wrapS = THREE.MirroredRepeatWrapping;
    windNoiseTexture.wrapT = THREE.MirroredRepeatWrapping;
    windNoiseTexture.repeat.set(1, 1);
    windNoiseTexture.minFilter = THREE.LinearFilter;
    windNoiseTexture.magFilter = THREE.LinearFilter;
    windNoiseTexture.colorSpace = THREE.NoColorSpace;
    windNoiseTexture.generateMipmaps = false;
    windNoiseTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.WIND_NOISE_TEXTURE, windNoiseTexture);

    const pianoTexture = await ctx.loaders.texture.loadAsync('/textures/piano_texture.jpg');
    pianoTexture.flipY = false;
    pianoTexture.colorSpace = THREE.SRGBColorSpace;
    pianoTexture.name = "pianoTexture";
    pianoTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.PIANO_TEXTURE, pianoTexture);

    const barTexture = await ctx.loaders.texture.loadAsync('/textures/bar.png');
    barTexture.flipY = false;
    barTexture.colorSpace = THREE.SRGBColorSpace;
    barTexture.name = "barTexture";
    barTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.BAR_TEXTURE, barTexture);

    const pokeballTexture = await ctx.loaders.texture.loadAsync('/textures/pokeball_BaseColor.png');
    pokeballTexture.flipY = false;
    pokeballTexture.colorSpace = THREE.SRGBColorSpace;
    pokeballTexture.name = "pokeballTexture";
    pokeballTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.POKEBALL_TEXTURE, pokeballTexture);

    const foliageTexture = await ctx.loaders.texture.loadAsync('/textures/trees/foliage-2.png');
    foliageTexture.colorSpace = THREE.NoColorSpace;
    foliageTexture.name = "foliageTexture";
    foliageTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.FOLIAGE_TEXTURE, foliageTexture);

    const treebarkTexture = await ctx.loaders.texture.loadAsync('/textures/trees/tree_trunk_baseColor.png');
    // treebarkTexture.colorSpace = THREE.SRGBColorSpace;
    treebarkTexture.name = "treebarkTexture";
    treebarkTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.TREEBARK_TEXTURE, treebarkTexture);
}