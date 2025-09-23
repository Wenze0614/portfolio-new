import { SceneContext, System } from "../core/types";
import vertexShader from "../shaders/grassShaders/vertex.vert";
import fragmentShader from "../shaders/grassShaders/fragment.frag";
import * as THREE from "three";

// define near and far distance for LOD
const LOD_NEAR = 50;
const LOD_MID = 100;

const HIGH_SEGMENTS = 3;
const MED_SEGMENTS = 2;
const LOW_SEGMENTS = 1;

const GRASS_NUMBER_FACTOR = 0.8;
const HIGH_INSTANCES = 30_000 * GRASS_NUMBER_FACTOR;
const MID_INSTANCES = 12_000 * GRASS_NUMBER_FACTOR;
const LOW_INSTANCES = 3_000 * GRASS_NUMBER_FACTOR;

const GRASS_PATCH_SIZE = 25;
const GRASS_WIDTH = 0.2;
const GRASS_HEIGHT = 0.3;

const vertsPerBlade = (seg: number) => (seg + 1) * 2;

const buildGrassIndices = (segment: number): Uint32Array => {
    const vpb = vertsPerBlade(segment);
    // front + back for each segment (2 tris per face per segment => 12 indices per segment total)
    const idx = new Uint32Array(segment * 12);
    for (let i = 0; i < segment; ++i) {
        const vi = i * 2;

        // front
        idx[i * 12 + 0] = vi + 0;
        idx[i * 12 + 1] = vi + 1;
        idx[i * 12 + 2] = vi + 2;

        idx[i * 12 + 3] = vi + 1;
        idx[i * 12 + 4] = vi + 3;
        idx[i * 12 + 5] = vi + 2;

        // back (offset by vpb)
        const fi = vpb + vi;
        idx[i * 12 + 6] = fi + 0;
        idx[i * 12 + 7] = fi + 1;
        idx[i * 12 + 8] = fi + 2;

        idx[i * 12 + 9] = fi + 1;
        idx[i * 12 + 10] = fi + 3;
        idx[i * 12 + 11] = fi + 2;
    }
    return idx;
}

const createGrassGeometry = (segment: number, grassNumber: number, patchSize: number): THREE.InstancedBufferGeometry => {
    const grassIndices = buildGrassIndices(segment); //indices for a single grass blade
    const geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = grassNumber;
    geo.setIndex(new THREE.BufferAttribute(grassIndices, 1))

    const half = patchSize * 0.5;
    const radius = Math.sqrt(half * half * 2) + GRASS_HEIGHT; // diagonal to corner + height // the length of diagonal C^2 = halfPatchSize^2 + halfPathSize^2
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, GRASS_HEIGHT * 0.5, 0), radius);

    return geo;
}

type LODKey = 'HIGH' | 'MED' | 'LOW';

