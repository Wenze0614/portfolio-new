import { SceneContext, TEXTURE_NAME } from "../core/types";
import * as THREE from "three";

export default async function makeTextureLoaderSys(ctx: SceneContext) {
    const pGrassTexture = await ctx.loaders.texture.loadAsync('/textures/greenTexture3.png');
    const pArchieTexture = await ctx.loaders.texture.loadAsync('/textures/maya_baseColor.png');
    const pHeightMap = await ctx.loaders.texture.loadAsync('/textures/terrain_height_4.jpg');
    const pFogNoiseTexture = await ctx.loaders.texture.loadAsync('/textures/noise.png');
    const pTerrainTexture = await ctx.loaders.texture.loadAsync('/textures/terrain.jpg');
    const pWindNoiseTexture = await ctx.loaders.texture.loadAsync('/textures/wind-noise-1.png');
    const pPianoTexture = await ctx.loaders.texture.loadAsync('/textures/piano.jpg');
    const pBarTexture = await ctx.loaders.texture.loadAsync('/textures/bar_2.jpg');
    const pPokeballTexture = await ctx.loaders.texture.loadAsync('/textures/pokeball_BaseColor.png');
    const pMinecraftTexture = await ctx.loaders.texture.loadAsync('/textures/minecraft.png');
    const pMinecraftWoodTexture = await ctx.loaders.texture.loadAsync('/textures/wood.jpg');
    const pMinecraftRoofTexture = await ctx.loaders.texture.loadAsync('/textures/roof.jpg');
    const pFoliageTexture = await ctx.loaders.texture.loadAsync('/textures/trees/foliage-2.png');
    const pTreebarkTexture = await ctx.loaders.texture.loadAsync('/textures/trees/tree_trunk_baseColor.png');
    const pStarTexture = await ctx.loaders.texture.loadAsync('/textures/star.png');
    const pHouseTexture = await ctx.loaders.texture.loadAsync('/textures/TextureSetOne.webp');

    //const pokeballTexture = await ctx.loaders.texture.loadAsync('/textures/pokeball_BaseColor.png');
    const [grassTexture, archieTexture, heightMap, fogNoiseTexture, terrainTexture, windNoiseTexture, pianoTexture, barTexture, pokeballTexture, minecraftTexture, minecraftWoodTexture, minecraftRoofTexture, foliageTexture, treebarkTexture, starTexture, houseTexture] = 
    await Promise.all([pGrassTexture, pArchieTexture, pHeightMap, pFogNoiseTexture,pTerrainTexture, pWindNoiseTexture, pPianoTexture, pBarTexture, pPokeballTexture,  pMinecraftTexture, pMinecraftWoodTexture, pMinecraftRoofTexture, pFoliageTexture, pTreebarkTexture, pStarTexture, pHouseTexture]);


    grassTexture.wrapS = grassTexture.wrapT = THREE.MirroredRepeatWrapping;
    grassTexture.repeat.set(1, 1);
    grassTexture.name = "grassTexture";
    grassTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.GRASS_TEXTURE, grassTexture);


    archieTexture.name = "archieTexture";
    archieTexture.flipY = false;
    archieTexture.colorSpace = THREE.SRGBColorSpace;
    archieTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.ARCHIE_TEXTURE, archieTexture);


    heightMap.name = "terrainHeightMap";
    heightMap.colorSpace = THREE.NoColorSpace;
    heightMap.wrapS = heightMap.wrapT = THREE.RepeatWrapping;
    heightMap.minFilter = THREE.LinearFilter;
    heightMap.magFilter = THREE.LinearFilter;
    heightMap.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.TERRAIN_HEIGHT_MAP, heightMap);


    fogNoiseTexture.name = "fogNoiseTexture";
    ctx.state.setTexture(TEXTURE_NAME.FOG_NOISE_TEXTURE, fogNoiseTexture);


    terrainTexture.name = "terrainTexture";
    terrainTexture.wrapS = terrainTexture.wrapT = THREE.MirroredRepeatWrapping; // or RepeatWrapping if you tile
    terrainTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.TERRAIN_TEXTURE, terrainTexture);


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


    pianoTexture.flipY = false;
    pianoTexture.colorSpace = THREE.SRGBColorSpace;
    pianoTexture.name = "pianoTexture";
    pianoTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.PIANO_TEXTURE, pianoTexture);


    barTexture.flipY = false;
    barTexture.colorSpace = THREE.SRGBColorSpace;
    barTexture.name = "barTexture";
    barTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.BAR_TEXTURE, barTexture);


    pokeballTexture.flipY = false;
    pokeballTexture.colorSpace = THREE.SRGBColorSpace;
    pokeballTexture.name = "pokeballTexture";
    pokeballTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.POKEBALL_TEXTURE, pokeballTexture);


    minecraftTexture.flipY = false;
    minecraftTexture.colorSpace = THREE.SRGBColorSpace;
    minecraftTexture.minFilter = THREE.NearestFilter;
    minecraftTexture.magFilter = THREE.NearestFilter;
    minecraftTexture.name = "minecraftTexture";
    minecraftTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.MINECRAFT_TEXTURE, minecraftTexture);


    minecraftWoodTexture.flipY = false;
    minecraftWoodTexture.colorSpace = THREE.SRGBColorSpace;
    minecraftWoodTexture.name = "minecraftWoodTexture";
    minecraftWoodTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.MINECRAFT_WOOD_TEXTURE, minecraftWoodTexture);

    minecraftRoofTexture.flipY = false;
    minecraftRoofTexture.colorSpace = THREE.SRGBColorSpace;
    minecraftRoofTexture.name = "minecraftRoofTexture";
    minecraftRoofTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.MINECRAFT_ROOF_TEXTURE, minecraftRoofTexture);


    foliageTexture.colorSpace = THREE.NoColorSpace;
    foliageTexture.name = "foliageTexture";
    foliageTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.FOLIAGE_TEXTURE, foliageTexture);


    // treebarkTexture.colorSpace = THREE.SRGBColorSpace;
    treebarkTexture.name = "treebarkTexture";
    treebarkTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.TREEBARK_TEXTURE, treebarkTexture);


    starTexture.name = "starTexture";
    starTexture.colorSpace = THREE.SRGBColorSpace;
    starTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.STAR_TEXTURE, starTexture);

    houseTexture.name = "houseTexture";
    houseTexture.flipY = false;
    houseTexture.colorSpace = THREE.SRGBColorSpace;
    houseTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.HOUSE_TEXTURE, houseTexture);

    // const video = document.createElement('video');
    // video.src = '/textures/singing.mp4';   // or .mov if your browser supports it
    // video.muted = true;                     // allow autoplay on mobile
    // video.loop = true;
    // video.playsInline = true;               // iOS
    // video.crossOrigin = 'anonymous';

    // window.addEventListener('pointerdown', () => video.play(), { once: true });
    // const tex = new THREE.VideoTexture(video);
    // tex.flipY = false;
    // tex.colorSpace = THREE.SRGBColorSpace;  // typical for UI/video
    // tex.minFilter = THREE.LinearFilter;
    // tex.magFilter = THREE.LinearFilter;
    // tex.generateMipmaps = false;
    // ctx.state.setVideoTexture("singing1", tex);
}