"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
    GLTFLoader,
    Timer,
} from "three/examples/jsm/Addons.js";
import { setupThreeCore } from "./core/threeCore";
import { makeControlsSystem } from "./systems/makeControlSystem";
import makeGUISystem from "./systems/makeGUISystem";

const NUM_GRASS = 30625;
// const NUM_GRASS = 10;
const GRASS_SEGMENT = 6;
const GRASS_VERTICES = (GRASS_SEGMENT + 1) * 2;
const GRASS_PATCH_SIZE = 50;
const GRASS_WIDTH = 0.1;
const GRASS_HEIGHT = 0.9;


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

export default function Page() {
    const canvasRef = useRef<HTMLDivElement>(null);
    const scene = useMemo(() => new THREE.Scene(), []);
    const materials: THREE.Material[] = useMemo(() => [], []);
    const gltfLoader = useMemo(() => new GLTFLoader(), []);
    const grassClumpsGeo = useRef<THREE.Mesh>(null);


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

        //initialize core ThreeJS components
        const ctx = setupThreeCore(canvasRef.current, { background: "#62aef0" });
        const { scene, camera, renderer, clock, state, loaders, disposeCore } = ctx;

        //setup systems
        const controlSystem = makeControlsSystem();
        controlSystem.init(ctx);

        const guiSystem = makeGUISystem();
        guiSystem.init(ctx);
        guiSystem.toggleControl(ctx, controlSystem.switchControl);

        const handleFullScreen = () => {
            if (document.fullscreenElement === renderer.domElement) {
                document.exitFullscreen();
            } else {renderer.domElement.requestFullscreen();
            }
        };
        window.addEventListener('keydown', (key)=> {
            if(key.key === 'f'){
                handleFullScreen()
            }
        })

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

        const wallMaterial = new THREE.MeshToonMaterial({
            map: wallBaseColorTexture,                   // base color (sRGB)
            gradientMap: ramp3,          // <- your colored bands
            normalMap: WallNormalMap,           // supported by MeshToonMaterial               // (R) channel if your ARM packs AO there
            // MeshToonMaterial ignores rough/metal PBR, so skip roughnessMap/metalnessMap
            color: 0xffffff,             // don’t tint unless you want to
        });

        const backgroundMountainsMaterial = new THREE.MeshToonMaterial({
            map: backgroundMountainsTexture,
            gradientMap: ramp3,
            normalMap: backgroundMountainsNormalMap,
            color: 0xffffff,
        })

        const caveBodyMaterial = new THREE.MeshBasicMaterial({
            map: caveBodyTexture,
        })

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

        const timer = new Timer();
        let angle = 0.0;
        const animate = () => {
            requestAnimationFrame(animate);
            timer.update();
            controlSystem.update(ctx);
            // angle += 0.01; // rotation speed

            // // Rotate light around its target along Z-axis
            // const radius = 5.74; // distance from target
            // sun1.position.x = Math.cos(angle) * radius * 0.01;
            // sun1.position.y = Math.sin(angle) * radius * 0.01;
            // sun1.position.z = 2; // keep some height if needed

            // sun1.target.updateMatrixWorld(); // ensure it's updated
            // sun1Helper.update(); // update helper after position change


            //update uniforms
            for (const material of materials) {
                if (material instanceof THREE.ShaderMaterial) {
                    material.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
                    material.uniforms.time.value = timer.getElapsed();
                }
            }

            orbitGroups.forEach(o => {
                o.planet.position.x = sunRoom5WorldPosition.x + Math.cos(o.speed * timer.getElapsed()) * o.radius;
                o.planet.position.z = sunRoom5WorldPosition.z + Math.sin(o.speed * timer.getElapsed()) * o.radius;
                o.planet.rotation.y += o.spinRate * timer.getDelta(); // Rotate the planet
            });

            //light follow the camera
            //pointLight1.position.set(camera.position.x, 1.2, camera.position.z);

            renderer.render(scene, camera);
        };
        animate();
    }, [scene]);

    return (
        <div ref={canvasRef} className="relative w-full h-[calc(100vh-64px)]">
            {/* <button
                className="absolute top-4 right-4 bg-blue-500 text-white py-2 px-4 rounded shadow-lg"
                onClick={handleFullScreen}
            >
                {getFullScreenText()}
            </button> */}
        </div>
    );
}