export default function makeGrassSystem(ctx:SceneContext, heightMap: THREE.Texture, terrainTexture: THREE.Texture): System {
    const grassTexture =ctx.loaders.texture.load('/textures/greenTexture3.png');
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(1, 1);

    const grassMask = ctx.loaders.texture.load('/textures/terrain_grassmask.png');
    // grassMask.flipY = false;
    grassMask.needsUpdate = true;

    const terrainWidth = ctx.state.terrainState.terrainWidth;
    const terrainHeight = ctx.state.terrainState.terrainLength;
    const baseUniforms = {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(1, 1) },
        grassWidth: { value: GRASS_WIDTH },
        grassHeight: { value: GRASS_HEIGHT },
        grassPatchSize: { value: GRASS_PATCH_SIZE },
        grassTexture: { value: grassTexture },
        grassHeightMap:{value: heightMap},
        grassMask: {value: grassMask},
        terrainSize: {value: new THREE.Vector2(terrainWidth, terrainHeight)},
        terrainTexture: {value: terrainTexture}
    }

    // Helper to make one LOD material with its own cloned uniforms/defines
    function makeLODMaterial(segments: number) {
        const mat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: baseUniforms,
            side: THREE.DoubleSide,
            lights: false, // or true if you included three light chunks
        });
        mat.defines = { ...(mat.defines || {}), GRASS_SEGMENTS: segments }; // optional compile-time define
        mat.needsUpdate = true;
        return mat;
    }

    // Create three materials for different LOD
    const mats = {
        HIGH: makeLODMaterial(3),
        MED: makeLODMaterial(2),
        LOW: makeLODMaterial(1),
    };

    const geometries: Record<LODKey, THREE.InstancedBufferGeometry> = {
        HIGH: createGrassGeometry(HIGH_SEGMENTS, HIGH_INSTANCES, GRASS_PATCH_SIZE),
        MED: createGrassGeometry(MED_SEGMENTS, MID_INSTANCES, GRASS_PATCH_SIZE),
        LOW: createGrassGeometry(LOW_SEGMENTS, LOW_INSTANCES, GRASS_PATCH_SIZE)
    }

    // Helper to snap tile centers across the terrain
    function* tileCenters(rangeMin: number, rangeMax: number, size: number): Generator<number> {
        // centers from (min+size/2) to (max-size/2)
        for (let c = rangeMin + size * 0.5; c <= rangeMax - size * 0.5 + 1e-4; c += size) {
            yield c;
        }
    }

    // Build all tiles
    type Tile = {
        mesh: THREE.Mesh;
        center: THREE.Vector3;
        currentLOD: LODKey;
    };
    const tiles: Tile[] = [];
    for (const cx of tileCenters(-terrainWidth * 0.5, terrainWidth * 0.5, GRASS_PATCH_SIZE)) {
        for (const cz of tileCenters(-terrainHeight * 0.5, terrainHeight * 0.5, GRASS_PATCH_SIZE)) {
            const mesh = new THREE.Mesh(geometries.HIGH, mats.HIGH);
            mesh.matrixAutoUpdate = true; // we just position; three will handle world matrix
            mesh.position.set(cx, 0, cz);

            // Optional: custom name for debugging
            // mesh.name = `GrassTile_${cx}_${cz}`;

            tiles.push({
                mesh,
                center: new THREE.Vector3(cx, 0, cz),
                currentLOD: 'HIGH',
            });
        }
    }

    function chooseLOD(dist: number): LODKey {
        if (dist < LOD_NEAR) return 'HIGH';
        if (dist < LOD_MID) return 'MED';
        return 'LOW';
    }

    // Update per-tile geometry (LOD) based on camera distance
    function updateTileLODs(camera: THREE.Camera) {
        const camPos = (camera as THREE.PerspectiveCamera).position;
        for (const tile of tiles) {
            const dx = camPos.x - tile.center.x;
            const dz = camPos.z - tile.center.z;
            const dist = Math.hypot(dx, dz); // horizontal distance is usually enough

            const targetLOD = chooseLOD(dist);
            if (targetLOD !== tile.currentLOD) {
                tile.mesh.geometry = geometries[targetLOD];
                tile.currentLOD = targetLOD;
                tile.mesh.material = mats[targetLOD];
            }
        }
    }

    return {
        init(ctx: SceneContext) {
            for (const t of tiles) ctx.scene.add(t.mesh);

            // set resolution uniform to actual pixels
            const dpr = ctx.renderer.getPixelRatio?.() ?? 1;
            const size = ctx.renderer.getSize(new THREE.Vector2());
            //updateMatResolution(new THREE.Vector2(size.width * dpr, size.height * dpr));
            baseUniforms.resolution.value.set(size.width * dpr, size.height * dpr);

            // Handle resize to keep resolution up to date
            const onResize = () => {
                const dpr2 = ctx.renderer.getPixelRatio?.() ?? 1;
                const s = ctx.renderer.getSize(new THREE.Vector2());
                //updateMatResolution(new THREE.Vector2(size.width * dpr, size.height * dpr));
                baseUniforms.resolution.value.set(size.width * dpr, size.height * dpr);
            };
            // @ts-ignore store to ctx if you have a disposer pattern
            (this as any)._onResize = onResize;
            window.addEventListener('resize', onResize);
        },
        update(ctx: SceneContext, dt: number) {
            // tick(dt);
            baseUniforms.time.value = dt;
            updateTileLODs(ctx.camera);
        },
        dispose() {
            window.removeEventListener('resize', (this as any)._onResize);
        }
    }
}