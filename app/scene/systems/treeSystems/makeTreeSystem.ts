import { SceneContext } from "../../core/types";
import * as THREE from "three";
import makeFoliageSystem, { FoliageClumpsData } from "./makeFoliageSystem";
import vertexShader from '../../shaders/treeFoliageShaders/vertex.vert';
import fragmentShader from '../../shaders/treeFoliageShaders/fragment.frag';
import vertexDepth from '../../shaders/treeFoliageShaders/vertexDepth.vert';
import { tree } from "next/dist/build/templates/app-page";
import { makeHeightSampler } from "../../utils/makeHeightSampler";
import { useRef } from "react";
import { Console } from "console";


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
export default function makeTreeSystem(ctx: SceneContext) {
    //makeFoliageSystem(ctx);
    const foliageTexture = ctx.loaders.texture.load('/textures/trees/foliage-2.png');
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

                const treeTrunkMat = new THREE.MeshLambertMaterial({
                    map: ctx.loaders.texture.load('/textures/trees/tree_trunk_baseColor.png'),
                });

                treeTrunk.castShadow = true;
                treeTrunk.material = treeTrunkMat;
                ctx.scene.add(treeTrunk);

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
                treeTrunkGeo.applyMatrix4(treeTrunk.matrixWorld);
                const COUNT = 200;
                const trunkIM = new THREE.InstancedMesh(treeTrunkGeo, treeTrunkMat, COUNT);
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

                ctx.loaders.texture.loadAsync('/textures/terrain_height.jpg').then((heightMap) => {
                    const treeTransformMatrx: THREE.Matrix4[] = [];
                    const terrainMin = new THREE.Vector2(-terrainWidth * 0.5, -terrainLength * 0.5);
                    const terrainMax = new THREE.Vector2(terrainWidth * 0.5, terrainLength * 0.5);
                    heightSampler = makeHeightSampler(heightMap, terrainMin, terrainMax, { flipV: true });

                    for (let i = 0; i < COUNT; i++) {
                        const x = THREE.MathUtils.randFloatSpread(terrainWidth ?? 200);  // ~[-100,100]
                        const z = THREE.MathUtils.randFloatSpread(terrainLength ?? 200);  // ~[-100,100]
                        const y = heightSampler.heightAtXZ(x, z, heightScale, heightOffset);

                        // random rot/scale per tree
                        const yaw = Math.random() * Math.PI * 2;
                        const s = THREE.MathUtils.lerp(0.85, 1.25, Math.random());

                        dummy.position.set(x, y, z);
                        dummy.rotation.set(0, yaw, 0);
                        dummy.scale.set(s, s, s);
                        dummy.updateMatrix();

                        trunkIM.setMatrixAt(i, dummy.matrix);
                        treeTransformMatrx.push(dummy.matrix.clone());
                    }

                    trunkIM.instanceMatrix.needsUpdate = true;
                    console.log('treeTransformMatrx: ', treeTransformMatrx);
                    makeFoliageSystem(ctx, guides, treeTransformMatrx, COUNT);
                });
                //makeFoliageSystem(ctx, testFoliageGuides);
            });

            // ctx.loaders.gltf.load('/models/treeType-1.glb', (gltf) => {
            //     const model = gltf.scene;
            //     model.position.set(10, 0, -10);
            //     // ctx.scene.add(model);

            //     const treeTrunk = model.getObjectByName('treeTrunk') as THREE.Mesh | null;
            //     const treeFoliage = model.getObjectByName('treeFoliage') as THREE.Mesh | null;

            //     if (!treeTrunk || !treeFoliage) {
            //         console.error("treeTrunk or treeFoliage not found in treeType-1.glb");
            //         return;
            //     }

            //     const treeTrunkGeo = treeTrunk.geometry as THREE.BufferGeometry;
            //     treeTrunkGeo.applyMatrix4(treeTrunk.matrixWorld);
            //     const treeFoliageGeo = treeFoliage.geometry as THREE.BufferGeometry;
            //     treeFoliageGeo.applyMatrix4(treeFoliage.matrixWorld);

            //     const treeTrunkMat = new THREE.MeshToonMaterial({
            //         map: ctx.loaders.texture.load('/textures/trees/tree_trunk_baseColor.png'),
            //     });

            //     // treeTrunk.castShadow = true;
            //     // treeTrunk.material = treeTrunkMat;
            //     // ctx.scene.add(treeTrunk);


            //     const baseUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.lambert.uniforms);
            //     const customUniforms = {
            //         time: { value: 0 },
            //         resolution: { value: new THREE.Vector2(1, 1) },
            //         uWindSpeed: { value: ctx.state.windState.windSpeed },
            //         uWindDirection: { value: ctx.state.windState.windDirection },
            //         uFoliageTexture: { value: foliageTexture },
            //     }
            //     const treeUniforms = THREE.UniformsUtils.merge([baseUniforms, customUniforms]);
            //     const treeFoliageMat = new THREE.ShaderMaterial({
            //         uniforms: treeUniforms,
            //         vertexShader: vertexShader,
            //         fragmentShader: fragmentShader,
            //         lights: true,
            //     })
            //     const treeFoliageDepthMat = new THREE.ShaderMaterial({
            //         vertexShader: vertexDepth,     // similar to your foliage vertex displacement
            //         fragmentShader: `
            //             uniform sampler2D uFoliageTexture;
            //             uniform vec3 uColorMap[4];

            //             varying vec2 vUv;
            //             varying vec3 vNormalWS;
            //               void main() {
            //                 float m = texture2D(uFoliageTexture, vUv).a;
            //                 if (m < 0.5) discard;
            //                 gl_FragColor = vec4( vec3( gl_FragCoord.z ), 1.0 );
            //               }
            //             `,
            //         uniforms: treeUniforms,             // same uniforms (at least the displacement ones!)
            //     });
            //     // treeFoliage.castShadow = true;
            //     // treeFoliage.material = treeFoliageMat;
            //     // treeFoliage.customDepthMaterial = treeFoliageDepthMat
            //     // treeFoliage.receiveShadow = false;
            //     // ctx.scene.add(treeFoliage);

            //     const COUNT = 100;
            //     const trunkIM = new THREE.InstancedMesh(treeTrunkGeo, treeTrunkMat, COUNT);
            //     const foliageIM = new THREE.InstancedMesh(treeFoliageGeo, treeFoliageMat, COUNT);
            //     foliageIM.customDepthMaterial = treeFoliageDepthMat;

            //     trunkIM.castShadow = true;
            //     trunkIM.receiveShadow = true;
            //     foliageIM.castShadow = true;
            //     foliageIM.receiveShadow = true;

            //     ctx.scene.add(trunkIM);
            //     ctx.scene.add(foliageIM);

            //     // 4) Scatter across 200x200 terrain (x,z in [-100,100])
            //     const dummy = new THREE.Object3D();
            //     const { heightScale, heightOffset, terrainWidth, terrainLength } = ctx.state.terrainState;

            //     // const heightMapRef = useRef<THREE.Texture | null>(null);

            //     let heightSampler: {
            //         heightAtXZ(x: number, z: number, heightScale: number, heightOffset: number): number;
            //     }

            //     ctx.loaders.texture.loadAsync('/textures/terrain_height.jpg').then((heightMap) => {
            //         const terrainMin = new THREE.Vector2(-terrainWidth * 0.5, -terrainLength * 0.5);
            //         const terrainMax = new THREE.Vector2(terrainWidth * 0.5, terrainLength * 0.5);
            //         heightSampler = makeHeightSampler(heightMap, terrainMin, terrainMax, { flipV: true });

            //         for (let i = 0; i < COUNT; i++) {
            //             const x = THREE.MathUtils.randFloatSpread(terrainWidth ?? 200);  // ~[-100,100]
            //             const z = THREE.MathUtils.randFloatSpread(terrainLength ?? 200);  // ~[-100,100]
            //             const y = heightSampler.heightAtXZ(x, z, heightScale, heightOffset);

            //             // random rot/scale per tree
            //             const yaw = Math.random() * Math.PI * 2;
            //             const s = THREE.MathUtils.lerp(0.85, 1.25, Math.random());

            //             dummy.position.set(x, y, z);
            //             dummy.rotation.set(0, yaw, 0);
            //             dummy.scale.set(s, s, s);
            //             dummy.updateMatrix();

            //             trunkIM.setMatrixAt(i, dummy.matrix);
            //             foliageIM.setMatrixAt(i, dummy.matrix);
            //         }

            //         trunkIM.instanceMatrix.needsUpdate = true;
            //         foliageIM.instanceMatrix.needsUpdate = true;
            //     });


            // })
        },
        update(ctx: SceneContext) { },
        dispose() { }
    }
}