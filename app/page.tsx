"use client";

import { RefObject, useEffect, useMemo, useRef, useState } from "react";
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
import makeTerrainSystem from "./systems/terrainSystems/makeTerrainSystem";
import { makeSkySystem } from "./systems/makeSkySystem";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import makeTreeSystem, { TreeSystem } from "./systems/treeSystems/makeTreeSystem";
import makeFoliageSystem from "./systems/treeSystems/makeFoliageSystem";
import makePostEffectSystem, { ComposerSystem } from "./systems/makePostEffectSystem";
import makeTreeCardsSystem, { TreeCardsSystem } from "./systems/makeTreeCardsSystem";
import makeEnvSystem from "./systems/terrainSystems/makeEnvSystem";
import makeFogSystem from "./systems/makeFogSystem";
import modifyShader from "./utils/modifyShader";
import makeInteractiveSystem, { InteractiveSystem } from "./systems/interactiveSystem/makeInteractiveSystem";
import makeAudioSystem, { AudioSystem } from "./systems/makeAudioSystem";
import { ControlSystem, GUISystem, LightSystem, System, TEXTURE_NAME } from "./core/types";
import makeSignSystem from "./systems/makeSignSystem";
import makeTextureLoaderSys from "./systems/makeTextureLoaderSys";
import { makeLoadingSystem } from "./systems/makeLoadingSystem";


