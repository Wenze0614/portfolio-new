"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
    GLTFLoader,
    Timer,
} from "three/examples/jsm/Addons.js";
import { setupThreeCore } from "./core/threeCore";
import { makeControlsSystem } from "./systems/makeControlSystem";
import makeGUISystem from "./systems/makeGUISystem";
import makeLightSystem from "./systems/makeLightSystem";
import { makeStats } from "./utils/makeStats";
import makeTerrainSystem from "./systems/makeTerrainSystem";
import { makeSkySystem } from "./systems/makeSkySystem";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import test from "node:test";
import makeTreeSystem from "./systems/treeSystems/makeTreeSystem";
import makeFoliageSystem from "./systems/treeSystems/makeFoliageSystem";
import makePostEffectSystem from "./systems/makePostEffectSystem";
import makeTreeCardsSystem from "./systems/makeTreeCardsSystem";
import makeEnvSystem from "./systems/makeEnvSystem";
import makeFogSystem from "./systems/makeFogSystem";
import modifyShader from "./utils/modifyShader";
import makePianoSystem from "./systems/makePianoSystem";


export default function Page() {
    const canvasRef = useRef<HTMLDivElement>(null);
    const scene = useMemo(() => new THREE.Scene(), []);
    const materials: THREE.Material[] = useMemo(() => [], []);
    const gltfLoader = useMemo(() => new GLTFLoader(), []);
    const grassClumpsGeo = useRef<THREE.Mesh>(null);


    // const planets = [
    //     { name: "Mercury", speed: 0.2, spinRate: 0.027, },
    //     { name: "Venus", speed: 0.15, spinRate: -0.007 }, // retrograde
    //     { name: "Earth", speed: 0.1, spinRate: 1.6 * 0.5 },
    //     { name: "Mars", speed: 0.08, spinRate: 1.5 * 0.5 },
    //     { name: "Jupiter", speed: 0.05, spinRate: 3.86 * 0.25 },
    //     { name: "Saturn", speed: 0.04, spinRate: 3.6 * 0.25 },
    //     { name: "Uranus", speed: 0.03, spinRate: -2.2 * 0.5 }, // retrograde
    //     { name: "Neptune", speed: 0.02, spinRate: 2.4 * 0.5 },
    // ];
    // const sunRoom5WorldPosition = new THREE.Vector3();

    const orbitGroups: { planet: THREE.Object3D, radius: number, speed: number, spinRate: number }[] = [];




    useEffect(() => {
        if (!canvasRef.current) return;

        //initialize core ThreeJS components
        const ctx = setupThreeCore(canvasRef.current, { background: "#62aef0" });
        const { scene, camera, renderer, clock, state, loaders, disposeCore } = ctx;

        makeFogSystem(ctx);
        scene.fog = new THREE.FogExp2(0xDFE9F3, 0.00341);

        // #region Core Setup
        //setup systems
        const guiSystem = makeGUISystem(ctx);
        guiSystem.init(ctx);

        const controlSystem = makeControlsSystem(ctx);
        controlSystem.init(ctx);
        guiSystem.toggleControl(ctx, controlSystem.switchControl);

        const lightSystem = makeLightSystem(ctx);
        lightSystem.init(ctx);
        guiSystem.updateLights(lightSystem.getLights());

        const handleFullScreen = () => {
            if (document.fullscreenElement === renderer.domElement) {
                document.exitFullscreen();
            } else {
                renderer.domElement.requestFullscreen();
            }
        };
        window.addEventListener('keydown', (key) => {
            if (key.key === 'f') {
                handleFullScreen()
            }
        })

        const stats = makeStats(renderer.domElement.parentElement ?? document.body);
        // #endregion

        const terrainSystem = makeTerrainSystem(ctx);
        terrainSystem.init(ctx);



        const skySystem = makeSkySystem(ctx);

        const meshs: THREE.Mesh[] = [];
        const treeSystem = makeTreeSystem(ctx);
        treeSystem.init(ctx);

        //add tree cards for background
        const treeCardSystem = makeTreeCardsSystem(ctx);
        treeCardSystem.init(ctx);

        //const foliageSystem = makeFoliageSystem(ctx);
        //const foliageMesh = foliageSystem.getFoliage();
        //foliageMesh.name = "foliage mesh";
        //meshs.push(foliageMesh);

        const testCubeMat = new THREE.MeshToonMaterial({ color: 'white' });
        // testCubeMat.onBeforeCompile = (shader) => {
        //     modifyShader(shader);
        // }
        const testCube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            testCubeMat
        );
        testCube.position.set(-5, 2, 5);
        testCube.castShadow = true;
        scene.add(testCube);
        testCube.name = "test cube";
        meshs.push(testCube);


        const pokeballTexture = ctx.loaders.texture.load('/textures/pokeball_BaseColor.png');
        pokeballTexture.flipY = false;
        pokeballTexture.colorSpace = THREE.SRGBColorSpace;
        ctx.loaders.gltf.load('/models/pokeball.glb', (gltf) => {
            const model = gltf.scene;
            const pokeball = model.getObjectByName('pokeball-low');
            if (pokeball && pokeball instanceof THREE.Mesh) {
                pokeball.scale.set(2, 2, 2);
                pokeball.position.set(5, 2, -5);
                pokeball.castShadow = true;
                const pokeballMat = new THREE.MeshBasicMaterial({
                    map: pokeballTexture,
                });
                // pokeballMat.onBeforeCompile = (shader) => {
                //     modifyShader(shader);
                // }
                pokeball.material = pokeballMat;
                pokeball.name = "pokeball";
                scene.add(pokeball);
                meshs.push(pokeball);
                guiSystem.updateMeshes(meshs);
            }
        });
        let myMixer: THREE.AnimationMixer;

        ctx.loaders.gltf.load('/models/archie.glb', (gltf) => {
            console.log("archie gltf: ", gltf);
            const model = gltf.scene;
            model.scale.set(0.02, 0.02, 0.02);
            model.position.set(0, 0.2, 0);
            scene.add(model);
            const archie = model.getObjectByName('archie');
            const archieTexture = ctx.loaders.texture.load('/textures/maya_baseColor.png');
            archieTexture.flipY = false;
            archieTexture.colorSpace = THREE.SRGBColorSpace;
            if (archie && archie instanceof THREE.Mesh) {
                archie.material = new THREE.MeshBasicMaterial({
                    map: archieTexture,
                });
                // ctx.scene.add(archie);
                // archie.position.set(0, 0.2, 0);
            }
            const mixer = new THREE.AnimationMixer(model);
                const clips = gltf.animations;

                // pick the first animation (or by name)
                const idle = THREE.AnimationClip.findByName(clips, 'Idle');
                if(idle){
                    const action = mixer.clipAction(idle);
                    action.reset().play();
                }else{
                    console.warn("Idle animation not found on archie");
                }
                // store mixer for update loop
                myMixer = mixer;
        })

        // ctx.loaders.gltf.load('/models/room.glb', (gltf) => {
        //     const model = gltf.scene;
        //     console.log("room gltf: ", gltf);
        //     const room = model.getObjectByName('room');
        //     const roomTexture = ctx.loaders.texture.load('/textures/room.jpg');
        //     roomTexture.flipY = false;
        //     roomTexture.colorSpace = THREE.SRGBColorSpace;
        //     if (room && room instanceof THREE.Mesh) {
        //         room.material = new THREE.MeshBasicMaterial({
        //             map: roomTexture,
        //         })
        //         room.scale.set(3, 3, 3);
        //         // scene.add(room);
        //     } else {
        //         console.error("room not found in room.glb");
        //     }

        // })
        makePianoSystem(ctx).init(meshs, guiSystem);

        makeEnvSystem(ctx).init(meshs, guiSystem);


        const commposer = makePostEffectSystem().init(ctx);


        const timer = new Timer();
        let angle = 0.0;
        const animate = () => {
            requestAnimationFrame(animate);
            stats.begin();
            timer.update();
            controlSystem.update(ctx);
            lightSystem.update(ctx);
            testCube.rotation.y += 0.01;
            testCube.rotation.x += 0.005;
            // angle += 0.01; // rotation speed
            terrainSystem.update(ctx, timer.getElapsed());
            skySystem.update(ctx, timer.getElapsed());

            //update uniforms
            // for (const material of materials) {
            //     if (material instanceof THREE.ShaderMaterial) {
            //         material.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
            //         material.uniforms.time.value = timer.getElapsed();
            //     }
            // }

            // orbitGroups.forEach(o => {
            //     o.planet.position.x = sunRoom5WorldPosition.x + Math.cos(o.speed * timer.getElapsed()) * o.radius;
            //     o.planet.position.z = sunRoom5WorldPosition.z + Math.sin(o.speed * timer.getElapsed()) * o.radius;
            //     o.planet.rotation.y += o.spinRate * timer.getDelta(); // Rotate the planet
            // });
            // scene.traverse(o => {
            //     if (o instanceof THREE.Mesh) {
            //         const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
            //         for (const m of mats) {
            //             const sh = m?.userData?.shader;
            //             if (sh?.uniforms?.fogTime) sh.uniforms.fogTime.value = performance.now() * 0.001;
            //         }
            //     }
            // })

            treeSystem.update(ctx, timer.getElapsed());
            treeCardSystem.update(timer.getElapsed());

            if (myMixer) myMixer.update(timer.getDelta());


            renderer.render(scene, camera);
            //commposer.render();
            stats.end();
        };
        animate();
    }, [scene]);

    return (
        <div ref={canvasRef} className="relative w-full h-[calc(100vh-64px)]">
        </div>
    );
}
