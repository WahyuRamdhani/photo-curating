import { toGrayscale } from "./canvas";

/** Variance of the Laplacian: a standard, dependency-free sharpness metric.
 * Low variance ~= flat edges ~= blurry photo. */
export function computeSharpness(img: HTMLImageElement): number {
  const { data, width, height } = toGrayscale(img, 600);

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap =
        4 * data[i] -
        data[i - 1] -
        data[i + 1] -
        data[i - width] -
        data[i + width];
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

// Photos scoring below this are flagged as blurry. Tuned empirically for
// 600px-downscaled JPEGs; adjust if the shortlist looks too strict/loose.
export const BLUR_THRESHOLD = 60;
