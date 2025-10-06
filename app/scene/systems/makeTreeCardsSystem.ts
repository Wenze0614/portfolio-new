import { SceneContext } from "../core/types";
import * as THREE from "three";
import vertexShader from '../shaders/treeCardShaders/vertex.vert';
import fragmentShader from '../shaders/treeCardShaders/fragment.frag';

const COUNT = 1000;
export default function makeTreeCardsSystem(ctx: SceneContext) {
    const plane = new THREE.PlaneGeometry(1, 1);
    const treeBaseColor = ctx.loaders.texture.load('/textures/treeCards/tree-1/tree_1_color_eevee.png');
    const treeNormal = ctx.loaders.texture.load('/textures/treeCards/tree-1/tree_1_normal.png');
    const treeGeneralNormal = ctx.loaders.texture.load('/textures/treeCards/tree-1/trees_normal.png');

    const treeCardMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        // side: THREE.DoubleSide,
        // transparent: true,
        uniforms: {
            baseColor: { value: treeBaseColor },
            normalMap: { value: treeNormal },
            generalNormalMap: { value: treeGeneralNormal },
        }
    })
    //const treeCardMesh = new THREE.Mesh(plane, treeCardMaterial);
    const treeCardIM = new THREE.InstancedMesh(plane, treeCardMaterial, COUNT);


    const dummy = new THREE.Object3D();
    const translation = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
        const randomAngle = (Math.random() * 2 - 1) * Math.PI; // [-PI, PI]
        const radius = Math.random() * 50 + 100; //[100, 150]
        const x = Math.cos(randomAngle) * radius;  //
        const z = Math.sin(randomAngle) * radius;
        const y = 0;
        translation[i + 0] = x;
        translation[i + 1] = y;
        translation[i + 2] = z;

        dummy.position.set(x, y, z);
        dummy.updateMatrix();

        treeCardIM.setMatrixAt(i, dummy.matrix);
    }
    //treeCardIM.setAttribute('treeTransformMatrix', new THREE.InstancedBufferAttribute(transformMatrixArray, 16));

    treeCardIM.instanceMatrix.needsUpdate = true;

    treeCardIM.frustumCulled = false; // todo: fix culling issue
    return {
        init(ctx: SceneContext) {
            ctx.scene.add(treeCardIM);
            //ctx.scene.add(treeCardMesh);
        },
        update(ctx: SceneContext) { },
        dispose() { }
    }
}