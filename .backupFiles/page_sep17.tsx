"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
    GLTFLoader,
    Timer,
} from "three/examples/jsm/Addons.js";
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import vertexShader from "./grassShader/vertex.vert";
import fragmentShader from "./grassShader/fragment.frag";
import MyGui from "@/lib/gui";
import { rotate } from "three/tsl";
import { setupThreeCore } from "./core/threeCore";
import { SceneContext, System } from "./core/types";
import { makeControlsSystem } from "./systems/makeControlSystem";

const NUM_GRASS = 30625;
// const NUM_GRASS = 10;
const GRASS_SEGMENT = 6;
const GRASS_VERTICES = (GRASS_SEGMENT + 1) * 2;
const GRASS_PATCH_SIZE = 50;
const GRASS_WIDTH = 0.1;
const GRASS_HEIGHT = 0.9;

export enum CONTROL_TYPE {
    Walk = "Walk",
    Orbit = "Orbit",
};
export interface ControlStats {
    type: CONTROL_TYPE;
}

const createGrassGeometry = (segment: number, grassNumber: number) => {
    //indices for each singel gass blade
    const indices: number[] = [];

    for (let i = 0; i < segment; ++i) {
        const vi = i * 2;
        indices[i * 6 + 0] = vi + 0;
        indices[i * 6 + 1] = vi + 1;
        indices[i * 6 + 2] = vi + 2;
        indices[i * 6 + 3] = vi + 1;
        indices[i * 6 + 4] = vi + 3;
        indices[i * 6 + 5] = vi + 2;
    }

    const geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = grassNumber;
    geo.setIndex(indices);
    geo.computeBoundingSphere();
    geo.boundingSphere = new THREE.Sphere(
        new THREE.Vector3(0, GRASS_HEIGHT / 2, 0),
        GRASS_PATCH_SIZE * 1.5 + GRASS_HEIGHT
    );

    return geo;
}

//remove
// const setupControls = (controlType: CONTROL_TYPE, camera: THREE.Camera, renderer: THREE.WebGLRenderer, scene: THREE.Scene) => {
//     switch (controlType) {
//         case CONTROL_TYPE.Walk:
//             const walkControl = new PointerLockControls(camera, renderer.domElement);
//             document.addEventListener('click', (e) => {
//                 if (e.target !== renderer.domElement) return;
//                 if (!walkControl.isLocked) walkControl.lock();
//             });
//             scene.add(walkControl.object);
//             return walkControl;
//         case CONTROL_TYPE.Orbit:
//             const orbitControl = new OrbitControls(camera, renderer.domElement);
//             orbitControl.enabled = true;
//             orbitControl.enableDamping = true;
//             orbitControl.target.set(0, 1.6, -1.6);
//             orbitControl.update();
//             return orbitControl;
//         default:
//             throw new Error("Unknown control type");
//     }
// }



