// app/scene/core/loaders.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export function makeLoaders() {
  const loaderManager = new THREE.LoadingManager();
  const texture = new THREE.TextureLoader(loaderManager);
  const gltf = new GLTFLoader(loaderManager);
  const dracoLoader = new DRACOLoader(loaderManager);
  dracoLoader.setDecoderPath('/draco/');
  gltf.setDRACOLoader(dracoLoader);

  const audio = new THREE.AudioLoader(loaderManager);
  return { loaderManager, texture, gltf, audio };
}