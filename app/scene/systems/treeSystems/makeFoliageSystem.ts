import { SceneContext } from "../../core/types";
import * as THREE from "three";
import vertexShader from '../../shaders/foliageShaders/vertex.vert';
import vertexDepth from '../../shaders/foliageShaders/vertexDepth.vert';
import fragmentShader from '../../shaders/foliageShaders/fragment.frag';
import { FoliageQuadNums } from "../../core/treeTypes";
import { getFloatLength } from "three/src/renderers/common/BufferUtils.js";
import { depth } from "three/tsl";

const FOLIAGE_HORIZONTAL_QUADS = 0;
const FOLIAGE_VERTICAL_QUADS = 2;
const FOLIAGE_SEGMENT = 1;
const CLUMPS_NUM = 30;
const SPHERE_RADIUS = 0.5;

export interface FoliageClumpsData {
    position: THREE.Vector3;
    clumpsNum: number;
    sphereRadius: number;
    segments: number;
    horizontalQuads: number;
    verticalQuads: number;
    foliageWidth: number;
    foliageHeight: number;
}

interface FoliageSphereData {
    totalIdxNum: number;
    totalVertNum: number;
    idxOffset: number[];
    vertOffset: number[];
}


const vertsPerQuadOneSide = (segment: number): number => (segment + 1) * 2;

const buildFoliageUnit = (foliageClumpsData: FoliageClumpsData[]): { idx: Uint32Array, sphereID: Float32Array, foliageSphereData: FoliageSphereData } => {
    //const totalNumQuads = foliageClumpsData.horizontalQuads + foliageClumpsData.verticalQuads;
    //const vpb = vertsPerQuadOneSide(foliageClumpsData.segments); // for a single side

    // front + back for each segment (2 tris per face per segment => 12 indices per segment total)
    //console.log("building foliage unit for foliageClumpsData: ", foliageClumpsData);
    const foliageSphereData = foliageClumpsData.reduce((acc, cur, index) => {
        //console.log("acc: ", acc, " cur: ", cur, " index: ", index);
        const curretnIndexOffset = cur.clumpsNum * cur.segments * 12 * (cur.horizontalQuads + cur.verticalQuads);
        const currentVertOffset = cur.clumpsNum * vertsPerQuadOneSide(cur.segments) * 2 * (cur.horizontalQuads + cur.verticalQuads)
        const indexOffset = index === 0 ? curretnIndexOffset : acc.idxOffset[index - 1] + curretnIndexOffset;
        const vertOffset = index === 0 ? currentVertOffset : acc.vertOffset[index - 1] + currentVertOffset;
        return {
            totalIdxNum: acc.totalIdxNum + curretnIndexOffset,
            totalVertNum: acc.totalIdxNum + currentVertOffset,
            idxOffset: [...acc.idxOffset, indexOffset],
            vertOffset: [...acc.vertOffset, vertOffset]
        }
    }, { totalIdxNum: 0, totalVertNum: 0, idxOffset: [], vertOffset: [] } as FoliageSphereData);
    //console.log("foliage sphere data: ", foliageSphereData);
    const idx = new Uint32Array(foliageSphereData.totalIdxNum);
    const sphereID = new Float32Array(foliageSphereData.totalVertNum);
    for (let s = 0; s < foliageClumpsData.length; ++s) {
        const clumpsNum = foliageClumpsData[s].clumpsNum;
        const segment = foliageClumpsData[s].segments;
        const totalNumQuads = foliageClumpsData[s].horizontalQuads + foliageClumpsData[s].verticalQuads;
        const vpb = vertsPerQuadOneSide(segment); // for a single side
        const sphereIndexOffset = s === 0 ? 0 : foliageSphereData.idxOffset[s - 1];
        const sphereVertOffset = s === 0 ? 0 : foliageSphereData.vertOffset[s - 1];
        for (let c = 0; c < clumpsNum; ++c) {
            const clumpIndexOffset = segment * 12 * totalNumQuads * c;
            const clumpVertOffset = c * vpb * 2 * totalNumQuads;
            for (let q = 0; q < totalNumQuads; ++q) {
                const vOffset = q * segment * 12;

                for (let i = 0; i < segment; ++i) {

                    const vertOffset = vpb * 2 * q + clumpVertOffset + sphereVertOffset;
                    const vi = i * 2 + vertOffset;
                    // front
                    idx[sphereIndexOffset + clumpIndexOffset + vOffset + i * 12 + 0] = vi + 0;
                    idx[sphereIndexOffset + clumpIndexOffset + vOffset + i * 12 + 1] = vi + 1;
                    idx[sphereIndexOffset + clumpIndexOffset + vOffset + i * 12 + 2] = vi + 2;
                    idx[sphereIndexOffset + clumpIndexOffset + vOffset + i * 12 + 3] = vi + 1;
                    idx[sphereIndexOffset + clumpIndexOffset + vOffset + i * 12 + 4] = vi + 3;
                    idx[sphereIndexOffset + clumpIndexOffset + vOffset + i * 12 + 5] = vi + 2;

                    sphereID[vi + 0] = s;
                    sphereID[vi + 1] = s;
                    sphereID[vi + 2] = s;
                    sphereID[vi + 3] = s;

                    // back (offset by vpb)
                    const fi = vpb + vi;
                    idx[sphereIndexOffset + clumpIndexOffset + vOffset + i * 12 + 6] = fi + 0;
                    idx[sphereIndexOffset + clumpIndexOffset + vOffset + i * 12 + 7] = fi + 1;
                    idx[sphereIndexOffset + clumpIndexOffset + vOffset + i * 12 + 8] = fi + 2;
                    idx[sphereIndexOffset + clumpIndexOffset + vOffset + i * 12 + 9] = fi + 1;
                    idx[sphereIndexOffset + clumpIndexOffset + vOffset + i * 12 + 10] = fi + 3;
                    idx[sphereIndexOffset + clumpIndexOffset + vOffset + i * 12 + 11] = fi + 2;

                    sphereID[fi + 0] = s;
                    sphereID[fi + 1] = s;
                    sphereID[fi + 2] = s;
                    sphereID[fi + 3] = s;

                }
            }
        }
    }
    //console.log("foliage idx: ", idx);
    //console.log("foliage sphereID: ", sphereID);
    return { idx, sphereID, foliageSphereData };
}

