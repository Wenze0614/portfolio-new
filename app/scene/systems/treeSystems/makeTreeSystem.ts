import { SceneContext, System } from "../../core/types";
import * as THREE from "three";
import makeFoliageSystem, { FoliageClumpsData } from "./makeFoliageSystem";
import vertexShader from '../../shaders/treeTrunkShader/vertex.vert';
import fragmentShader from '../../shaders/treeTrunkShader/fragment.frag';
import vertexDepth from '../../shaders/treeTrunkShader/vertexDepth.vert';
import { tree } from "next/dist/build/templates/app-page";
import { makeHeightSampler } from "../../utils/makeHeightSampler";
import { useRef } from "react";
import { Console } from "console";
import forestData from '../../data/forest.json';


const testFoliageGuides: FoliageClumpsData = {
    position: new THREE.Vector3(0, 2, 0),
    clumpsNum: 12,
    sphereRadius: 0.5,
    segments: 1,
    horizontalQuads: 0,
    verticalQuads: 2,
    foliageWidth: 2,
    foliageHeight: 2
}

const foliageGuids: FoliageClumpsData[] = [
    {
        position: new THREE.Vector3(-5.5, 16, -1.5),
        clumpsNum: 30,
        sphereRadius: 3,
        segments: 1,
        horizontalQuads: 0,
        verticalQuads: 2,
        foliageWidth: 4,
        foliageHeight: 6
    },
    {
        position: new THREE.Vector3(1.3, 23.4, -8),
        clumpsNum: 45,
        sphereRadius: 4.5,
        segments: 1,
        horizontalQuads: 0,
        verticalQuads: 2,
        foliageWidth: 6,
        foliageHeight: 8
    },
    {
        position: new THREE.Vector3(3.19, 25.4, 5.56),
        clumpsNum: 50,
        sphereRadius: 5,
        segments: 1,
        horizontalQuads: 0,
        verticalQuads: 2,
        foliageWidth: 8,
        foliageHeight: 8
    },
    {
        position: new THREE.Vector3(4.38, 25.4, -2.25),
        clumpsNum: 50,
        sphereRadius: 5,
        segments: 1,
        horizontalQuads: 0,
        verticalQuads: 2,
        foliageWidth: 8,
        foliageHeight: 8
    },
    // {position: new THREE.Vector3(-32, 0, 22), scale: 1.2},
    // {position: new THREE.Vector3(-30, 0, 25), scale: 0.8},
    // {position: new THREE.Vector3(-35, 0, 15), scale: 1.5},
    // {position: new THREE.Vector3(-25, 0, 20), scale: 1.0},
]

function createTreeTransformMatrix(treeData: any[]): THREE.Matrix4[] {
    const dummy = new THREE.Object3D();
    const matrices: THREE.Matrix4[] = [];

    for (let i = 0; i < treeData.length; i++) {
        const {x, y, z, yaw, scale} = treeData[i];
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        matrices.push(dummy.matrix.clone());
    }
    return matrices;
}

export default function makeTreeSystem(ctx: SceneContext) {
    //makeFoliageSystem(ctx);
    const foliageTexture = ctx.loaders.texture.load('/textures/trees/foliage-2.png');
    const trunkTexture = ctx.loaders.texture.load('/textures/trees/tree_trunk_baseColor.png');

    const baseUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.lambert.uniforms);
    const customUniforms = {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(1, 1) },
        uWindSpeed: { value: ctx.state.windState.windSpeed },
        uWindDirection: { value: ctx.state.windState.windDirection },
        uFoliageTexture: { value: foliageTexture },
        uTrunkTexture: { value: trunkTexture },
    }
    const treeTrunkUniforms = THREE.UniformsUtils.merge([baseUniforms, customUniforms]);


    const treeTrunkMat = new THREE.ShaderMaterial({
        uniforms: treeTrunkUniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        lights: true,
        fog: true,
    })

    let foliageSys:System;

    return {
        init(ctx: SceneContext) {
            ctx.loaders.gltf.load('/models/trees.glb', (gltf) => {
                const model = gltf.scene;
                // model.scale.z = 0.5;
                // model.position.set(-30, 0, 20);
                const treeTrunk = model.getObjectByName('treeTrunk') as THREE.Mesh | null;

                if (!treeTrunk) {
                    console.error("treeTrunk or treeFoliage not found in treeType-1.glb");
                    return;
                }



                // treeTrunk.castShadow = true;
                // treeTrunk.material = treeTrunkMat;
                // ctx.scene.add(treeTrunk);

                // Extract guides (by name or collection)
                const guides: FoliageClumpsData[] = [];
                gltf.scene.traverse(obj => {
                    if (obj.name.startsWith("guide")) {
                        //guides.push(obj as THREE.Mesh);
                        // ctx.scene.add(obj);
                        console.log('obj scale: ', obj.scale);
                        const guide: FoliageClumpsData = {
                            position: obj.position.clone(),
                            clumpsNum: Math.round((obj.scale.x - 2) * 10),
                            sphereRadius: obj.scale.x - 2,
                            segments: 1,
                            horizontalQuads: 0,
                            verticalQuads: 2,
                            foliageWidth: Math.floor(obj.scale.x),
                            foliageHeight: Math.floor(obj.scale.x)
                        }
                        guides.push(guide);
                    }
                })
                // console.log("guides: ", guides[0].position);
                // for (const guide of guides) {
                //     makeFoliageSystem(ctx, guide);
                // }

                //instancing trees
                const treeTrunkGeo = treeTrunk.geometry as THREE.BufferGeometry;
                // treeTrunkGeo.applyMatrix4(treeTrunk.matrixWorld);
                const COUNT = 200;
                // const trunkIM = new THREE.InstancedMesh(treeTrunkGeo, new THREE.MeshToonMaterial({
                //     map:trunkTexture
                // }), COUNT);
                const trunkIM = new THREE.InstancedMesh(treeTrunkGeo, treeTrunkMat, COUNT);
                trunkIM.customDepthMaterial = new THREE.ShaderMaterial({
                    uniforms: treeTrunkUniforms,
                    vertexShader: vertexDepth,
                    fragmentShader: `
                    varying vec2 vUv;
                    varying vec3 vNormalWS;
                      void main() {
                        gl_FragColor = vec4( vec3( gl_FragCoord.z ), 1.0 );
                      }
                    `,
                });
                trunkIM.castShadow = true;
                trunkIM.receiveShadow = true;
                trunkIM.frustumCulled = false; // todo: maybe tiling trees for better culling and LOD
                ctx.scene.add(trunkIM);

                // 4) Scatter across 200x200 terrain (x,z in [-100,100])
                const dummy = new THREE.Object3D();
                const { heightScale, heightOffset, terrainWidth, terrainLength } = ctx.state.terrainState;

                // const heightMapRef = useRef<THREE.Texture | null>(null);

                let heightSampler: {
                    heightAtXZ(x: number, z: number, heightScale: number, heightOffset: number): number;
                }

                const treeData = forestData.trees;
                const treeTransformMatrx = createTreeTransformMatrix(treeData);
                for (let i = 0; i < Math.min(COUNT, treeData.length); i++) {
                    trunkIM.setMatrixAt(i, treeTransformMatrx[i]);
                }
                trunkIM.instanceMatrix.needsUpdate = true;
                foliageSys = makeFoliageSystem(ctx, guides, treeTransformMatrx, Math.min(COUNT, treeData.length));

            });
        },
        update(ctx: SceneContext, dt: number) {
            treeTrunkMat.uniforms.fogTime.value = dt;
            if(foliageSys) foliageSys.update(ctx, dt);
        },
        dispose() { }
    }
}