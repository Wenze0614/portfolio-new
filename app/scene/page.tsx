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
        // const treeSystem = makeTreeSystem(ctx);
        // treeSystem.init(ctx);
        const foliageSystem = makeFoliageSystem(ctx);
        const foliageMesh = foliageSystem.getFoliage();
        foliageMesh.name = "foliage mesh";
        meshs.push(foliageMesh);

        const testCube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshToonMaterial({ color: 'white'})
        );
        testCube.position.set(-5, 2, 5);
        testCube.castShadow = true;
        scene.add(testCube);
        testCube.name = "test cube";
        meshs.push(testCube);

        guiSystem.updateMeshes(meshs);

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

        const rampTree = makeToonRamp([
            { color: '#1c2e1d', width: 1 }, // dark/shadow color
            { color: "#2f5932", width: 1 },
            { color: '#3a9140', width: 10 }, // midtone
            { color: '#6cd974', width: 1 }, // light
        ]);

        //#region Load Textures

        //#endregion

        //#region Set Texuture Properties

        //#endregion

        //#region Create a material using the baked texture



        const grassMaterial = new THREE.MeshToonMaterial({
            color: new THREE.Color(0.474, 0.749, 0.349),
            side: THREE.DoubleSide,
        });


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

            renderer.render(scene, camera);
            stats.end();
        };
        animate();
    }, [scene]);

    return (
        <div ref={canvasRef} className="relative w-full h-[calc(100vh-64px)]">
        </div>
    );
}
