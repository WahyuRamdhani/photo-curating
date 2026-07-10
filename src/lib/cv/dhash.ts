/** Difference hash: resize to 9x8 grayscale, compare adjacent pixels row-wise.
 * Produces a 64-bit hash (as a hex string) cheap enough to compute and compare
 * for hundreds of photos entirely in the browser. */
export function computeDHash(img: HTMLImageElement): string {
  const w = 9;
  const h = 8;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const gray: number[] = [];
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    gray.push(0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]);
  }

  let bits = "";
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w - 1; x++) {
      const left = gray[y * w + x];
      const right = gray[y * w + x + 1];
      bits += left > right ? "1" : "0";
    }
  }

  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

export function hammingDistance(a: string, b: string): number {
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    const x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    dist += [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4][x];
  }
  return dist;
}

// Two photos with a hash distance at or below this are treated as near-duplicates
// (e.g. burst shots). 64-bit hash; 0 = identical, ~32 = unrelated.
export const DUPLICATE_THRESHOLD = 6;
