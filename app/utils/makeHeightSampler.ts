import * as THREE from "three";

/** Create a bilinear height sampler from a grayscale height texture (8-bit). */
export function makeHeightSampler(
  heightTex: THREE.Texture,
  terrainMin: THREE.Vector2,   // e.g. (-50, -100)
  terrainMax: THREE.Vector2,   // e.g. ( 50,  100)
  options?: { flipV?: boolean }  // set true if your terrain mapping flips V
) {
  //console.log("heightexture: ", heightTex);
  //console.log('heightmap width: ', heightTex.image)
  const img: HTMLImageElement | ImageBitmap = heightTex.image;
  const w = (img as any).width, h = (img as any).height;

  // Draw into an offscreen canvas so we can read pixels
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const g = canvas.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img as any, 0, 0);

  const { data } = g.getImageData(0, 0, w, h);

  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const lerp = THREE.MathUtils.lerp;

  function sample01(u: number, v: number) {
    // bilinear sampling on [0,1]^2 → grayscale in [0,1]
    u = clamp01(u); v = clamp01(v);

    const x = u * (w - 1), y = v * (h - 1);
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1);
    const tx = x - x0, ty = y - y0;

    const idx = (ix: number, iy: number) => (iy * w + ix) * 4;
    const r = (ix: number, iy: number) => data[idx(ix, iy)] / 255;

    const h00 = r(x0, y0), h10 = r(x1, y0);
    const h01 = r(x0, y1), h11 = r(x1, y1);
    const a = lerp(h00, h10, tx);
    const b = lerp(h01, h11, tx);
    return lerp(a, b, ty);
  }

  const size = new THREE.Vector2().subVectors(terrainMax, terrainMin);

  return {
    /** height Y (world units) at world XZ */
    heightAtXZ(x: number, z: number, heightScale: number, heightOffset: number) {
      // world → UV mapping. Note the V flip to make Z+ map to V=0 (as per your setup)
      let u = (x - terrainMin.x) / size.x;
      let v = (options?.flipV ? (z - terrainMin.y) / size.y
                              : (terrainMax.y - z) / size.y);
      const h01 = sample01(u, v);
      return heightOffset + h01 * heightScale;
    }
  };
}