import * as THREE from 'three';
export default function modifyShader(shader: THREE.WebGLProgramParametersWithUniforms) {
    shader.uniforms.fogTime = { value: 0.0 };
}