import { SceneContext } from "../core/types";
import * as THREE from "three";
import vertexShader from '../shaders/treeCardShaders/vertex.vert';
import fragmentShader from '../shaders/treeCardShaders/fragment.frag';

const COUNT = 400;
export default function makeTreeCardsSystem(ctx: SceneContext) {
    const plane = new THREE.PlaneGeometry(1, 1);
    const treeBaseColor = ctx.loaders.texture.load('/textures/treeCards/tree-1/tree_1_color_eevee.png');
    const treeNormal = ctx.loaders.texture.load('/textures/treeCards/tree-1/tree_1_normal.png');
    const treeGeneralNormal = ctx.loaders.texture.load('/textures/treeCards/tree-1/trees_normal.png');

    const baseUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.lambert.uniforms);
    const customUniforms = {
        time: { value: 0.0 },
        baseColor: { value: treeBaseColor },
        normalMap: { value: treeNormal },
        generalNormalMap: { value: treeGeneralNormal },
    }
    const treeCardUniforms = THREE.UniformsUtils.merge([baseUniforms, customUniforms]);
    const treeCardMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: treeCardUniforms,
        fog: true,
    })

    const treeCardIM = new THREE.InstancedMesh(plane, treeCardMaterial, COUNT);

    const instanceOffsetLevel = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
        const vi = i*3;
        const randomAngle = (Math.random() * 2 - 1) * Math.PI; // [-PI, PI]

        const radius = Math.random()*250 + 150; //[150, 400]

        instanceOffsetLevel[vi + 0] = Math.cos(randomAngle) * radius;
        instanceOffsetLevel[vi + 1] = 0;
        instanceOffsetLevel[vi + 2] =  Math.sin(randomAngle) * radius;
    }

    treeCardIM.geometry.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(instanceOffsetLevel, 3));

    treeCardIM.frustumCulled = false; // todo: fix culling issue
    return {
        init(ctx: SceneContext) {
            ctx.scene.add(treeCardIM);
        },
        update(dt:number) {
            treeCardUniforms.fogTime.value = dt;
         },
        dispose() { }
    }
}