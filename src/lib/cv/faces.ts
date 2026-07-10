import * as faceapi from "face-api.js";

// face-api.js ships no model weights on npm; load them once from a CDN mirror
// of the official repo. Cached by the browser after the first run.
const MODEL_URL =
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

let modelsLoaded: Promise<void> | null = null;

export function loadFaceModels(): Promise<void> {
  if (!modelsLoaded) {
    modelsLoaded = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    ]).then(() => undefined);
  }
  return modelsLoaded;
}

function eyeAspectRatio(points: faceapi.Point[]): number {
  const dist = (a: faceapi.Point, b: faceapi.Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const vertical1 = dist(points[1], points[5]);
  const vertical2 = dist(points[2], points[4]);
  const horizontal = dist(points[0], points[3]);
  if (horizontal === 0) return 0;
  return (vertical1 + vertical2) / (2 * horizontal);
}

// Eyes with an EAR below this are considered closed/blinking. Standard
// threshold from the dlib blink-detection literature (~0.2-0.25).
const EAR_THRESHOLD = 0.22;

export interface FaceAnalysis {
  faceCount: number;
  anyEyesClosed: boolean;
}

export async function analyzeFaces(img: HTMLImageElement): Promise<FaceAnalysis> {
  await loadFaceModels();

  const detections = await faceapi
    .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks(true);

  let anyEyesClosed = false;
  for (const d of detections) {
    const landmarks = d.landmarks;
    const leftEar = eyeAspectRatio(landmarks.getLeftEye());
    const rightEar = eyeAspectRatio(landmarks.getRightEye());
    if (leftEar < EAR_THRESHOLD || rightEar < EAR_THRESHOLD) {
      anyEyesClosed = true;
    }
  }

  return { faceCount: detections.length, anyEyesClosed };
}
