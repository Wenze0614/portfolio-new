import { GUISystem, SceneContext, ScreenSystem, System, TEXTURE_NAME, VIDEOTEXTURE_NAME } from "../../core/types";
import * as THREE from "three";
import vertexShader from '../../shaders/pianoShaders/vertex.vert';
import fragmentShader from '../../shaders/pianoShaders/fragment.frag';
import { AudioSystem } from "../makeAudioSystem";
import makeFloatingScreenSystem from "./makeFloatingScreenSystem";
import barVertexShader from '../../shaders/barShaders/vertex.vert';
import barFragmentShader from '../../shaders/barShaders/fragment.frag';
import glassVertexShader from '../../shaders/glassShaders/vertex.vert';
import glassFragmentShader from '../../shaders/glassShaders/fragment.frag';
import screenVertexShader from '../../shaders/screenShaders/vertex.vert';
import screenFragmentShader from '../../shaders/screenShaders/fragment.frag';
import { utimes } from "fs";


export default function makeMusicBar(ctx: SceneContext, audioSys: AudioSystem): System {
    const pianoTexture = ctx.state.getTexture(TEXTURE_NAME.PIANO_TEXTURE);

    const barTexture = ctx.state.getTexture(TEXTURE_NAME.BAR_TEXTURE);
    const starTexture = ctx.state.getTexture(TEXTURE_NAME.STAR_TEXTURE);

    const customUniforms = {
        pianoTexture: { value: pianoTexture },
    }

    const customBarUniforms = {
        barTexture: { value: barTexture },
        starTexture: { value: starTexture },
        uTime: { value: 0 },
        // toonMatcap: { value: toonMatcap },
    }

    const customGlassUniforms = {
        uTime: { value: 0 },
    }

    const customScreenUniforms = {
        barTexture: { value: barTexture },
        uTime: { value: 0 },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
    }
    const baseUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.lambert.uniforms);
    const pianoUniforms = THREE.UniformsUtils.merge([baseUniforms, customUniforms]);
    const barUniforms = THREE.UniformsUtils.merge([baseUniforms, customBarUniforms]);
    const glassUniforms = THREE.UniformsUtils.merge([baseUniforms, customGlassUniforms]);
    const screenUniforms = THREE.UniformsUtils.merge([baseUniforms, customScreenUniforms]);
    let screenSys: ScreenSystem;


    return {
        init(ctx: SceneContext, meshs: THREE.Mesh[], guiSystem: GUISystem, opts: { position: THREE.Vector3 }) {

            ctx.loaders.gltf.load("/models/bar.glb", (gltf) => {
                const model = gltf.scene;
                ctx.scene.add(model);
                model.rotateY(-Math.PI / 4);
                model.position.copy(opts.position);
                // model.scale.set(1.5, 1, 1.5);
                // model.position.copy(piano.position);
                const bar = model.getObjectByName("bar");
                const neon1 = model.getObjectByName("neon1");
                const neon2 = model.getObjectByName("neon2");
                const neon3 = model.getObjectByName("neon-logo");
                const piano = model.getObjectByName("piano");
                const barScreen = model.getObjectByName("barScreen");
                const glass = model.getObjectByName("glass");
                console.log("piano model: ", piano);
                const neonMaterial1 = new THREE.MeshBasicMaterial({ color: "#ecc5ed" });
                // const neonMaterial2 = new THREE.MeshBasicMaterial({ color: "#E7D8B1" });
                if (neon1 && neon1 instanceof THREE.Mesh) {
                    // ctx.scene.add(neon1);
                    neon1.material = neonMaterial1;
                    neon1.layers.enable(ctx.state.postEffectState.bloom.layer);
                }
                if (neon2 && neon2 instanceof THREE.Mesh) {
                    // ctx.scene.add(neon2);
                    neon2.material = neonMaterial1;
                    neon2.layers.enable(ctx.state.postEffectState.bloom.layer);
                }
                if (neon3 && neon3 instanceof THREE.Mesh) {
                    neon3.material = neonMaterial1;
                    neon3.layers.enable(ctx.state.postEffectState.bloom.layer);
                    screenUniforms.lightPosition.value = neon3.getWorldPosition(new THREE.Vector3());
                }

                if (bar && bar instanceof THREE.Mesh) {
                    bar.material = new THREE.ShaderMaterial({
                        uniforms: barUniforms,
                        vertexShader: barVertexShader,
                        fragmentShader: barFragmentShader,
                        lights: true,
                        // transparent: true,
                        // depthWrite: false,
                        // blending: THREE.AdditiveBlending,
                    })
                    bar.layers.enable(ctx.state.postEffectState.bloom.layer);
                    // bar.castShadow = true;
                    // bar.receiveShadow = true;
                }

                if (piano && piano instanceof THREE.Mesh) {
                    piano.material = new THREE.MeshBasicMaterial({ map: pianoTexture });
                    piano.material.needsUpdate = true;
                }

                if (barScreen && barScreen instanceof THREE.Mesh) {
                    barScreen.material = new THREE.ShaderMaterial({
                        vertexShader: screenVertexShader,
                        fragmentShader: screenFragmentShader,
                        uniforms: screenUniforms
                    })
                    barScreen.material.needsUpdate = true;
                }

                if( glass && glass instanceof THREE.Mesh) {
                    glass.material = new THREE.ShaderMaterial({
                        uniforms: glassUniforms,
                        vertexShader: glassVertexShader,
                        fragmentShader: glassFragmentShader,
                        lights: true,
                        transparent: true,
                        depthWrite: false,
                        blending: THREE.AdditiveBlending,
                        side: THREE.DoubleSide,
                    })
                    //glass.layers.enable(ctx.state.postEffectState.bloom.layer);
                }

                // if (piano && piano instanceof THREE.Mesh) {
                //     piano.material = new THREE.ShaderMaterial({
                //         uniforms: pianoUniforms,
                //         vertexShader,
                //         fragmentShader,
                //         // lights: true,
                //     })
                //     // piano.material = new THREE.MeshBasicMaterial({
                //     //     map: pianoTexture,
                //     // })
                //     // piano.castShadow = true;
                //     // piano.receiveShadow = true;
                //     // piano.scale.set(1.2, 1.2, 1.2);
                //     // piano.rotation.y = -Math.PI / 2;
                //     // piano.layers.enable(ctx.state.postEffectState.bloom.layer);
                //     // piano.castShadow = true;
                //     // piano.receiveShadow = true;
                //     // ctx.scene.add(piano);
                //     meshs.push(piano);
                //     audioSys.playPiano("lune", piano);
                //     // screenSys = makeFloatingScreenSystem(ctx);
                //     // screenSys.setPosition(piano.position.clone());

                // } else {
                //     console.error("piano not found in piano.glb");
                // }
                guiSystem.updateMeshes(meshs);
            })

        },
        update(dt: number) {
            barUniforms.uTime.value = dt;
            screenUniforms.uTime.value = dt;
            // if (screenSys) {
            //     screenSys.update(dt);
            // }
        },
        dispose() { }
    }
}