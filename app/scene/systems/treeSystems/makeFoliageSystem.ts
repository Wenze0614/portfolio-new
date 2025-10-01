import { SceneContext } from "../../core/types";
import * as THREE from "three";
import vertexShader from '../../shaders/foliageShaders/vertex.vert';
import vertexDepth from '../../shaders/foliageShaders/vertexDepth.vert';
import fragmentShader from '../../shaders/foliageShaders/fragment.frag';
import { FoliageQuadNums } from "../../core/treeTypes";
import { getFloatLength } from "three/src/renderers/common/BufferUtils.js";

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


const vertsPerQuadOneSide = (segment: number): number => (segment + 1) * 2;
const buildFoliageUnit = (foliageClumpsData: FoliageClumpsData): Uint32Array => {
    const totalNumQuads = foliageClumpsData.horizontalQuads + foliageClumpsData.verticalQuads;
    const vpb = vertsPerQuadOneSide(foliageClumpsData.segments); // for a single side
    // front + back for each segment (2 tris per face per segment => 12 indices per segment total)
    const idx = new Uint32Array(foliageClumpsData.segments * 12 * totalNumQuads * CLUMPS_NUM);
    for (let c = 0; c < foliageClumpsData.clumpsNum; ++c) {
        const clumpIndexOffset = foliageClumpsData.segments * 12 * totalNumQuads * c;
        const clumpVertOffset = c * vpb * 2 * totalNumQuads;
        for (let q = 0; q < totalNumQuads; ++q) {
            const vOffset = q * foliageClumpsData.segments * 12;

            for (let i = 0; i < foliageClumpsData.segments; ++i) {

                const vertOffset = vpb * 2 * q + clumpVertOffset;
                const vi = i * 2 + vertOffset;
                // front
                idx[clumpIndexOffset + vOffset + i * 12 + 0] = vi + 0;
                idx[clumpIndexOffset + vOffset + i * 12 + 1] = vi + 1;
                idx[clumpIndexOffset + vOffset + i * 12 + 2] = vi + 2;

                idx[clumpIndexOffset + vOffset + i * 12 + 3] = vi + 1;
                idx[clumpIndexOffset + vOffset + i * 12 + 4] = vi + 3;
                idx[clumpIndexOffset + vOffset + i * 12 + 5] = vi + 2;

                // back (offset by vpb)
                const fi = vpb + vi;
                idx[clumpIndexOffset + vOffset + i * 12 + 6] = fi + 0;
                idx[clumpIndexOffset + vOffset + i * 12 + 7] = fi + 1;
                idx[clumpIndexOffset + vOffset + i * 12 + 8] = fi + 2;

                idx[clumpIndexOffset + vOffset + i * 12 + 9] = fi + 1;
                idx[clumpIndexOffset + vOffset + i * 12 + 10] = fi + 3;
                idx[clumpIndexOffset + vOffset + i * 12 + 11] = fi + 2;
            }
        }
    }
    return idx;
}

const createFoliageGeometry = (foliageClumpsData: FoliageClumpsData): THREE.InstancedBufferGeometry => {
    const foliageIndices = buildFoliageUnit(foliageClumpsData); //indices for a single grass blade
    const geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = 1;
    geo.setIndex(new THREE.BufferAttribute(foliageIndices, 1))
    //const radius = Math.sqrt(half * half * 2) + GRASS_HEIGHT; // diagonal to corner + height // the length of diagonal C^2 = halfPatchSize^2 + halfPathSize^2
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100);

    return geo;
}

export default function makeFoliageSystem(ctx: SceneContext, foliageGuides:FoliageClumpsData) {

    const foliageTexture = ctx.loaders.texture.load('/textures/trees/foliage-2.png');
    foliageTexture.colorSpace = THREE.NoColorSpace;
    const foliageQuadNums: FoliageQuadNums = { horizontal: foliageGuides.horizontalQuads, vertical: foliageGuides.verticalQuads };
    const foliageGeo = createFoliageGeometry(foliageGuides);
    const baseUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.lambert.uniforms);
    const customUniforms = {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(1, 1) },
        uWindSpeed: { value: ctx.state.windState.windSpeed },
        uWindDirection: { value: ctx.state.windState.windDirection },
        uVerticalQuads: { value: foliageGuides.verticalQuads },
        uHorizontalQuads: { value: foliageGuides.horizontalQuads },
        uFoliageSegment: { value: foliageGuides.segments },
        uQuadNumber: { value: new THREE.Vector2(foliageQuadNums.horizontal, foliageQuadNums.vertical) },
        uFoliageTexture: { value: foliageTexture },
        uClumpNumber: { value: foliageGuides.clumpsNum },
        uSphereRadius: { value: foliageGuides.sphereRadius },
        uFoliageSize: {value: new THREE.Vector2(foliageGuides.foliageWidth, foliageGuides.foliageHeight)},
        uColorMap: {
            value: [
                new THREE.Color("#427062"),
                new THREE.Color("#33594E"),
                new THREE.Color("#234549"),
                new THREE.Color("#1E363F"),
            ],
        },
        uBrightnessThresholds: {
            value: [0.9, 0.45, 0.001],
        },
    }
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
    });

    const foliageMesh = new THREE.Mesh(foliageGeo, foliageMat);
    foliageMesh.position.copy(foliageGuides.position);
    // foliageMesh.position.y = 1;
    // foliageMesh.scale.setScalar(foliageGuides.scale);
    foliageMesh.castShadow = true;
    foliageMesh.receiveShadow = false;
    //foliageMesh.receiveShadow = true;

    //make foliage cast shadows
    foliageMesh.customDepthMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexDepth,     // similar to your foliage vertex displacement
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
        uniforms: treeUniforms,             // same uniforms (at least the displacement ones!)
    });

  
    ctx.scene.add(foliageMesh);

    return {
        init(ctx: SceneContext) { },
        update(ctx: SceneContext) { },
        dispose() { },
        getFoliage() {
            return foliageMesh;
        }
    }
}