export default function Page() {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setFullScreen] = useState<boolean>(false);
    const scene = useMemo(() => new THREE.Scene(), []);
    const materials: THREE.Material[] = useMemo(() => [], []);
    const gltfLoader = useMemo(() => new GLTFLoader(), []);
    const [controlStats, setControlStats] = useState<ControlStats>({ type: CONTROL_TYPE.Walk });
    const grassClumpsGeo = useRef<THREE.Mesh>(null);
    const stateRef = useRef<SceneContext['state'] | null>(null);


    const planets = [
        { name: "Mercury", speed: 0.2, spinRate: 0.027, },
        { name: "Venus", speed: 0.15, spinRate: -0.007 }, // retrograde
        { name: "Earth", speed: 0.1, spinRate: 1.6 * 0.5 },
        { name: "Mars", speed: 0.08, spinRate: 1.5 * 0.5 },
        { name: "Jupiter", speed: 0.05, spinRate: 3.86 * 0.25 },
        { name: "Saturn", speed: 0.04, spinRate: 3.6 * 0.25 },
        { name: "Uranus", speed: 0.03, spinRate: -2.2 * 0.5 }, // retrograde
        { name: "Neptune", speed: 0.02, spinRate: 2.4 * 0.5 },
    ];
    const sunRoom5WorldPosition = new THREE.Vector3();

    const orbitGroups: { planet: THREE.Object3D, radius: number, speed: number, spinRate: number }[] = [];




    useEffect(() => {
        if (!canvasRef.current) return;
        const { scene, camera, renderer, clock, state, loaders, disposeCore } = setupThreeCore(canvasRef.current, { background: "#62aef0" });
        stateRef.current = state;

        const controlSystem = makeControlsSystem();
        controlSystem.init({ scene, camera, renderer, clock, loaders, state });

        function makeToonRamp(bands: { color: string | number; width?: number }[]) {
            // width = pixels per band (controls how “thick” each band is). Default 64.
            const widths = bands.map(b => b.width ?? 64);
            const total = widths.reduce((a, b) => a + b, 0);

            const canvas = document.createElement('canvas');
            canvas.width = total;
            canvas.height = 1;
            const ctx = canvas.getContext('2d')!;

            let x = 0;
            for (const b of bands) {
                const w = b.width ?? 64;
                ctx.fillStyle = new THREE.Color(b.color).getStyle();
                ctx.fillRect(x, 0, w, 1);
                x += w;
            }

            const tex = new THREE.CanvasTexture(canvas);
            tex.minFilter = THREE.NearestFilter;  // hard steps
            tex.magFilter = THREE.NearestFilter;
            tex.generateMipmaps = false;          // keep crisp bands
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.colorSpace = THREE.SRGBColorSpace; // colored bands should be sRGB
            return tex;
        }

        // 3-band: shadow, mid, highlight
        const ramp3 = makeToonRamp([
            // { color: '#c7a66a', width: 1 }, // dark/shadow color
            // { color: '#c7a66a', width: 3 }, // midtone
            { color: '#ebdfae', width: 1 }, // midtone
            { color: '#fff7d5', width: 1 }, // light
        ]);

        //#region Load Textures
        const textureLoader = new THREE.TextureLoader();
        const bakedTexture = textureLoader.load('/textures/stone-texture.png');
        const caveBodyTexture = textureLoader.load('/textures/Rock_BaseColor.png');
        const tableTexture = textureLoader.load('/textures/desk-texture.jpg');
        const stoneEntryTexture = textureLoader.load('/textures/cave-entry-baseColor.png');

        const wallBaseColorTexture = textureLoader.load('/textures/wall_BaseColor.png');
        const WallNormalMap = textureLoader.load('/textures/wall_Normal_soften.png');

        const backgroundMountainsTexture = textureLoader.load('/textures/background-mountain_BaseColor.png');
        const backgroundMountainsNormalMap = textureLoader.load('/textures/background-mountain_Normal.png');
        const stoneEntryNormalMap = textureLoader.load('/textures/cave-entry-normal.png');
        // const stoneEntryARMMap = textureLoader.load('/textures/cave-entry-arm.png');

        const groundTexture = textureLoader.load('/textures/grass-mask-3.png');

        //#endregion

        //#region Set Texuture Properties
        bakedTexture.flipY = false; // glTF uses a different Y-axis orientation
        bakedTexture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is in sRGB color space

        tableTexture.flipY = false; // glTF uses a different Y-axis orientation
        tableTexture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is in sRGB color space

        wallBaseColorTexture.flipY = false; // glTF uses a different Y-axis orientation  
        wallBaseColorTexture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is in sRGB color space

        WallNormalMap.flipY = false; // glTF uses a different Y-axis orientation

        caveBodyTexture.flipY = false; // glTF uses a different Y-axis orientation
        caveBodyTexture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is in

        stoneEntryTexture.flipY = false; // glTF uses a different Y-axis orientation    
        stoneEntryTexture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is in sRGB color space

        stoneEntryNormalMap.flipY = false; // glTF uses a different Y-axis orientation
        // stoneEntryARMMap.flipY = false; // glTF uses a different Y-axis orientation

        backgroundMountainsTexture.flipY = false; // glTF uses a different Y-axis orientation
        backgroundMountainsTexture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is

        backgroundMountainsNormalMap.flipY = false; // glTF uses a different Y-axis orientation

        groundTexture.flipY = false;
        groundTexture.colorSpace = THREE.SRGBColorSpace;
        groundTexture.magFilter = THREE.LinearFilter;
        //#endregion

        //#region Create a material using the baked texture
        const tableMaterial = new THREE.MeshBasicMaterial({
            map: tableTexture,
        });

        // const leftWallMaterial = new THREE.MeshStandardMaterial({
        //     map: leftWallTexture,
        //     normalMap: WallNormalMap,
        //     roughness:1,
        // });
        const wallMaterial = new THREE.MeshToonMaterial({
            map: wallBaseColorTexture,                   // base color (sRGB)
            gradientMap: ramp3,          // <- your colored bands
            normalMap: WallNormalMap,           // supported by MeshToonMaterial               // (R) channel if your ARM packs AO there
            // MeshToonMaterial ignores rough/metal PBR, so skip roughnessMap/metalnessMap
            color: 0xffffff,             // don’t tint unless you want to
        });

        // wallMaterial.onBeforeCompile = (shader) => {
        //     // 1) Make a little helper we can reuse
        //     shader.fragmentShader = shader.fragmentShader.replace(
        //         '#include <common>',
        //         `
        //       #include <common>
        //       float toonStep(float x, float levels){
        //         x = clamp(x, 0.0, 1.0);
        //         return floor(x * levels) / levels;
        //       }
        //       `
        //     );

        //     // 2) After lighting is computed, quantize the **direct diffuse** only
        //     //    (so AO/IBL/specular still behave nicely)
        //     shader.fragmentShader = shader.fragmentShader.replace(
        //         '#include <lights_fragment_end>',
        //         `
        //       #include <lights_fragment_end>

        //       // Convert direct diffuse to a scalar intensity, step it, then reapply color
        //       // This gives nicer bands than stepping each RGB channel independently.
        //       float levels = 3.0; // <-- three bands
        //       // Luminance of direct diffuse
        //       float dd = dot( reflectedLight.directDiffuse, vec3(0.2126, 0.7152, 0.0722) );
        //       float ddStepped = toonStep(dd, levels);

        //       // Re-apply stepped intensity keeping hue from original direct term
        //       vec3 directDir = reflectedLight.directDiffuse;
        //       float eps = 1e-5;
        //       vec3 directNorm = (length(directDir) > eps) ? (directDir / max(length(directDir), eps)) : vec3(0.0);
        //       reflectedLight.directDiffuse = directNorm * ddStepped;

        //       // add after the quantization block
        //       float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(-vViewPosition)), 0.0), 2.5);
        //       vec3 rimColor = vec3(0.1); // gentle gray rim
        //       reflectedLight.directDiffuse += rim * rimColor * 0.5;
        //       `
        //     );
        // };

        // const backgroundMountainsMaterial = new THREE.MeshStandardMaterial({
        //     map: backgroundMountainsTexture,
        //     normalMap: backgroundMountainsNormalMap,
        //     roughness:1,
        // });
        const backgroundMountainsMaterial = new THREE.MeshToonMaterial({
            map: backgroundMountainsTexture,
            gradientMap: ramp3,
            normalMap: backgroundMountainsNormalMap,
            color: 0xffffff,
        })

        const caveBodyMaterial = new THREE.MeshBasicMaterial({
            map: caveBodyTexture,
        })

        // const stoneEntryMaterial = new THREE.MeshStandardMaterial({
        //     map: stoneEntryTexture,
        //     normalMap: stoneEntryNormalMap,
        //     aoMap: stoneEntryARMMap,
        //     aoMapIntensity: 1,
        //     roughnessMap: stoneEntryARMMap,
        //     metalnessMap: stoneEntryARMMap,
        // })

        const stoneEntryMaterial = new THREE.MeshToonMaterial({
            map: stoneEntryTexture,
            gradientMap: ramp3,
            normalMap: stoneEntryNormalMap,
            color: 0xffffff,
        })

        const grassMaterial = new THREE.MeshToonMaterial({
            color: new THREE.Color(0.474, 0.749, 0.349),
            side: THREE.DoubleSide,
        });

        const groundMaterial = new THREE.MeshToonMaterial({
            map: groundTexture,
            gradientMap: ramp3,
            color: 0xffffff,
        })

        //#endregion


        //#region Load Model
        if (!grassClumpsGeo.current) {
            gltfLoader.load('/models/grass.glb', (gltf) => {
                const model = gltf.scene;
                const grass = model.getObjectByName('grass');
                grass?.position.set(25, 0, 30)
                if (grass && grass instanceof THREE.Mesh) {
                    grassClumpsGeo.current = grass;
                    console.log("grass: ", grass);

                    grass.material = grassMaterial;
                    materials.push(grassMaterial);
                    scene.add(grass);
                } else {
                    console.error('Grass not found or is not a Mesh');
                }
            });
        }

        gltfLoader.load('/models/portfolio-cave.glb', (gltf) => {
            console.log(gltf);
            const model = gltf.scene;
            console.log('scene: ', model);
            model.position.set(0, 0, 0);
            model.rotateY(-Math.PI / 2);
            scene.add(model);
            const rightWall = model.getObjectByName('right-wall-low');
            console.log('rightWall: ', rightWall);
            const leftWall = model.getObjectByName('left-wall-low');
            console.log('leftWall: ', leftWall);
            const caveBody = model.getObjectByName('cave-body-low')!; //need to clean the type
            const table = model.getObjectByName('table-geo');
            const stoneEntry = model.getObjectByName('stone-entry-low');
            const ground = model.getObjectByName('ground');

            const backgroundMountains = model.getObjectByName('background-mountains-low');

            const sunRoom5 = model.getObjectByName('Sun');


            if (rightWall && rightWall instanceof THREE.Mesh) {
                console.log('Right wall found:', rightWall);
                // Assign the new material
                rightWall.material = wallMaterial;
                rightWall.castShadow = true;
                rightWall.receiveShadow = true;
                rightWall.layers.set(1);

            } else {
                console.error('Right wall not found or is not a Mesh');
            }

            if (leftWall && leftWall instanceof THREE.Mesh) {
                console.log('Left wall found:', leftWall);
                // Assign the new material
                leftWall.material = wallMaterial;
                leftWall.castShadow = true;
                leftWall.receiveShadow = true;
            } else {
                console.error('Left wall not found or is not a Mesh');
            }

            if (ground && ground instanceof THREE.Mesh) {
                console.log('Ground found:', ground);
                const groundGeo = ground.geometry as THREE.BufferGeometry;
                const positions = groundGeo.attributes.position;
                const worldVertices: THREE.Vector3[] = [];
                const xRange = new THREE.Vector2(+Infinity, -Infinity);
                const zRange = new THREE.Vector2(+Infinity, -Infinity);
                ground.updateWorldMatrix(true, false);
                for (let i = 0; i < positions.count; i++) {
                    const local = new THREE.Vector3(
                        positions.getX(i),
                        positions.getY(i),
                        positions.getZ(i)
                    );
                    const world = local.clone().applyMatrix4(ground.matrixWorld);
                    xRange.x = Math.min(xRange.x, world.x)
                    xRange.y = Math.max(xRange.y, world.x)
                    zRange.x = Math.min(zRange.x, world.z)
                    zRange.y = Math.max(zRange.y, world.z)
                    worldVertices.push(world);
                }
                console.log("x range: ", xRange);
                console.log("z range: ", zRange);
                ground.material = groundMaterial;
                ground.receiveShadow = true;
                // Assign the new material
                const maxCount = 20000;
                if (grassClumpsGeo.current) {
                    const grassGeo = grassClumpsGeo.current.geometry.clone();
                    // grassGeo.applyMatrix4(grass.matrix);   // bake local transform into vertices
                    // grassGeo.computeVertexNormals();
                    const inst = new THREE.InstancedMesh(grassGeo, grassMaterial, maxCount);
                    const dummy = new THREE.Object3D();
                    (async () => {
                        const img = await textureLoader.loadAsync('/textures/grass-mask-3.png');
                        ground.receiveShadow = true;
                        console.log('img.image: ', img.image)
                        const grassMask = img.image as HTMLImageElement | ImageBitmap;
                        console.log("grass mask: ", grassMask);
                        const c = document.createElement('canvas');
                        c.width = grassMask.width;
                        c.height = grassMask.height;
                        console.log('width: ', c.width, 'height: ', c.height);
                        const ctx = c.getContext('2d')!;
                        ctx.translate(c.width / 2, c.height / 2);
                        ctx.rotate(Math.PI / 2);
                        ctx.scale(-1, 1);
                        ctx.drawImage(grassMask, -c.width / 2, -c.height / 2);
                        ctx.restore();
                        const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);

                        function sampleGrassMask(u: number, v: number) {
                            u = Math.min(Math.max(u, 0), 1);
                            v = Math.min(Math.max(v, 0), 1);
                            const x = Math.floor(u * (width - 1));
                            const y = Math.floor((1 - v) * (height - 1));
                            const i = (y * width + x) * 4;
                            return {
                                r: data[i] / 255,
                                g: data[i + 1] / 255,
                                b: data[i + 2] / 255
                            };
                        }


                        function uvToWorld(u: number, v: number,) {
                            const x = xRange.x + u * (xRange.y - xRange.x);
                            const z = zRange.x + v * (zRange.y - zRange.x);
                            const pos = new THREE.Vector3(x, 0, z);
                            return pos;
                        }

                        console.log("test sampleGrassMask: ", sampleGrassMask(1, 0))
                        const step = 1 / 100; // sampling resolution, 256^2 = ~65k samples
                        let placed = 0;
                        for (let v = 0; v <= 1; v += step) {
                            for (let u = 0; u <= 1; u += step) {
                                const { r, g, b } = sampleGrassMask(u, v);
                                if (g > r * 1.2) {
                                    const pos = uvToWorld(u, v);
                                    // const { x: xr, y: yr } = rotateXY(pos.x, pos.z, Math.PI / 2);
                                    // pos.x = xr;
                                    // pos.z = yr;
                                    dummy.position.set(pos.x, 0, pos.z);
                                    dummy.rotation.y = Math.random() * Math.PI * 2;
                                    dummy.scale.setScalar(0.43);
                                    dummy.updateMatrix();
                                    inst.setMatrixAt(placed, dummy.matrix);

                                    const c = new THREE.Color(r, g, b);
                                    inst.setColorAt(placed, c);
                                    placed++;
                                    if (placed >= inst.count) break;
                                }
                            }
                        }
                        inst.count = placed;
                        inst.instanceMatrix.needsUpdate = true;
                        if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
                        scene.add(inst)
                    })()
                }
            } else {
                console.error('Ground not found or is not a Mesh');
            }

            if (stoneEntry && stoneEntry instanceof THREE.Mesh) {
                console.log('Stone Entry found:', stoneEntry);
                // Assign the new material
                stoneEntry.material = stoneEntryMaterial;
                stoneEntry.castShadow = true;
                stoneEntry.receiveShadow = true;
            } else {
                console.error('Stone entry not found or is not a Mesh');
            }

            if (backgroundMountains && backgroundMountains instanceof THREE.Mesh) {
                console.log('Background Mountains found:', backgroundMountains);
                // Assign the new material
                backgroundMountains.material = backgroundMountainsMaterial;
                backgroundMountains.castShadow = true;
                backgroundMountains.receiveShadow = true;
            } else {
                console.error('Background Mountains not found or is not a Mesh');
            }

            if (caveBody && caveBody instanceof THREE.Mesh) {
                console.log('Cave Body wall found:', caveBody.geometry.attributes);
                // Assign the new material
                caveBody.material = caveBodyMaterial;
                caveBody.castShadow = true;
                caveBody.receiveShadow = true;
            } else {
                console.error('Cave body not found or is not a Mesh');
            }

            if (sunRoom5 && sunRoom5 instanceof THREE.Mesh) {
                sunRoom5.getWorldPosition(sunRoom5WorldPosition);
                //camera.position.set(sunRoom5WorldPosition.x, 1.6, sunRoom5WorldPosition.z);
                sunRoom5.position.copy(sunRoom5WorldPosition);
                scene.add(sunRoom5);
                orbitGroups.push({ planet: sunRoom5, radius: 0, speed: 0, spinRate: 0.1 });
                console.log("sun world position: ", sunRoom5.getWorldPosition(new THREE.Vector3()));
                console.log("sun local position: ", sunRoom5.position);
                planets.forEach(p => {
                    const planet = model.getObjectByName(p.name);
                    if (!planet) {
                        console.warn(`${p.name} not found`);
                        return;
                    }
                    planet.position.copy(planet.getWorldPosition(new THREE.Vector3()));
                    scene.add(planet);
                    const planetWorldPosition = planet.getWorldPosition(new THREE.Vector3());
                    const radius = planetWorldPosition.distanceTo(sunRoom5WorldPosition);

                    orbitGroups.push({ planet, radius, speed: p.speed, spinRate: p.spinRate });
                });
            } else {
                console.error('Sun Room 5 not found or is not a Mesh');
            }

            if (table && table instanceof THREE.Mesh) {
                console.log('Table found:', table);
                // Assign the new material
                table.material = tableMaterial;
            }
            else {
                console.error('Table not found or is not a Mesh');
            }

        }, undefined, (error) => {
            console.error('An error happened while loading the model:', error);
        });
        //#endregion

        //#region Suns
        const sun1Color = new THREE.Color("#E9E4C5");
        const sun1 = new THREE.DirectionalLight(sun1Color, 4.3);
        sun1.position.set(10, 5, 1);
        sun1.target.position.set(0, 0, 0);
        sun1.name = 'yellow sun';
        sun1.castShadow = true;
        sun1.shadow.camera.left = -20;
        sun1.shadow.camera.right = 20;
        sun1.shadow.camera.top = 20;
        sun1.shadow.camera.bottom = -20;
        sun1.shadow.camera.near = 0.5;
        sun1.shadow.camera.far = 20;
        sun1.shadow.mapSize.set(2048, 2048);
        sun1.shadow.bias = -0.0005;
        sun1.shadow.normalBias = 0.02; // reduces acne when surfaces are coplanar-ish
        // Add a helper temporarily
        // scene.add(new THREE.CameraHelper(sun1.shadow.camera));
        scene.add(sun1);
        const sun1Helper = new THREE.DirectionalLightHelper(sun1, 1, 'red');
        scene.add(sun1Helper)

        const sun2Color = new THREE.Color("#8FC6DC");
        const sun2 = new THREE.DirectionalLight(sun2Color, 3.14);
        sun2.position.set(-8.65, 3.41, 3.79,);
        sun2.name = 'blue sun';
        sun2.layers.set(1);
        scene.add(sun2);
        const sun2Helper = new THREE.DirectionalLightHelper(sun2, 1, 'blue');
        scene.add(sun2Helper)

        //#endregion

        // const plane = new THREE.Mesh(
        //     new THREE.PlaneGeometry(50, 50),
        //     new THREE.MeshBasicMaterial({
        //         color: new THREE.Color(0.474, 0.749, 0.349),
        //         side: THREE.FrontSide,
        //     })
        // )
        // plane.rotation.x = -Math.PI / 2;
        // scene.add(plane);

        //#region grass


        // const grassTexture = new THREE.TextureLoader().load('/textures/greenTexture3.png');
        // grassTexture.wrapS = THREE.RepeatWrapping;
        // grassTexture.wrapT = THREE.RepeatWrapping;
        // grassTexture.repeat.set(1, 1);
        // const uniforms = {
        //     time: { value: 0 },
        //     resolution: { value: new THREE.Vector2(1, 1) },
        //     grassWidth: { value: GRASS_WIDTH },
        //     grassHeight: { value: GRASS_HEIGHT },
        //     grassSegment: { value: GRASS_SEGMENT },
        //     grassVertices: { value: GRASS_VERTICES },
        //     grassPatchSize: { value: GRASS_PATCH_SIZE },
        //     grassTexture: { value: grassTexture },
        // }
        // const grassMaterial = new THREE.ShaderMaterial({
        //     vertexShader,
        //     fragmentShader,
        //     side: THREE.DoubleSide,
        //     uniforms: uniforms,
        // });
        // materials.push(grassMaterial);

        // const grassMesh = new THREE.Mesh(
        //     createGrassGeometry(GRASS_SEGMENT, NUM_GRASS),
        //     grassMaterial
        // )
        // grassMesh.position.set(0, 0, 0);
        // scene.add(grassMesh);
        //#endregion

        document.addEventListener("fullscreenchange", handleFullScreenChange);
        //#endregion

        //#region Set Up Controls

        //remove
        //control logic
        // const velocity = new THREE.Vector3();
        // const direction = new THREE.Vector3();
        // const move = { forward: false, backward: false, left: false, right: false, run: false };
        // let walkTime = 0;
        // const bobFrequency = 1.5;     // Controls how fast the bobbing is
        // const bobAmplitude = 0.02;  // Controls how much the camera bobs
        // const baseY = 1.6;          // Default head height

        // const onKeyDown = (event: KeyboardEvent) => {
        //     switch (event.code) {
        //         case 'KeyW': move.forward = true; break;
        //         case 'KeyS': move.backward = true; break;
        //         case 'KeyA': move.left = true; break;
        //         case 'KeyD': move.right = true; break;
        //         case 'ShiftLeft': move.run = true; break; // Optional: add running
        //     }
        // };

        // const onKeyUp = (event: KeyboardEvent) => {
        //     switch (event.code) {
        //         case 'KeyW': move.forward = false; break;
        //         case 'KeyS': move.backward = false; break;
        //         case 'KeyA': move.left = false; break;
        //         case 'KeyD': move.right = false; break;
        //         case 'ShiftLeft': move.run = false; break; // Optional: add running
        //     }
        // };

        // document.addEventListener('keydown', onKeyDown);
        // document.addEventListener('keyup', onKeyUp);

        // const debugControl = new OrbitControls(camera, renderer.domElement);
        // debugControl.enabled = false;
        // debugControl.enableDamping = true;

        //#endregion

        // scene.fog = new THREE.Fog(0xaaaaaa, 15, 20);
        // const fogPlane = new THREE.Mesh(
        //     new THREE.PlaneGeometry(100, 100),
        //     new THREE.MeshBasicMaterial({
        //       color: 0xaaaaaa,
        //     })
        //   );
        //   fogPlane.position.set(0, 0, 30); // only in front
        //   fogPlane.rotation.y = Math.PI; // face the camera
        //   scene.add(fogPlane);

        const timer = new Timer();
        let angle = 0.0;
        const animate = () => {
            requestAnimationFrame(animate);
            timer.update();

            // angle += 0.01; // rotation speed

            // // Rotate light around its target along Z-axis
            // const radius = 5.74; // distance from target
            // sun1.position.x = Math.cos(angle) * radius * 0.01;
            // sun1.position.y = Math.sin(angle) * radius * 0.01;
            // sun1.position.z = 2; // keep some height if needed

            // sun1.target.updateMatrixWorld(); // ensure it's updated
            // sun1Helper.update(); // update helper after position change

            //remove
            // if (control instanceof OrbitControls && control.enabled) {
            //     control.update();
            // }

            //update uniforms
            for (const material of materials) {
                if (material instanceof THREE.ShaderMaterial) {
                    material.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
                    material.uniforms.time.value = timer.getElapsed();
                }
            }

            //remove
            //update control
            // if (control instanceof PointerLockControls && control.isLocked) {
            //     direction.z = Number(move.forward) - Number(move.backward);
            //     direction.x = Number(move.right) - Number(move.left);
            //     direction.normalize();

            //     const speed = 0.03 * (move.run ? 5 : 1); // Optional: add running speed
            //     velocity.x = direction.x * speed;
            //     velocity.z = direction.z * speed;

            //     control.moveRight(velocity.x);
            //     control.moveForward(velocity.z);

            //     // Update walk time only if moving
            //     const isMoving = direction.lengthSq() > 0;
            //     if (isMoving) {
            //         walkTime += 0.1;
            //     } else {
            //         walkTime = 0;
            //     }

            //     // Apply bobbing
            //     const yOffset = isMoving ? Math.sin(walkTime * bobFrequency) * bobAmplitude : 0;
            //     camera.position.y = baseY + yOffset;
            // }

            orbitGroups.forEach(o => {
                o.planet.position.x = sunRoom5WorldPosition.x + Math.cos(o.speed * timer.getElapsed()) * o.radius;
                o.planet.position.z = sunRoom5WorldPosition.z + Math.sin(o.speed * timer.getElapsed()) * o.radius;
                o.planet.rotation.y += o.spinRate * timer.getDelta(); // Rotate the planet
            });

            //light follow the camera
            //pointLight1.position.set(camera.position.x, 1.2, camera.position.z);

            //control.update();
            renderer.render(scene, camera);
        };
        animate();
    }, [scene, controlStats]);

    const handleFullScreen = () => {
        if (isFullScreen) {
            document.exitFullscreen();
        } else {
            canvasRef.current?.requestFullscreen();
        }
    };

    const getFullScreenText = () => {
        if (isFullScreen) {
            return "Exit Full Screen";
        } else {
            return "Enter Full Screen";
        }
    };
    const handleFullScreenChange = () => {
        if (document.fullscreenElement) {
            setFullScreen(true);
        } else {
            setFullScreen(false);
        }
    };

    const updateControlType = (type: CONTROL_TYPE) => {
        console.log("Updating control type to: ", type);
        setControlStats({ type });
    }


    return (
        <div ref={canvasRef} className="relative w-full h-[calc(100vh-64px)]">
            <MyGui controlStats={{ type: controlStats.type }} updateControlType={updateControlType}></MyGui>
            <button
                className="absolute top-4 right-4 bg-blue-500 text-white py-2 px-4 rounded shadow-lg"
                onClick={handleFullScreen}
            >
                {getFullScreenText()}
            </button>
        </div>
    );
}
