import { SceneContext, ScreenSystem } from "../../core/types";
import * as THREE from "three";
import vertexShader from "../../shaders/screenShaders/vertex.vert";
import fragmentShader from "../../shaders/screenShaders/fragment.frag";

export default function makeFloatingScreenSystem(ctx: SceneContext): ScreenSystem {
    // const screenMask = ctx.loaders.texture.load('/textures/screenMask.png');

    // screenMask.colorSpace = THREE.LinearSRGBColorSpace;   // (r176) use linear
    // // or in older three: maskTex.encoding = THREE.LinearEncoding;
    // screenMask.minFilter = THREE.LinearFilter;
    // screenMask.magFilter = THREE.LinearFilter;
    // screenMask.wrapS = screenMask.wrapT = THREE.ClampToEdgeWrapping;
    // screenMask.generateMipmaps = false;

    const screenMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            screenMask: { value: null },
            uScreenSize: { value: new THREE.Vector2(6, 4) },
        },
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        transparent: true,
    })
    const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 4),
        screenMaterial
    )
    ctx.scene.add(screen);
    screen.position.set(0, 3, 0);
    screen.rotation.y = Math.PI / 2;
    return {
        init() { },
        update(dt: number) {
            screenMaterial.uniforms.uTime.value = dt;
        },
        dispose() { },
        setPosition(position: THREE.Vector3) {
            screen.position.copy(position);
            screen.position.y += 4;
        }
    }
}