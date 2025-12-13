import { SceneContext, TEXTURE_NAME } from "../core/types";
import * as THREE from "three";

export default async function makeTextureLoaderSys(ctx: SceneContext) {
    const pGrassTexture = ctx.loaders.texture.loadAsync('/textures/greenTexture3.webp');
    const pArchieTexture = ctx.loaders.texture.loadAsync('/textures/archie.webp');
    const pHeightMap = ctx.loaders.texture.loadAsync('/textures/heightMap.webp');
    const pFogNoiseTexture = ctx.loaders.texture.loadAsync('/textures/noise.png');
    const pTerrainTexture = ctx.loaders.texture.loadAsync('/textures/terrain.jpg');
    const pWindNoiseTexture = ctx.loaders.texture.loadAsync('/textures/wind-noise-1.png');
    //const pPianoTexture = ctx.loaders.texture.loadAsync('/textures/piano.jpg');
    //const pBarTexture = ctx.loaders.texture.loadAsync('/textures/bar_2.jpg');
    const pPokeballTexture = ctx.loaders.texture.loadAsync('/textures/pokeball.webp');
    //const pMinecraftTexture = ctx.loaders.texture.loadAsync('/textures/minecraft.png');
    const pWood = ctx.loaders.texture.loadAsync('/textures/wood.webp');
    //const pMinecraftRoofTexture = ctx.loaders.texture.loadAsync('/textures/roof.jpg');
    const pFoliageTexture = ctx.loaders.texture.loadAsync('/textures/trees/foliage-2.png');
    const pTreebarkTexture = ctx.loaders.texture.loadAsync('/textures/trees/tree_trunk_baseColor.webp');
    //const pStarTexture = ctx.loaders.texture.loadAsync('/textures/star.png');
    //const pHouseTexture = ctx.loaders.texture.loadAsync('/textures/TextureSetOne.webp');
    //const pMusicAreaTexture = ctx.loaders.texture.loadAsync('/textures/TextureSetTwo.webp');
    //const pTextureSetThree = ctx.loaders.texture.loadAsync('/textures/TextureSetThree.webp');
    const pRotomTexture = ctx.loaders.texture.loadAsync('/textures/RotomTexture.webp');
    //const pTextureSetFour = ctx.loaders.texture.loadAsync('/textures/TextureSetFour.webp');
    const pArchiePhoto = ctx.loaders.texture.loadAsync('/textures/archiePhoto.webp');
    const pCertificate = ctx.loaders.texture.loadAsync('/textures/certificate.webp');
    const pLeafTexture = ctx.loaders.texture.loadAsync('/textures/leaf.webp');
    const pPikachuStatueTexture = ctx.loaders.texture.loadAsync('/textures/pikachuStatue.webp');
    //const pBootTexture = ctx.loaders.texture.loadAsync('/textures/boot.webp');
    const pWallTexture = ctx.loaders.texture.loadAsync('/textures/wall.webp');
    const pBookCover = ctx.loaders.texture.loadAsync('/textures/bookCover.webp');
    const pJolteonIcon = ctx.loaders.texture.loadAsync('/textures/jolteonIcon.webp');
    const pZ = ctx.loaders.texture.loadAsync('/textures/z-2.webp');
    const pCdCover = ctx.loaders.texture.loadAsync('/textures/cdCover.webp');


    //const pokeballTexture = await ctx.loaders.texture.loadAsync('/textures/pokeball_BaseColor.png');
    const [
        grassTexture, 
        archieTexture, 
        heightMap, 
        fogNoiseTexture, 
        terrainTexture, 
        windNoiseTexture, 
        //barTexture, 
        pokeballTexture, 
        //minecraftTexture, 
        wood, 
        //minecraftRoofTexture, 
        foliageTexture, 
        treebarkTexture, 
        //starTexture, 
        //houseTexture, 
        //musicAreaTexture, 
        //textureSetThree, 
        rotomTexture, 
        //textureSetFour, 
        archiePhoto, 
        certificate, 
        leafTexture, 
        pikachuStatueTexture, 
        //bootTexture, 
        wallTexture, 
        bookCover, 
        jolteonIcon, 
        z, 
        cdCover ] = await Promise.all([
            pGrassTexture, 
            pArchieTexture, 
            pHeightMap, 
            pFogNoiseTexture, 
            pTerrainTexture, 
            pWindNoiseTexture, 
            //pBarTexture, 
            pPokeballTexture, 
            //pMinecraftTexture, 
            pWood, 
            //pMinecraftRoofTexture, 
            pFoliageTexture, 
            pTreebarkTexture, 
            //pStarTexture, 
            //pHouseTexture, 
            //pMusicAreaTexture, 
            //pTextureSetThree, 
            pRotomTexture, 
            //pTextureSetFour, 
            pArchiePhoto, 
            pCertificate, 
            pLeafTexture, 
            pPikachuStatueTexture,
            //pBootTexture, 
            pWallTexture, 
            pBookCover, 
            pJolteonIcon, 
            pZ, 
            pCdCover]);


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


    // pianoTexture.flipY = false;
    // pianoTexture.colorSpace = THREE.SRGBColorSpace;
    // pianoTexture.name = "pianoTexture";
    // pianoTexture.needsUpdate = true;
    // ctx.state.setTexture(TEXTURE_NAME.PIANO_TEXTURE, pianoTexture);


    // barTexture.flipY = false;
    // barTexture.colorSpace = THREE.SRGBColorSpace;
    // barTexture.name = "barTexture";
    // barTexture.needsUpdate = true;
    // ctx.state.setTexture(TEXTURE_NAME.BAR_TEXTURE, barTexture);


    pokeballTexture.flipY = false;
    pokeballTexture.colorSpace = THREE.SRGBColorSpace;
    pokeballTexture.name = "pokeballTexture";
    pokeballTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.POKEBALL_TEXTURE, pokeballTexture);


    // minecraftTexture.flipY = false;
    // minecraftTexture.colorSpace = THREE.SRGBColorSpace;
    // minecraftTexture.minFilter = THREE.NearestFilter;
    // minecraftTexture.magFilter = THREE.NearestFilter;
    // minecraftTexture.name = "minecraftTexture";
    // minecraftTexture.needsUpdate = true;
    // ctx.state.setTexture(TEXTURE_NAME.MINECRAFT_TEXTURE, minecraftTexture);


    wood.flipY = false;
    wood.colorSpace = THREE.SRGBColorSpace;
    wood.name = "wood";
    wood.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.WOOD_TEXTURE, wood);

    // minecraftRoofTexture.flipY = false;
    // minecraftRoofTexture.colorSpace = THREE.SRGBColorSpace;
    // minecraftRoofTexture.name = "minecraftRoofTexture";
    // minecraftRoofTexture.needsUpdate = true;
    // ctx.state.setTexture(TEXTURE_NAME.MINECRAFT_ROOF_TEXTURE, minecraftRoofTexture);


    foliageTexture.colorSpace = THREE.NoColorSpace;
    foliageTexture.name = "foliageTexture";
    foliageTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.FOLIAGE_TEXTURE, foliageTexture);


    // treebarkTexture.colorSpace = THREE.SRGBColorSpace;
    treebarkTexture.name = "treebarkTexture";
    treebarkTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.TREEBARK_TEXTURE, treebarkTexture);


    // starTexture.name = "starTexture";
    // starTexture.colorSpace = THREE.SRGBColorSpace;
    // starTexture.needsUpdate = true;
    // ctx.state.setTexture(TEXTURE_NAME.STAR_TEXTURE, starTexture);

    // houseTexture.name = "houseTexture";
    // houseTexture.flipY = false;
    // houseTexture.colorSpace = THREE.SRGBColorSpace;
    // houseTexture.needsUpdate = true;
    // ctx.state.setTexture(TEXTURE_NAME.HOUSE_TEXTURE, houseTexture);

    // musicAreaTexture.name = "musicAreaTexture";
    // musicAreaTexture.flipY = false;
    // musicAreaTexture.colorSpace = THREE.SRGBColorSpace;
    // musicAreaTexture.needsUpdate = true;
    // ctx.state.setTexture(TEXTURE_NAME.TEXTURE_SET_TWO, musicAreaTexture);

    // textureSetThree.name = "textureSetThree";
    // textureSetThree.flipY = false;
    // textureSetThree.colorSpace = THREE.SRGBColorSpace;
    // textureSetThree.needsUpdate = true;
    // ctx.state.setTexture(TEXTURE_NAME.TEXTURE_SET_THREE, textureSetThree);

    rotomTexture.name = "rotomTexture";
    rotomTexture.flipY = false;
    rotomTexture.colorSpace = THREE.SRGBColorSpace;
    rotomTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.ROTOM_TEXTURE, rotomTexture);

    // textureSetFour.name = "textureSetFour";
    // textureSetFour.flipY = false;
    // textureSetFour.colorSpace = THREE.SRGBColorSpace;
    // textureSetFour.needsUpdate = true;
    // ctx.state.setTexture(TEXTURE_NAME.TEXTURE_SET_FOUR, textureSetFour);

    archiePhoto.name = "archiePhoto";
    archiePhoto.flipY = false;
    archiePhoto.colorSpace = THREE.SRGBColorSpace;
    archiePhoto.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.Archie_Photo, archiePhoto);

    certificate.name = "certificate";
    certificate.flipY = false;
    certificate.colorSpace = THREE.SRGBColorSpace;
    certificate.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.Certificate, certificate);

    leafTexture.name = "leafTexture";
    leafTexture.flipY = false;
    leafTexture.colorSpace = THREE.SRGBColorSpace;
    leafTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.Leaf_Texture, leafTexture);

    pikachuStatueTexture.name = "pikachuStatueTexture";
    pikachuStatueTexture.flipY = false;
    pikachuStatueTexture.colorSpace = THREE.SRGBColorSpace;
    pikachuStatueTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.Pikachu_Statue_Texture, pikachuStatueTexture);

    // bootTexture.name = "bootTexture";
    // bootTexture.flipY = false;
    // bootTexture.colorSpace = THREE.SRGBColorSpace;
    // bootTexture.needsUpdate = true;
    // ctx.state.setTexture(TEXTURE_NAME.Boot_Texture, bootTexture);

    wallTexture.name = "wallTexture";
    wallTexture.flipY = false;
    wallTexture.colorSpace = THREE.SRGBColorSpace;
    wallTexture.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.WALL_TEEXTURE, wallTexture);

    bookCover.name = "bookCover";
    bookCover.flipY = false;
    bookCover.colorSpace = THREE.SRGBColorSpace;
    bookCover.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.BOOK_COVER, bookCover);

    jolteonIcon.name = "jolteonIcon";
    jolteonIcon.flipY = false;
    jolteonIcon.colorSpace = THREE.SRGBColorSpace;
    jolteonIcon.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.JOLTEON_ICON, jolteonIcon);

    z.name = "z";
    z.flipY = false;
    z.colorSpace = THREE.SRGBColorSpace;
    z.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.Z_TEXTURE, z);

    cdCover.name = "cdCover";
    cdCover.flipY = false;
    cdCover.colorSpace = THREE.SRGBColorSpace;
    cdCover.needsUpdate = true;
    ctx.state.setTexture(TEXTURE_NAME.CD_COVER, cdCover);

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