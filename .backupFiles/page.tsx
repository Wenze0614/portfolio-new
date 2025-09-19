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
import treeVertexShader from "./treeShader/vertex.vert";
import treeFragmentShader from "./treeShader/fragment.frag";
import { tree } from "next/dist/build/templates/app-page";
import MyGui from "@/lib/gui";

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

        // const fi = GRASS_VERTICES + vi;
        // indices[i * 12 + 6] = fi + 0;
        // indices[i * 12 + 7] = fi + 1;
        // indices[i * 12 + 8] = fi + 2;
        // indices[i * 12 + 9] = fi + 1;
        // indices[i * 12 + 10] = fi + 3;
        // indices[i * 12 + 11] = fi + 2;
    }

    const geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = grassNumber;
    geo.setIndex(indices);
    geo.computeBoundingSphere();
    geo.boundingSphere = new THREE.Sphere(
        new THREE.Vector3(0, GRASS_HEIGHT / 2, 0),
        GRASS_PATCH_SIZE * 1.5 + GRASS_HEIGHT
    );
    //geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1 + GRASS_PATCH_SIZE * 2);

    return geo;
}

const NUM_LEAVES = 1000;
const LEAVE_SEGMENT = 2;
const LEAVE_VERTICES = (LEAVE_SEGMENT + 1) * 2;
const LEAVE_WIDTH = 0.1;
const LEAVE_HEIGHT = 0.1;

