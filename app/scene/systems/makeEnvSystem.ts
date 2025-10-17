import { GUISystem, SceneContext } from "../core/types";
import * as THREE from "three";

export default function makeEnvSystem(ctx: SceneContext) {

    return {
        init(meshs:THREE.Mesh[], guiSystem: GUISystem) {
            const envTexture = ctx.loaders.texture.load('/textures/greenTexture3.png');
            const envTerrainTexture = ctx.loaders.texture.load('/textures/stone-texture.png');

            // ctx.loaders.gltf.load('/models/env.glb', (gltf) => {
            //     const model = gltf.scene;
            //     const env = model.getObjectByName('env');
            //     const envTerrain = model.getObjectByName('envTerrain');
            //     // const envMaterial = new THREE.ShaderMaterial({
            //     //     uniforms:{
            //     //         envTexture: { value: envTexture },
            //     //         fogColor: {value: ctx.state.fogState.fogColor}
            //     //     },
            //     //     vertexShader: `
            //     //     varying vec2 vUv;
            //     //     varying vec3 vPosWS;
            //     //     void main() {
            //     //         vUv = uv;
            //     //         vPosWS = (modelMatrix * vec4(position, 1.0)).xyz;
            //     //         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            //     //     }
            //     //     `,
            //     //     fragmentShader: `
            //     //     uniform sampler2D envTexture;
            //     //     uniform vec3 fogColor;

            //     //     varying vec2 vUv;
            //     //     varying vec3 vPosWS;

            //     //     float innerRadius = 100.0;
            //     //     float outerRadius = 600.0;
            //     //     float heightFactor = 0.05;

            //     //     void main() {
            //     //         vec3 color = texture2D(envTexture, vUv).rgb;

            //     //         //add fog
            //     //         vec3 dVec = vPosWS-vec3(0.0);
            //     //         float dist = length(dVec.xz);
            //     //         float fogFactor = heightFactor
            //     //             * exp(-vPosWS.y * 0.8)
            //     //             * (1.0 - exp(-dist * dVec.y * 0.8) / dVec.y);
            //     //         color = mix(color, fogColor, fogFactor);
            //     //         gl_FragColor = vec4(color, 1.0);
            //     //     }
            //     //     `,
            //     // })

            //     // const envTerrainMaterial = new THREE.ShaderMaterial({
            //     //     uniforms:{
            //     //         envTerrainTexture: { value: envTerrainTexture },
            //     //         fogColor: {value: ctx.state.fogState.fogColor}
            //     //     },
            //     //     vertexShader: `
            //     //     varying vec2 vUv;
            //     //     varying vec3 vPosWS;
            //     //     void main() {
            //     //         vUv = uv;
            //     //         vPosWS = (modelMatrix * vec4(position, 1.0)).xyz;
            //     //         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            //     //     }
            //     //     `,
            //     //     fragmentShader: `
            //     //     uniform sampler2D envTerrainTexture;
            //     //     uniform vec3 fogColor;

            //     //     varying vec2 vUv;
            //     //     varying vec3 vPosWS;

            //     //     float innerRadius = 300.0;
            //     //     float outerRadius = 600.0;
            //     //     float heightFactor = 0.05;

            //     //     void main() {
            //     //         vec3 color = texture2D(envTerrainTexture, vUv).rgb;

            //     //         //add fog
            //     //         vec3 dVec = vPosWS-vec3(0.0);
            //     //         float dist = length(dVec.xz);
            //     //         float fogFactor = heightFactor
            //     //             * exp(-vPosWS.y * 0.8)
            //     //             * (1.0 - exp(-dist * dVec.y * 0.8) / dVec.y);
            //     //         color = mix(color, fogColor, fogFactor);
            //     //         gl_FragColor = vec4(color, 1.0);
            //     //     }
            //     //     `,
            //     // })
            //     if (env && env instanceof THREE.Mesh) {
            //         env.material  = new THREE.MeshBasicMaterial({ map: envTexture });
            //         // env.scale.set(0.5, 0.5, 0.5);
            //         // env.position.set(0, 3, 0);
            //         ctx.scene.add(env);
            //         meshs.push(env);
            //         guiSystem.updateMeshes(meshs);
            //     }

            //     if(envTerrain && envTerrain instanceof THREE.Mesh) {
            //         // envTerrain.material = envTerrainMaterial;
            //         // envTerrain.position.set(0, 3, 0);
            //         ctx.scene.add(envTerrain);
            //     }
            // });

            ctx.loaders.gltf.load('/models/sphereEnv.glb', (gltf) => {
                const model = gltf.scene;
                const sphereEnv = model.getObjectByName('sphereEnv');
                if (sphereEnv && sphereEnv instanceof THREE.Mesh) {
                    sphereEnv.material = new THREE.MeshBasicMaterial({
                        map: envTexture,
                        side: THREE.BackSide
                    });
                    sphereEnv.position.set(0, -10, 0);
                    sphereEnv.name = "sphere env";
                    ctx.scene.add(sphereEnv);
                }
                    
            });
        },
        update(dt:number) { },
        dispose() { }
    }
}