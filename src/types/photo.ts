export interface DrivePhoto {
  id: string;
  name: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface Stage1Result {
  fileId: string;
  landscape: boolean;
  sharpness: number;
  isBlurry: boolean;
  faceCount: number;
  eyesClosed: boolean;
  duplicateOf: string | null;
  avoidTags: string[];
  rejected: boolean;
  reasons: string[];
}

export interface Stage2Result {
  fileId: string;
  professionalScore: number;
  framingStyle: string;
  moodTags: string[];
  isSelfieInGroup: boolean;
  eyeContactIssue: boolean;
  suggestedKeep: boolean;
  notes: string;
  error?: string;
}

export interface CuratedPhoto {
  photo: DrivePhoto;
  thumbUrl: string;
  stage1: Stage1Result;
  stage2: Stage2Result | null;
  manualKeep: boolean | null;
}

export type PipelineStage =
  | "connect"
  | "pick-folder"
  | "scanning"
  | "shortlist-review"
  | "semantic-scoring"
  | "final-review"
  | "exporting"
  | "done";