export default function Page() {
    const canvasRef = useRef<HTMLDivElement>(null);
    const scene = useMemo(() => new THREE.Scene(), []);
    const materials: THREE.Material[] = useMemo(() => [], []);
    const gltfLoader = useMemo(() => new GLTFLoader(), []);
    const grassClumpsGeo = useRef<THREE.Mesh>(null);
    const fogSysRef = useRef<any>(null);
    const guiSysRef = useRef<GUISystem>(null);
    const audioSysRef = useRef<AudioSystem>(null);
    const controlSysRef = useRef<ControlSystem>(null);
    const composerSysRef = useRef<ComposerSystem>(null);
    const lightSysRef = useRef<LightSystem>(null);
    const treeSysRef = useRef<TreeSystem>(null);
    const interactiveSysRef = useRef<InteractiveSystem>(null);
    const terrainSysRef = useRef<System>(null);
    const treeCardSysRef = useRef<TreeCardsSystem>(null);
    const skySysRef = useRef<System>(null);
    const signSysRef = useRef<System>(null);
    const [promptText, setPromptText] = useState<string>("");
    // const loadingSysRef = useRef<System>(null);



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


    // const _origLoad = FileLoader.prototype.load;
    // FileLoader.prototype.load = function (url, ...rest) {
    //     if (typeof url === 'string' && url.startsWith('blob:')) {
    //         console.warn('[Three] FileLoader got blob URL:', url, this);
    //     }
    //     return _origLoad.call(this, url, ...rest);
    // };




    useEffect(() => {
        if (!canvasRef.current) return;

        //initialize core ThreeJS components
        const ctx = setupThreeCore(canvasRef.current, { background: "#62aef0" });
        const { scene, camera, listener, renderer, composers, clock, state, loaders, disposeCore } = ctx;
        //need to initialize fog system first to embed fog uniforms into threejs material uniforms

        // dev only
        //const stats = makeStats(renderer.domElement.parentElement ?? document.body);
        const meshs: THREE.Mesh[] = [];
        let myMixer: THREE.AnimationMixer;

        const raycaster = new THREE.Raycaster();
        const center = new THREE.Vector2(0, 0); // screen center in NDC
        const promptEl = document.getElementById("interactPrompt");
        let currentTarget: THREE.Object3D | null = null;

        function updateInteraction(cam: THREE.Camera, interactables: THREE.Mesh[]) {
            // console.log("updating interaction", interactables);
            raycaster.setFromCamera(center, cam);

            // Optional: limit how far you can interact
            raycaster.far = 3; // 3 units (meters)

            const hits = raycaster.intersectObjects(interactables, true);

            if (hits.length > 0) {
                console.log("hits: ", hits[0].object.userData.interactUrl);
                // If logos have children, grab the top-level interactable
                const hitObj = hits[0].object;
                currentTarget = hitObj.userData.interactUrl || hitObj.userData.playMusic ? hitObj : hitObj.parent as THREE.Object3D;

                const label = currentTarget.userData.interactLabel ?? "Interact";
                if (promptEl) {
                    promptEl.style.opacity = "1";
                    setPromptText(`Press E to ${label}`);
                    //promptEl.textContent = `Press E to ${label}`;
                }


            } else {
                currentTarget = null;
                if (promptEl) {
                    promptEl.style.opacity = "0";
                    setPromptText("");
                };
            }
        }

        window.addEventListener("keydown", (e) => {
            if (e.key.toLowerCase() !== "e") return;
            if (!currentTarget) return;

            // Important: works best if it's a direct user gesture (keydown is fine)
            if(currentTarget.userData.interactUrl) {
                window.open(currentTarget.userData.interactUrl, "_blank", "noopener,noreferrer");
            }

            if(currentTarget.userData.playMusic) {
                currentTarget.userData.rotation = true;
                audioSysRef.current?.playPiano();
            }

        });
        const interactables: THREE.Mesh[] = [];
        // #endregion
        (async () => {
            // const loadingSystem = makeLoadingSystem(ctx);
            // loadingSystem.init(ctx);
            // loadingSysRef.current = loadingSystem;

            await makeTextureLoaderSys(ctx);
            makeFogSystem(ctx);
            scene.fog = new THREE.FogExp2(0xDFE9F3, 0.00341);

            const composerSys = makePostEffectSystem(ctx);
            composerSysRef.current = composerSys;
            // const composer = composerSys.init();

            // #region Core Setup
            //setup systems

            // dev only
            // const guiSystem = makeGUISystem(ctx);
            // guiSystem.init(ctx);
            // guiSysRef.current = guiSystem;

            const audioSys = makeAudioSystem(ctx);
            await audioSys.init();
            audioSysRef.current = audioSys;

            const controlSystem = makeControlsSystem(ctx, audioSys);
            controlSystem.init(ctx);
            //guiSystem.toggleControl(ctx, controlSystem.switchControl);
            controlSysRef.current = controlSystem;


            const lightSystem = makeLightSystem(ctx);
            lightSystem.init(ctx);
            //guiSystem.updateLights(lightSystem.getLights());
            lightSysRef.current = lightSystem;

            const interactiveSystem = makeInteractiveSystem(ctx, audioSys, controlSystem);
            await interactiveSystem.init(meshs);
            interactiveSysRef.current = interactiveSystem;
            interactiveSystem.getInteractables().map((mesh) => interactables.push(mesh));
            console.log("interactables: ", interactables);


            // makeEnvSystem(ctx).init(meshs, guiSystem);

            const terrainSystem = makeTerrainSystem(ctx);
            terrainSystem.init(ctx);
            terrainSysRef.current = terrainSystem;



            const skySystem = makeSkySystem(ctx);
            skySysRef.current = skySystem;


            const treeSystem = makeTreeSystem(ctx);
            treeSystem.init(ctx);
            treeSysRef.current = treeSystem;

            //add tree cards for background
            // const treeCardSystem = makeTreeCardsSystem(ctx);
            // treeCardSystem.init(ctx);
            // treeCardSysRef.current = treeCardSystem;

            signSysRef.current = makeSignSystem(ctx);

            // const testCubeMat = new THREE.MeshToonMaterial({ color: 'white' });
            // // testCubeMat.onBeforeCompile = (shader) => {
            // //     modifyShader(shader);
            // // }
            // const testCube = new THREE.Mesh(
            //     new THREE.BoxGeometry(1, 1, 1),
            //     testCubeMat
            // );
            // testCube.position.set(-5, 2, 5);
            // testCube.castShadow = true;
            // scene.add(testCube);
            // testCube.name = "test cube";
            // meshs.push(testCube);

            // ctx.loaders.gltf.load('/models/archie.glb', async (gltf) => {
            //     const model = gltf.scene;
            //     model.scale.set(0.02, 0.02, 0.02);
            //     model.position.set(0, 0.2, 0);
            //     scene.add(model);
            //     const archie = model.getObjectByName('archie');
            //     const archieTexture = ctx.state.getTexture(TEXTURE_NAME.ARCHIE_TEXTURE);

            //     if (archie && archie instanceof THREE.Mesh) {
            //         archie.material = new THREE.MeshBasicMaterial({
            //             map: archieTexture,
            //         });
            //         // ctx.scene.add(archie);
            //         // archie.position.set(0, 0.2, 0);
            //     }
            //     const mixer = new THREE.AnimationMixer(model);
            //     const clips = gltf.animations;

            //     // pick the first animation (or by name)
            //     const idle = THREE.AnimationClip.findByName(clips, 'Idle');
            //     if (idle) {
            //         const action = mixer.clipAction(idle);
            //         action.reset().play();
            //     } else {
            //         console.warn("Idle animation not found on archie");
            //     }
            //     // store mixer for update loop
            //     myMixer = mixer;
            // })

        })()


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


        const timer = new Timer();
        let angle = 0.0;
        const updateSys = (ref: RefObject<any>) => {
            if (ref.current && ref.current.update) {
                ref.current.update(timer.getElapsed());
            }
        }
        const animate = () => {
            requestAnimationFrame(animate);
            //console.log("interactables",interactables)
            // stats.begin();
            timer.update();
            updateSys(controlSysRef);
            updateSys(lightSysRef);
            updateSys(terrainSysRef);
            updateSys(skySysRef);
            updateSys(lightSysRef);
            updateSys(treeSysRef);
            // updateSys(treeCardSysRef);
            updateSys(interactiveSysRef);
            updateSys(composerSysRef);
            updateSys(signSysRef);
            updateInteraction(camera, interactables);
            // updateSys(loadingSysRef);
            // controlSysRef.current.update(ctx, timer.getElapsed());
            // lightSysRef.current.update(ctx, timer.getElapsed());
            // testCube.rotation.y += 0.01;
            // testCube.rotation.x += 0.005;
            // angle += 0.01; // rotation speed
            // lightSysRef.current.update(ctx, timer.getElapsed());
            // terrainSysRef.current.update(ctx, timer.getElapsed());
            // skySysRef.current.update(ctx, timer.getElapsed());

            // treeSysRef.current.update(ctx, timer.getElapsed());
            //treeCardSysRef.current.update(timer.getElapsed());
            //interactiveSysRef.current.update(timer.getElapsed());

            //if (myMixer) myMixer.update(timer.getDelta());


            // renderer.render(scene, camera);
            //composerSysRef.current.update(ctx, timer.getElapsed());
            // stats.end();
        };
        animate();
    }, [scene]);

    return (
        <>
            <div
                id="interactPrompt"
                style={{
                    position: "fixed",
                    left: "50%",
                    top: "55%",
                    transform: "translate(-50%, -50%)",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    background: "rgba(0,0,0,.5)",
                    color: "white",
                    fontFamily: "sans-serif",
                    pointerEvents: "none",
                    zIndex: 9999,
                    opacity: 0,          // start hidden
                    transition: "opacity .1s ease",
                }}
            >{promptText}</div>
            <div ref={canvasRef} className="relative w-full h-[calc(100vh-64px)]">
            </div>

        </>
    );
}
