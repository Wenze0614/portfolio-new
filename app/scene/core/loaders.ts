// app/scene/core/loaders.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function makeLoaders() {
  const texture = new THREE.TextureLoader();
  const gltf = new GLTFLoader();
  return { texture, gltf };
}