import * as THREE from "three";

/** Create a bilinear height sampler from a grayscale height texture (8-bit, height in the R channel). */
export function makeHeightSampler(
  heightTex: THREE.Texture,
  terrainMin: THREE.Vector2,   // e.g. (-50, -100)
  terrainMax: THREE.Vector2,   // e.g. ( 50,  100)
  options?: { flipV?: boolean }  // set true if your terrain mapping flips V
) {
  const img: HTMLImageElement | ImageBitmap = heightTex.image;
  const w = img.width, h = img.height;

  // Draw into a temporary canvas once to read the pixels, then keep only the R channel:
  // w × h bytes instead of the full RGBA ImageData (4 MB instead of 16 MB at 2048², and the
  // canvas and its pixel copy can be garbage-collected right away).
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const g = canvas.getContext("2d")!;
  g.drawImage(img, 0, 0);
  const rgba = g.getImageData(0, 0, w, h).data;
  const heights = new Uint8Array(w * h);
  for (let i = 0; i < heights.length; i++) heights[i] = rgba[i * 4];
  canvas.width = canvas.height = 0; // release the canvas backing store

  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const lerp = THREE.MathUtils.lerp;

  function sample01(u: number, v: number) {
    // bilinear sampling on [0,1]^2 → grayscale in [0,1]
    u = clamp01(u); v = clamp01(v);

    const x = u * (w - 1), y = v * (h - 1);
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1);
    const tx = x - x0, ty = y - y0;

    const r = (ix: number, iy: number) => heights[iy * w + ix] / 255;

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
      const u = (x - terrainMin.x) / size.x;
      const v = (options?.flipV ? (z - terrainMin.y) / size.y
                                : (terrainMax.y - z) / size.y);
      const h01 = sample01(u, v);
      return heightOffset + h01 * heightScale;
    }
  };
}
