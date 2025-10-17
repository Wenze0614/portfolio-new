// app/scene/core/loaders.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export function makeLoaders() {
  const texture = new THREE.TextureLoader();
  const gltf = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  gltf.setDRACOLoader(dracoLoader);

  const audio = new THREE.AudioLoader();
  return { texture, gltf, audio };
}