export default function Page() {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setFullScreen] = useState<boolean>(false);
    const scene = useMemo(() => new THREE.Scene(), []);
    const materials: THREE.Material[] = useMemo(() => [], []);
    const gltfLoader = useMemo(() => new GLTFLoader(), []);
    const sun1 = useRef<THREE.DirectionalLight>(null)
    const sun2 = useRef<THREE.DirectionalLight>(null)
    const sun3 = useRef<THREE.DirectionalLight>(null)
    const sun4 = useRef<THREE.DirectionalLight>(null)
    const [suns, setSuns] = useState<THREE.DirectionalLight[]>([]);

    const addSun = (sun: THREE.DirectionalLight) => {
        setSuns(suns => [sun, ...suns])
    }

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

        const camera = new THREE.PerspectiveCamera(
            30,
            canvasRef.current.clientWidth / canvasRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 1.6, 0);
        scene.add(camera);

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

            const backgroundMountains = model.getObjectByName('background-mountains-low');

            const sunRoom5 = model.getObjectByName('Sun');

            const textureLoader = new THREE.TextureLoader();
            const bakedTexture = textureLoader.load('/textures/stone-texture.png');
            const caveBodyTexture = textureLoader.load('/textures/Rock_BaseColor.png');
            const tableTexture = textureLoader.load('/textures/desk-texture.jpg');
            // const rockarmTexture = textureLoader.load('/textures/rock_face_03_arm_2k.jpg');
            // const rockdispTexture = textureLoader.load('/textures/rock_face_03_disp_2k.jpg');
            // const rocknormTexture = textureLoader.load('/textures/rock_face_03_nor_gl_2k.jpg');
            const stoneEntryTexture = textureLoader.load('/textures/cave-entry-baseColor.png');
            // const groundTexture = textureLoader.load('/textures/ground-texture.jpg');

            const leftWallTexture = textureLoader.load('/textures/wall_BaseColor.png');
            const rightWallTexture = textureLoader.load('/textures/wall_BaseColor.png');

            const backgroundMountainsTexture = textureLoader.load('/textures/background-mountain_BaseColor.png');

            // Set proper settings (optional but good)
            bakedTexture.flipY = false; // glTF uses a different Y-axis orientation
            bakedTexture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is in sRGB color space

            // caveBodyLightMap.flipY = false; // glTF uses a different Y-axis orientation
            // caveBodyLightMap.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is in sRGB color space

            tableTexture.flipY = false; // glTF uses a different Y-axis orientation
            tableTexture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is in sRGB color space

            // rockarmTexture.flipY = false;
            // rockarmTexture.colorSpace = THREE.SRGBColorSpace;
            // rockdispTexture.flipY = false;
            // rocknormTexture.flipY = false;

            // caveBodyBaseMap.flipY = false; // glTF uses a different Y-axis orientation
            // caveBodyBaseMap.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is
            // groundTexture.flipY = false; // glTF uses a different Y-axis orientation
            // groundTexture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is in s

            leftWallTexture.flipY = false; // glTF uses a different Y-axis orientation  
            leftWallTexture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is in sRGB color space

            rightWallTexture.flipY = false; // glTF uses a different Y-axis orientation
            rightWallTexture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is in

            caveBodyTexture.flipY = false; // glTF uses a different Y-axis orientation
            caveBodyTexture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is in

            stoneEntryTexture.flipY = false; // glTF uses a different Y-axis orientation    
            stoneEntryTexture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is in sRGB color space

            backgroundMountainsTexture.flipY = false; // glTF uses a different Y-axis orientation
            backgroundMountainsTexture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture is

            // Create a material using the baked texture
            const wallMaterial = new THREE.MeshLambertMaterial({
                map: bakedTexture
            });

            const tableMaterial = new THREE.MeshBasicMaterial({
                map: tableTexture,
            });

            const room5Material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0.3098, 0.3098, 0.3098),
                roughness: 1,
                metalness: 0,
            });

            const leftWallMaterial = new THREE.MeshBasicMaterial({
                map: leftWallTexture
            });

            const rightWallMaterial = new THREE.MeshBasicMaterial({
                map: rightWallTexture
            });

            const backgroundMountainsMaterial = new THREE.MeshBasicMaterial({
                map: backgroundMountainsTexture
            });

            // const caveBodyMaterial = new THREE.MeshLambertMaterial({
            //     map:caveBodyBaseMap
            // });
            //const caveBodyMaterial = new THREE.MeshStandardMaterial({color: new THREE.Color(0.3098, 0.3098, 0.3098)});

            // const caveBodyMaterial = new THREE.ShaderMaterial({
            //     uniforms: {
            //         baseMap: { value: bakedTexture },      // your stone texture
            //         lightMap: { value: caveBodyBaseMap }, // your baked light/shadow texture
            //     },
            //     vertexShader: `
            //       attribute vec2 uv1;

            //       varying vec2 vUv;
            //       varying vec2 vUvLight;

            //       void main() {
            //         vUv = uv;
            //         vUvLight = uv1;
            //         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            //       }
            //     `,
            //     fragmentShader: `
            //       uniform sampler2D baseMap;
            //       uniform sampler2D lightMap;

            //       varying vec2 vUv;
            //       varying vec2 vUvLight;

            //       void main() {
            //         //vec3 baseColor = texture2D(baseMap, vUv).rgb;
            //         vec3 baseColor = vec3(0.3098, 0.3098, 0.3098);
            //         vec3 lightColor = texture2D(lightMap, vUvLight).rgb;

            //         //gl_FragColor = vec4(0.3098, 0.3098, 0.3098, 1.0); // multiply base by light
            //         gl_FragColor = vec4(lightColor, 1.0);
            //       }
            //     `,
            // });

            const caveBodyMaterial = new THREE.MeshBasicMaterial({
                map: caveBodyTexture,
            })

            const stoneEntryMaterial = new THREE.MeshBasicMaterial({
                map: stoneEntryTexture,
            })

            // const newCavebodyMaterial = new THREE.MeshLambertMaterial({
            //     map: newCavebodyTexture
            // });

            // const groundMaterial = new THREE.MeshLambertMaterial({
            //     map: groundTexture
            // });
            if (rightWall && rightWall instanceof THREE.Mesh) {
                console.log('Right wall found:', rightWall);
                // Assign the new material
                rightWall.material = rightWallMaterial;
            } else {
                console.error('Right wall not found or is not a Mesh');
            }

            if (leftWall && leftWall instanceof THREE.Mesh) {
                console.log('Left wall found:', leftWall);
                // Assign the new material
                leftWall.material = leftWallMaterial;
                // leftWall.castShadow = true;
                // leftWall.receiveShadow = true;
            } else {
                console.error('Left wall not found or is not a Mesh');
            }

            if (stoneEntry && stoneEntry instanceof THREE.Mesh) {
                console.log('Stone Entry found:', stoneEntry);
                // Assign the new material
                stoneEntry.material = stoneEntryMaterial;
            } else {
                console.error('Stone entry not found or is not a Mesh');
            }

            if (backgroundMountains && backgroundMountains instanceof THREE.Mesh) {
                console.log('Background Mountains found:', backgroundMountains);
                // Assign the new material
                backgroundMountains.material = backgroundMountainsMaterial;
            } else {
                console.error('Background Mountains not found or is not a Mesh');
            }

            if (caveBody && caveBody instanceof THREE.Mesh) {
                console.log('Cave Body wall found:', caveBody.geometry.attributes);
                // Assign the new material
                caveBody.material = caveBodyMaterial;
            } else {
                console.error('Cave body not found or is not a Mesh');
            }

            // if( room5 && room5 instanceof THREE.Mesh) {
            //     console.log('Room 5 found:', room5);
            //     // Assign the new material
            //     room5.material = room5Material;
            //     room5.receiveShadow = true;
            // } else {
            //     console.error('Room 5 not found or is not a Mesh');
            // }

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
                    console.log(`${p.name} radius:`, radius);
                    // if (orbitGroups.length > 0 ) {
                    //     console.log("planet position: ",planet.position);
                    //     console.log("planet world position: ",planet.getWorldPosition(new THREE.Vector3()));
                    // }

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

            // if(newCavebody && newCavebody instanceof THREE.Mesh) {
            //     console.log('New Cave Body found:', newCavebody);
            //     // Assign the new material
            //     newCavebody.material = newCavebodyMaterial;
            // }
            // else {
            //     console.error('new Cave body not found or is not a Mesh');
            // }

            // if(ground && ground instanceof THREE.Mesh) {
            //     console.log('Ground found:', ground);
            //     // Assign the new material
            //     ground.material = groundMaterial;
            // } else {
            //     console.error('Ground not found or is not a Mesh');
            // }
        }, undefined, (error) => {
            console.error('An error happened while loading the model:', error);
        });
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(50, 50),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(0.474, 0.749, 0.349),
                side: THREE.FrontSide,
            })
        )
        plane.rotation.x = -Math.PI / 2;
        scene.add(plane);

        // Suns
        // SUN 1: warm yellow
        // if (!sun1.current) {
        //     const sun1Color = new THREE.Color("#E9E4C5");
        //     sun1.current = new THREE.DirectionalLight(sun1Color, 8.41);
        //     sun1.current.position.set(5, 0.15, 2);
        //     sun1.current.target.position.set(0, 0, -2);
        //     sun1.current.name = 'yellow sun';
        //     sun1.current.castShadow = true;
        //     scene.add(sun1.current);
        //     addSun(sun1.current)
        //     sun1.current.shadow.camera.left = -6;
        //     sun1.current.shadow.camera.right = 10;
        //     sun1.current.shadow.camera.top = 6;
        //     sun1.current.shadow.camera.bottom = -1;
        //     sun1.current.shadow.camera.near = 1;
        //     sun1.current.shadow.camera.far = 13;
        //     sun1.current.shadow.radius = 12; // try 4 to 10
        //     sun1.current.shadow.mapSize.set(4096 / 4, 4096 / 4); // higher = cleaner
        //     sun1.current.shadow.bias = -0.001; // helps reduce shadow acne
        //     // const sun1Helper = new THREE.DirectionalLightHelper(sun1.current, 2, 0xfff0c0);
        //     // scene.add(sun1Helper);
        //     // const sun1ShadowCameraHelper = new THREE.CameraHelper(sun1.current.shadow.camera);
        //     // scene.add(sun1ShadowCameraHelper);
        //     }
        // SUN 2: light blue
        // if (!sun2.current) {
        //     const sun2Color = new THREE.Color("#8FC6DC");
        //     sun2.current = new THREE.DirectionalLight(sun2Color, 4.13);
        //     sun2.current.position.set(-8.65, 6.81, 3.79,);
        //     sun2.current.name = 'blue sun';
        //     // sun2.current.castShadow = true;
        //     scene.add(sun2.current);
        //     addSun(sun2.current)
        //     const sun2Helper = new THREE.DirectionalLightHelper(sun2.current, 2, 'blue');
        //     scene.add(sun2Helper);
        // }

        // SUN 2: light blue
        // if (!sun4.current) {
        //     const sun4Color = new THREE.Color("#8FC6DC");
        //     sun4.current = new THREE.DirectionalLight(sun4Color, 3.14);
        //     sun4.current.position.set(8.65, 6.81, 3.79,);
        //     sun4.current.name = 'blue sun 2';
        //     // sun2.current.castShadow = true;
        //     scene.add(sun4.current);
        //     addSun(sun4.current)
        //     const sun4Helper = new THREE.DirectionalLightHelper(sun4.current, 2, 'blue');
        //     scene.add(sun4Helper);
        // }

        // SUN 3: green
        // if (!sun3.current) {
        //     const sun3Color = new THREE.Color("#BFF2ED");
        //     sun3.current = new THREE.DirectionalLight(sun3Color, 3.14);
        //     sun3.current.position.set(0, 5, 0);
        //     sun3.current.name = 'green sun';
        //     scene.add(sun3.current);
        //     addSun(sun3.current)
        //     const sun3Helper = new THREE.DirectionalLightHelper(sun3.current, 2, 'green');
        //     scene.add(sun3Helper);
        // }

        // const ambientLight = new THREE.AmbientLight("#AAC3DA", 0.5); // soft white light
        // scene.add(ambientLight);

        // const pointLight1 = new THREE.PointLight("#D6B575", 16, 50);
        // pointLight1.position.set(camera.position.x, 1.2, camera.position.z);
        // scene.add(pointLight1);


        //grass
        const grassTexture = new THREE.TextureLoader().load('/textures/greenTexture3.png');
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(1, 1);
        const uniforms = {
            time: { value: 0 },
            resolution: { value: new THREE.Vector2(1, 1) },
            grassWidth: { value: GRASS_WIDTH },
            grassHeight: { value: GRASS_HEIGHT },
            grassSegment: { value: GRASS_SEGMENT },
            grassVertices: { value: GRASS_VERTICES },
            grassPatchSize: { value: GRASS_PATCH_SIZE },
            grassTexture: { value: grassTexture },
        }
        const grassMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            side: THREE.DoubleSide,
            uniforms: uniforms,
        });
        materials.push(grassMaterial);

        const grassMesh = new THREE.Mesh(
            createGrassGeometry(GRASS_SEGMENT, NUM_GRASS),
            grassMaterial
        )
        grassMesh.position.set(0, 0, 0);
        scene.add(grassMesh);

        // //tree
        // function instanceFoliage(positions:THREE.Vector3[]) {
        //     const quadGeometry = new THREE.PlaneGeometry(1, 1); // basic leaf quad
        //     const material = new THREE.MeshBasicMaterial({ color: 'green', side: THREE.DoubleSide });
        //     const instancedMesh = new THREE.InstancedMesh(quadGeometry, material, positions.length);

        //     const dummy = new THREE.Object3D();

        //     positions.forEach((pos, i) => {
        //       dummy.position.copy(pos);
        //       dummy.lookAt(0, pos.y, 0); // optional: billboard-style orientation
        //       dummy.updateMatrix();
        //       instancedMesh.setMatrixAt(i, dummy.matrix);
        //     });

        //     scene.add(instancedMesh);
        //   }
        // function generateFoliageFromGeometry(geometry: THREE.BufferGeometry) {
        //     geometry.computeBoundingBox();
        //     geometry.computeVertexNormals();
        //     geometry = geometry.toNonIndexed(); // if indexed, convert to make face access easier

        //     const positions = geometry.attributes.position.array;
        //     const numFaces = positions.length / 9;

        //     const foliagePositions = [];

        //     for (let i = 0; i < numFaces; i++) {
        //       const i0 = i * 9;
        //       const a = new THREE.Vector3(positions[i0], positions[i0 + 1], positions[i0 + 2]);
        //       const b = new THREE.Vector3(positions[i0 + 3], positions[i0 + 4], positions[i0 + 5]);
        //       const c = new THREE.Vector3(positions[i0 + 6], positions[i0 + 7], positions[i0 + 8]);

        //       const center = new THREE.Vector3()
        //         .add(a)
        //         .add(b)
        //         .add(c)
        //         .divideScalar(3);

        //       foliagePositions.push(center);
        //     }

        //     instanceFoliage(foliagePositions);
        //   }
        // const loader = new GLTFLoader();
        // loader.load('/models/tree-canopy.glb', (gltf) => {
        //     const mesh = gltf.scene.children[0]; // assuming it's the first child
        //     if (mesh instanceof THREE.Mesh) {
        //         const geometry = mesh.geometry;
        //         generateFoliageFromGeometry(geometry);
        //     }
        // });
        // const treeUniforms = {
        //     time: { value: 0 },
        //     treeVertices: { value: LEAVE_VERTICES },
        //     treeSegment: { value: LEAVE_SEGMENT },
        //     treeWidth: { value: LEAVE_WIDTH },
        //     treeHeight: { value: LEAVE_HEIGHT },
        // }
        // const treeMaterial = new THREE.ShaderMaterial({
        //     vertexShader: treeVertexShader,
        //     fragmentShader: treeFragmentShader,
        //     side: THREE.FrontSide,
        //     uniforms: treeUniforms,
        // })
        // const treeMesh = new THREE.Mesh(
        //     createGrassGeometry(LEAVE_SEGMENT, NUM_LEAVES),
        //     treeMaterial
        // )
        // treeMesh.position.set(-5, 0, 0);
        // scene.add(treeMesh);



        const renderer = new THREE.WebGLRenderer({ antialias: true });
        // renderer.shadowMap.enabled = true;
        // renderer.shadowMap.type = THREE.PCFSoftShadowMap; // (Optional: smoother shadows)
        renderer.setSize(
            canvasRef.current.clientWidth,
            canvasRef.current.clientHeight
        );
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        canvasRef.current.appendChild(renderer.domElement);

        // Set the background color
        renderer.setClearColor(new THREE.Color("#62aef0"), 1);

        const handleResize = () => {
            const width = canvasRef.current?.clientWidth ?? window.innerWidth;
            const height = canvasRef.current?.clientHeight ?? window.innerHeight;
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            for (const material of materials) {
                if (material instanceof THREE.ShaderMaterial) {
                    material.uniforms.resolution.value.set(width, height);
                }
            }
        };
        window.addEventListener("resize", handleResize);
        document.addEventListener("fullscreenchange", handleFullScreenChange);

        // const control = new PointerLockControls(camera, renderer.domElement);
        // scene.add(control.object);
        // document.addEventListener('click', () => {
        //     control.lock();
        // });

        // //control logic
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

        const debugControl = new OrbitControls(camera, renderer.domElement);
        debugControl.enableDamping = true;
        debugControl.enabled = true;

        // let debugMode = false;
        // document.addEventListener('keypress', (event) => {
        //     if (event.key === 'g') {
        //         debugMode = !debugMode;
        //         debugControl.enabled = debugMode;
        //         control.enabled = !debugMode;
        //         if (debugMode) {
        //             control.unlock();
        //         } else {
        //             control.lock();
        //         }
        //     }
        // });

        const timer = new Timer();

        const animate = () => {
            requestAnimationFrame(animate);
            timer.update();

            if (debugControl.enabled) {
                debugControl.update();
              }

            //update uniforms
            for (const material of materials) {
                if (material instanceof THREE.ShaderMaterial) {
                    material.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
                    material.uniforms.time.value = timer.getElapsed();
                }
            }

            //update control
            // if (control.isLocked) {
            //     direction.z = Number(move.forward) - Number(move.backward);
            //     direction.x = Number(move.right) - Number(move.left);
            //     direction.normalize();

            //     const speed = 0.03 * (move.run ? 2 : 1); // Optional: add running speed
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
                //o.planet.position.x += 0.01;
                // console.log(o.planet.position);
                // console.log(o.planet.getWorldPosition(new THREE.Vector3()));
                //console.log(sunRoom5WorldPosition)
                o.planet.position.x = sunRoom5WorldPosition.x + Math.cos(o.speed * timer.getElapsed()) * o.radius;
                o.planet.position.z = sunRoom5WorldPosition.z + Math.sin(o.speed * timer.getElapsed()) * o.radius;
                o.planet.rotation.y += o.spinRate * timer.getDelta(); // Rotate the planet
                // o.planet.position.z = o.planet.position.z +  0.1;
                //o.planet.position.y = 0.5; // keep the planet at a
            });

            //light follow the camera
            //pointLight1.position.set(camera.position.x, 1.2, camera.position.z);

            //control.update();
            renderer.render(scene, camera);
        };
        animate();
    }, [scene]);

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

    return (
        <div ref={canvasRef} className="relative w-full h-[calc(100vh-64px)]">
            <MyGui lights={suns}></MyGui>
            <button
                className="absolute top-4 right-4 bg-blue-500 text-white py-2 px-4 rounded shadow-lg"
                onClick={handleFullScreen}
            >
                {getFullScreenText()}
            </button>
        </div>
    );
}