const createFoliageGeometry = (foliageClumpsData: FoliageClumpsData[], treeTransformMatrx: THREE.Matrix4[], treeCount: number): { geo: THREE.InstancedBufferGeometry, foliageSphereData: FoliageSphereData, } => {
    const { idx: foliageIndices, sphereID, foliageSphereData } = buildFoliageUnit(foliageClumpsData); //indices for a single grass blade
    const transformMatrixArray = new Float32Array(treeCount * 16);
    for (let i = 0; i < treeCount; ++i) {
        const matrix = treeTransformMatrx[i];
        //console.log('matrix: ', matrix);
        matrix.toArray(transformMatrixArray, i * 16);
    }
    const geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = treeCount; //num of trees
    geo.setIndex(new THREE.BufferAttribute(foliageIndices, 1))
    geo.setAttribute('sphereID', new THREE.Float32BufferAttribute(sphereID, 1));
    geo.setAttribute('treeTransformMatrix', new THREE.InstancedBufferAttribute(transformMatrixArray, 16));
    //const radius = Math.sqrt(half * half * 2) + GRASS_HEIGHT; // diagonal to corner + height // the length of diagonal C^2 = halfPatchSize^2 + halfPathSize^2
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100);

    return { geo, foliageSphereData };
}

export default function makeFoliageSystem(ctx: SceneContext, foliageGuides: FoliageClumpsData[], treeTransformMatrx: THREE.Matrix4[], treeCount: number) {
    // build guides
    const foliageQuadNums = foliageGuides.map((guide) => {
        return new THREE.Vector2(guide.horizontalQuads, guide.verticalQuads);
    })

    const foliageSegments = foliageGuides.map((guide) => guide.segments);
    const foliageClumpNums = foliageGuides.map((guide) => guide.clumpsNum);
    const foliageSphereRadiuses = foliageGuides.map((guide) => guide.sphereRadius);
    const foliageSizes = foliageGuides.map((guide) => new THREE.Vector2(guide.foliageWidth, guide.foliageHeight));
    const foliageSpherePositions = foliageGuides.map((guide) => guide.position);


    const foliageTexture = ctx.loaders.texture.load('/textures/trees/foliage-2.png');
    foliageTexture.colorSpace = THREE.NoColorSpace;

    const { geo: foliageGeo, foliageSphereData } = createFoliageGeometry(foliageGuides, treeTransformMatrx, treeCount);
    const baseUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.lambert.uniforms);
    const MAX_SPHERES = 10;
    const customUniforms = {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(1, 1) },
        uWindSpeed: { value: ctx.state.windState.windSpeed },
        uWindDirection: { value: ctx.state.windState.windDirection },
        uFoliageTexture: { value: foliageTexture },
        //arrays
        uFoliageSegment: { value: new Int32Array(MAX_SPHERES) },
        uQuadNumber: { value: Array.from({ length: MAX_SPHERES }, () => new THREE.Vector2()) },
        uClumpNumber: { value: new Int32Array(MAX_SPHERES) },
        uSphereRadius: { value: new Float32Array(MAX_SPHERES) },
        uFoliageSize: { value: Array.from({ length: MAX_SPHERES }, () => new THREE.Vector2()) },
        uFoliageSpherePositions: { value: Array.from({ length: MAX_SPHERES }, () => new THREE.Vector3()) },
        uSphereVertOffset: { value: new Int32Array(MAX_SPHERES) }
    }
    //const sphereCount = Math.min(foliageGuides.length, MAX_SPHERES);
    for (let i = 0; i < MAX_SPHERES; ++i) {
        customUniforms.uFoliageSegment.value[i] = foliageSegments[i] ?? 0;
        customUniforms.uQuadNumber.value[i] = i < foliageGuides.length ? foliageQuadNums[i] : new THREE.Vector2(0, 0);
        customUniforms.uClumpNumber.value[i] = foliageClumpNums[i] ?? 0;
        customUniforms.uSphereRadius.value[i] = foliageSphereRadiuses[i] ?? 0;
        customUniforms.uFoliageSize.value[i] = i < foliageGuides.length ? foliageSizes[i] : new THREE.Vector2(0, 0);
        customUniforms.uFoliageSpherePositions.value[i] = i < foliageGuides.length ? foliageSpherePositions[i] : new THREE.Vector3(0, 0, 0);
        customUniforms.uSphereVertOffset.value[i] = foliageSphereData.vertOffset[i] ?? 0;
    }
    // const customUniforms = {
    //     time: { value: 0 },
    //     resolution: { value: new THREE.Vector2(1, 1) },
    //     uWindSpeed: { value: ctx.state.windState.windSpeed },
    //     uWindDirection: { value: ctx.state.windState.windDirection },
    //     uFoliageSegment: { value: foliageSegments },
    //     uQuadNumber: { value: foliageQuadNums },
    //     uFoliageTexture: { value: foliageTexture },
    //     uClumpNumber: { value: foliageClumpNums },
    //     uSphereRadius: { value: foliageSphereRadiuses },
    //     uFoliageSize: { value: foliageSizes },
    //     uFoliageSpherePositions: { value: foliageSpherePositions },
    //     uColorMap: {
    //         value: [
    //             new THREE.Color("#427062"),
    //             new THREE.Color("#33594E"),
    //             new THREE.Color("#234549"),
    //             new THREE.Color("#1E363F"),
    //         ],
    //     },
    //     uBrightnessThresholds: {
    //         value: [0.9, 0.45, 0.001],
    //     },
    //     uSphereVertOffset: { value: foliageSphereData.vertOffset }
    // }
    const treeUniforms = THREE.UniformsUtils.merge([baseUniforms, customUniforms]);
    const foliageMat = new THREE.ShaderMaterial({
        uniforms: treeUniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.DoubleSide,
        //transparent: true,
        // alphaTest: 0.5,
        // depthWrite: true,          // keep writing depth
        // depthTest: true,
        lights: true,
        fog: true,
    });
    foliageMat.defines = { ...(foliageMat.defines || {}), USE_INSTANCING: 1, FOG_USE_NOISE:1 };
    // foliageMat.defines.FOG_USE_NOISE = 1;
    //console.log("tree uniform: ", treeUniforms)
    const foliageMesh = new THREE.Mesh(foliageGeo, foliageMat);
    //foliageMesh.position.copy(foliageGuides.position);
    // foliageMesh.position.y = 1;
    // foliageMesh.scale.setScalar(foliageGuides.scale);
    foliageMesh.castShadow = true;
    foliageMesh.receiveShadow = false;
    //foliageMesh.receiveShadow = true;

    //make foliage cast shadows
    const depthMat = new THREE.ShaderMaterial({
        vertexShader: vertexDepth,
        fragmentShader: `
        uniform sampler2D uFoliageTexture;
        uniform vec3 uColorMap[4];

        varying vec2 vUv;
        varying vec3 vNormalWS;
          void main() {
            float m = texture2D(uFoliageTexture, vUv).a;
            if (m < 0.5) discard;
            gl_FragColor = vec4( vec3( gl_FragCoord.z ), 1.0 );
          }
        `,
        uniforms: treeUniforms,
    });
    depthMat.defines = { ...(depthMat.defines || {}), USE_INSTANCING: 1 };
    foliageMesh.customDepthMaterial = depthMat;


    ctx.scene.add(foliageMesh);

    return {
        init(ctx: SceneContext) { },
        update(ctx: SceneContext, dt:number) {
            foliageMat.uniforms.fogTime.value = dt;
         },
        dispose() { },
        getFoliage() {
            return foliageMesh;
        }
    }
}