import { sign } from "crypto";
import { SceneContext, System } from "../core/types";
import * as THREE from "three";
import vertexShader from '../shaders/signShaders/vertex.vert';
import fragmentShader from '../shaders/signShaders/fragment.frag';
import { Line2, LineGeometry, LineMaterial } from "three/examples/jsm/Addons.js";


export default function makeSignSystem(ctx: SceneContext): System {
    const signTexture = ctx.loaders.texture.load("/textures/sign_1k.png");
    signTexture.flipY = false;
    // signTexture.colorSpace = THREE.SRGBColorSpace;
    signTexture.magFilter = THREE.NearestFilter;
    signTexture.minFilter = THREE.NearestFilter;
    const customUniforms = {
        signTexture: { value: signTexture },
    }
    const baseUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.lambert.uniforms);
    const signUniform = THREE.UniformsUtils.merge([baseUniforms, customUniforms]);
    // ctx.loaders.gltf.load("/models/sign.glb", (gltf) => {
    //     const model = gltf.scene;
    //     const sign = model.getObjectByName("sign");
    //     if (sign && sign instanceof THREE.Mesh) {
    //         sign.material = new THREE.ShaderMaterial({
    //             uniforms: signUniform,
    //             vertexShader,
    //             fragmentShader,
    //             lights: true,
    //         })
    //         sign.castShadow = true;
    //         sign.receiveShadow = true;
    //         ctx.scene.add(sign);
    //         sign.layers.enable(ctx.state.postEffectState.bloom.layer);
    //     }
    // })

    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.5, 0),
        new THREE.Vector3(1, 0.5, 0),
        new THREE.Vector3(1, 0.8, 0),
        new THREE.Vector3(2, 0, 0),
        new THREE.Vector3(1, -0.8, 0),
        new THREE.Vector3(1, -0.5, 0),
        new THREE.Vector3(0, -0.5, 0),
        new THREE.Vector3(0, 0.5, 0),
      ]);
      const points = curve.getPoints(100).flatMap(p => [p.x, p.y, p.z]);
      
      const geometry = new LineGeometry();
      geometry.setPositions(points);
      
      const material = new LineMaterial({
        color: "#e4cdbc",
        linewidth: 6, // in world units
        transparent: false,
        // opacity: 1,
      });
      
      const arrow = new Line2(geometry, material);
      ctx.scene.add(arrow);
      arrow.position.set(-50, 1.3, 50);
      arrow.layers.enable(ctx.state.postEffectState.bloom.layer);

    //   const curve2 = new THREE.CatmullRomCurve3([
    //     new THREE.Vector3(0,1.8, 0),
    //     new THREE.Vector3(2, 1.6, 0),
    //     new THREE.Vector3(1.7, 1.1, 0)
    //   ]);
    //   const points2 = curve2.getPoints(100).flatMap(p => [p.x, p.y, p.z]);
      
    //   const geometry2 = new LineGeometry();
    //   geometry2.setPositions(points2);
      
    //   const material2 = new LineMaterial({
    //     color: 0x00ffff,
    //     linewidth: 3, // in world units
    //     transparent: false,
    //     // opacity: 1,
    //   });
      
    //   const line2 = new Line2(geometry2, material2);
    //   ctx.scene.add(line2);
    //   line2.layers.enable(ctx.state.postEffectState.bloom.layer);
    return {
        init() {

        },
        update(dt: number) {
            arrow.position.y = 2 + Math.sin(dt) * 0.08;
         },
        dispose() { }
    }
}