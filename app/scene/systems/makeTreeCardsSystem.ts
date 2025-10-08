import { SceneContext } from "../core/types";
import * as THREE from "three";
import vertexShader from '../shaders/treeCardShaders/vertex.vert';
import fragmentShader from '../shaders/treeCardShaders/fragment.frag';
import { tree } from "next/dist/build/templates/app-page";

const COUNT = 200;
export default function makeTreeCardsSystem(ctx: SceneContext) {
    const plane = new THREE.PlaneGeometry(1, 1);
    const plane2 = new THREE.PlaneGeometry(1, 1);
    const treeBaseColor = ctx.loaders.texture.load('/textures/treeCards/tree-1/tree_1_color_eevee.png');
    const treeBaseColor2 = ctx.loaders.texture.load('/textures/treeCards/tree-1/tree_1_color_cycle.png');
    const treeNormal = ctx.loaders.texture.load('/textures/treeCards/tree-1/tree_1_normal.png');
    const treeGeneralNormal = ctx.loaders.texture.load('/textures/treeCards/tree-1/trees_normal.png');

    const treeCardMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            baseColor: { value: treeBaseColor },
            normalMap: { value: treeNormal },
            generalNormalMap: { value: treeGeneralNormal },
        }
    })

    const treeCardMaterial2 = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            baseColor: { value: treeBaseColor2 },
            normalMap: { value: treeNormal },
            generalNormalMap: { value: treeGeneralNormal },
        }
    })
    //const treeCardMesh = new THREE.Mesh(plane, treeCardMaterial);
    const treeCardIM = new THREE.InstancedMesh(plane, treeCardMaterial, COUNT);
    const treeCardIM2 = new THREE.InstancedMesh(plane2, treeCardMaterial2, COUNT);


    // const dummy = new THREE.Object3D();
    const instanceOffsetLevel1 = new Float32Array(COUNT * 3);
    const instanceOffsetLevel2 = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
        const vi = i*3;
        const randomAngle = (Math.random() * 2 - 1) * Math.PI; // [-PI, PI]

        const radius_1 = Math.random()*200 + 200; //[200, 400]
        const radius_2 = Math.random()*100 + 150; //[150, 250]

        instanceOffsetLevel1[vi + 0] = Math.cos(randomAngle) * radius_1;
        instanceOffsetLevel1[vi + 1] = 0;
        instanceOffsetLevel1[vi + 2] =  Math.sin(randomAngle) * radius_1;

        instanceOffsetLevel2[vi + 0] = Math.cos(randomAngle) * radius_2;
        instanceOffsetLevel2[vi + 1] = 0;
        instanceOffsetLevel2[vi + 2] =  Math.sin(randomAngle) * radius_2;

        // dummy.position.set(x, y, z);
        // dummy.updateMatrix();

        // treeCardIM.setMatrixAt(i, dummy.matrix);
    }
    //treeCardIM.setAttribute('treeTransformMatrix', new THREE.InstancedBufferAttribute(transformMatrixArray, 16));
    treeCardIM.geometry.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(instanceOffsetLevel1, 3));
    treeCardIM2.geometry.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(instanceOffsetLevel2, 3));
    // treeCardIM.instanceMatrix.needsUpdate = true;

    treeCardIM.frustumCulled = false; // todo: fix culling issue
    treeCardIM2.frustumCulled = false;
    return {
        init(ctx: SceneContext) {
            ctx.scene.add(treeCardIM);
            ctx.scene.add(treeCardIM2);
            //ctx.scene.add(treeCardMesh);
        },
        update(ctx: SceneContext) { },
        dispose() { }
    }
}