import { Stage2Result } from "@/types/photo";

function imageToJpegBase64(img: HTMLImageElement, maxDim = 768): { base64: string; mimeType: string } {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { base64: dataUrl.split(",")[1], mimeType: "image/jpeg" };
}

async function callScoreApi(
  imageBase64: string,
  mimeType: string,
  attempt = 0
): Promise<Omit<Stage2Result, "fileId">> {
  const res = await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  if (res.status === 429 && attempt < 4) {
    const backoffMs = 2000 * 2 ** attempt;
    await new Promise((r) => setTimeout(r, backoffMs));
    return callScoreApi(imageBase64, mimeType, attempt + 1);
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Score API failed with ${res.status}`);
  }
  return data;
}

export async function scorePhoto(fileId: string, img: HTMLImageElement): Promise<Stage2Result> {
  try {
    const { base64, mimeType } = imageToJpegBase64(img);
    const result = await callScoreApi(base64, mimeType);
    return { fileId, ...result };
  } catch (err) {
    return {
      fileId,
      professionalScore: 0,
      framingStyle: "unknown",
      moodTags: [],
      isSelfieInGroup: false,
      eyeContactIssue: false,
      suggestedKeep: false,
      notes: "Scoring failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Runs scoring sequentially with a floor delay between calls to respect
 * free-tier rate limits (Gemini Flash free tier is low RPM). */
export async function scorePhotosSequentially(
  items: { fileId: string; img: HTMLImageElement }[],
  onProgress?: (done: number, total: number) => void,
  minDelayMs = 4200
): Promise<Stage2Result[]> {
  const results: Stage2Result[] = [];
  for (let i = 0; i < items.length; i++) {
    const start = Date.now();
    const result = await scorePhoto(items[i].fileId, items[i].img);
    results.push(result);
    onProgress?.(i + 1, items.length);

    const elapsed = Date.now() - start;
    if (elapsed < minDelayMs && i < items.length - 1) {
      await new Promise((r) => setTimeout(r, minDelayMs - elapsed));
    }
  }
  return results;
}
