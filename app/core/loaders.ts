// app/scene/core/loaders.ts
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// Large assets that are requested up front (in parallel) and later picked up by their systems.
export const ASSET_URLS = {
  house: '/models/house.glb',
  trees: '/models/trees.glb',
  skyHDR: '/textures/animeSky-day-2-2k.hdr',
  music: '/audio/lune.mp3',
} as const;

export function makeLoaders() {
  const loaderManager = new THREE.LoadingManager();
  const texture = new THREE.TextureLoader(loaderManager);
  const gltf = new GLTFLoader(loaderManager);
  const dracoLoader = new DRACOLoader(loaderManager);
  dracoLoader.setDecoderPath('/draco/');
  gltf.setDRACOLoader(dracoLoader);

  const audio = new THREE.AudioLoader(loaderManager);
  const rgbe = new RGBELoader(loaderManager);

  // Each URL is requested once; every caller gets the same promise.
  // This lets page.tsx start all downloads at once while each system still asks for its own file.
  const inFlight = new Map<string, Promise<unknown>>();
  function once<T>(url: string, load: () => Promise<T>): Promise<T> {
    let p = inFlight.get(url) as Promise<T> | undefined;
    if (!p) {
      p = load();
      p.catch(() => { }); // a caller that awaits it still sees the error; this only avoids an unhandled-rejection warning for early kicks
      inFlight.set(url, p);
    }
    return p;
  }

  const loadGLTF = (url: string): Promise<GLTF> => once(url, () => gltf.loadAsync(url));
  const loadHDR = (url: string): Promise<THREE.DataTexture> => once(url, () => rgbe.loadAsync(url));
  const loadAudio = (url: string): Promise<AudioBuffer> => once(url, () => audio.loadAsync(url));

  return { loaderManager, texture, gltf, audio, loadGLTF, loadHDR, loadAudio };
}
