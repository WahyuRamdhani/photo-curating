import { Stage1Result } from "@/types/photo";
import { isLandscape } from "./orientation";
import { computeSharpness, BLUR_THRESHOLD } from "./blur";
import { computeDHash, hammingDistance, DUPLICATE_THRESHOLD } from "./dhash";
import { analyzeFaces } from "./faces";
import { detectAvoidListTags } from "./objects";

export interface Stage1Input {
  id: string;
  img: HTMLImageElement;
}

function clusterDuplicates(
  items: { id: string; hash: string; sharpness: number }[]
): Map<string, string> {
  const duplicateOf = new Map<string, string>();
  const visited = new Array(items.length).fill(false);

  for (let i = 0; i < items.length; i++) {
    if (visited[i]) continue;
    const cluster = [i];
    visited[i] = true;
    for (let j = i + 1; j < items.length; j++) {
      if (visited[j]) continue;
      if (hammingDistance(items[i].hash, items[j].hash) <= DUPLICATE_THRESHOLD) {
        cluster.push(j);
        visited[j] = true;
      }
    }
    if (cluster.length > 1) {
      let keeper = cluster[0];
      for (const idx of cluster) {
        if (items[idx].sharpness > items[keeper].sharpness) keeper = idx;
      }
      for (const idx of cluster) {
        if (idx !== keeper) duplicateOf.set(items[idx].id, items[keeper].id);
      }
    }
  }
  return duplicateOf;
}

export async function runStage1(
  inputs: Stage1Input[],
  onProgress?: (done: number, total: number) => void
): Promise<Stage1Result[]> {
  const partials: Array<{
    id: string;
    landscape: boolean;
    sharpness: number;
    faceCount: number;
    eyesClosed: boolean;
    avoidTags: string[];
    hash: string;
  }> = [];

  for (let i = 0; i < inputs.length; i++) {
    const { id, img } = inputs[i];
    const landscape = isLandscape(img.naturalWidth, img.naturalHeight);
    const sharpness = computeSharpness(img);
    const hash = computeDHash(img);
    const { faceCount, anyEyesClosed } = await analyzeFaces(img);
    const avoidTags = await detectAvoidListTags(img);

    partials.push({
      id,
      landscape,
      sharpness,
      faceCount,
      eyesClosed: anyEyesClosed,
      avoidTags,
      hash,
    });
    onProgress?.(i + 1, inputs.length);
  }

  const duplicateOf = clusterDuplicates(partials);

  return partials.map((p) => {
    const isBlurry = p.sharpness < BLUR_THRESHOLD;
    const dup = duplicateOf.get(p.id) ?? null;
    const reasons: string[] = [];
    if (!p.landscape) reasons.push("Not landscape orientation");
    if (isBlurry) reasons.push("Too blurry / soft focus");
    if (p.eyesClosed) reasons.push("Eyes closed / blinking");
    if (dup) reasons.push("Near-duplicate of a sharper shot");

    return {
      fileId: p.id,
      landscape: p.landscape,
      sharpness: p.sharpness,
      isBlurry,
      faceCount: p.faceCount,
      eyesClosed: p.eyesClosed,
      duplicateOf: dup,
      avoidTags: p.avoidTags,
      rejected: !p.landscape || isBlurry || p.eyesClosed || dup !== null,
      reasons,
    };
  });
}
