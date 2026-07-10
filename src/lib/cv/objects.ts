import "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

// Maps directly to the brief's "things we want to avoid" list: water bottles,
// trash/clutter, and food/meals. COCO's label set covers a useful subset;
// this is a soft signal surfaced to the reviewer, not an auto-reject.
const AVOID_CLASSES = new Set([
  "bottle",
  "banana",
  "apple",
  "sandwich",
  "orange",
  "broccoli",
  "carrot",
  "hot dog",
  "pizza",
  "donut",
  "cake",
]);

const MIN_CONFIDENCE = 0.5;

let modelPromise: Promise<cocoSsd.ObjectDetection> | null = null;

function loadObjectModel(): Promise<cocoSsd.ObjectDetection> {
  if (!modelPromise) {
    modelPromise = cocoSsd.load({ base: "lite_mobilenet_v2" });
  }
  return modelPromise;
}

export async function detectAvoidListTags(img: HTMLImageElement): Promise<string[]> {
  const model = await loadObjectModel();
  const predictions = await model.detect(img);
  const tags = new Set<string>();
  for (const p of predictions) {
    if (p.score >= MIN_CONFIDENCE && AVOID_CLASSES.has(p.class)) {
      tags.add(p.class);
    }
  }
  return [...tags];
}
