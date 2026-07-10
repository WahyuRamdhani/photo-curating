"use client";

import { useCallback, useRef, useState } from "react";
import {
  GOOGLE_API_KEY,
  GOOGLE_CLIENT_ID,
  MAX_TARGET,
  MIN_TARGET,
  isGoogleConfigured,
} from "@/lib/config";
import { requestAccessToken } from "@/lib/google/auth";
import { pickFolder, PickedFolder } from "@/lib/google/picker";
import {
  copyFileToFolder,
  createFolder,
  fetchThumbnailObjectUrl,
  listPhotosInFolder,
} from "@/lib/google/drive";
import { loadImage } from "@/lib/cv/canvas";
import type { Stage1Input } from "@/lib/cv/pipeline";
import { mapWithConcurrency } from "@/lib/concurrency";
import { CuratedPhoto, PipelineStage } from "@/types/photo";
import SetupNotice from "@/components/SetupNotice";
import ProgressBar from "@/components/ProgressBar";
import PhotoGrid from "@/components/PhotoGrid";

function isKept(c: CuratedPhoto): boolean {
  if (c.manualKeep !== null) return c.manualKeep;
  if (c.stage2 && !c.stage2.error) return c.stage2.suggestedKeep;
  return !c.stage1.rejected;
}

export default function Home() {
  const [stage, setStage] = useState<PipelineStage>("connect");
  const [token, setToken] = useState<string | null>(null);
  const [folder, setFolder] = useState<PickedFolder | null>(null);
  const [curated, setCurated] = useState<CuratedPhoto[]>([]);
  const [progress, setProgress] = useState({ label: "", done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [exportedFolderId, setExportedFolderId] = useState<string | null>(null);
  const imgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const handleConnect = useCallback(async () => {
    setError(null);
    try {
      const t = await requestAccessToken(GOOGLE_CLIENT_ID);
      setToken(t);
      setStage("pick-folder");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const handlePickFolder = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const picked = await pickFolder({ apiKey: GOOGLE_API_KEY, accessToken: token });
      if (!picked) return;
      setFolder(picked);
      setStage("scanning");

      setProgress({ label: "Listing photos", done: 0, total: 0 });
      const photos = await listPhotosInFolder(picked.id, token);
      if (photos.length === 0) {
        setError("No image files found in that folder (or its subfolders).");
        setStage("pick-folder");
        return;
      }

      setProgress({ label: "Fetching thumbnails", done: 0, total: photos.length });
      const withThumbs = await mapWithConcurrency(
        photos,
        6,
        async (p) => {
          const thumbUrl = await fetchThumbnailObjectUrl(p.id, token);
          const img = await loadImage(thumbUrl);
          imgCacheRef.current.set(p.id, img);
          return { p, thumbUrl, img };
        },
        (done, total) => setProgress({ label: "Fetching thumbnails", done, total })
      );

      setProgress({
        label: "Running local checks (blur, faces, duplicates)",
        done: 0,
        total: withThumbs.length,
      });
      const stage1Inputs: Stage1Input[] = withThumbs.map((w) => ({ id: w.p.id, img: w.img }));
      const { runStage1 } = await import("@/lib/cv/pipeline");
      const stage1Results = await runStage1(stage1Inputs, (done, total) =>
        setProgress({ label: "Running local checks (blur, faces, duplicates)", done, total })
      );

      const merged: CuratedPhoto[] = withThumbs.map((w, i) => ({
        photo: w.p,
        thumbUrl: w.thumbUrl,
        stage1: stage1Results[i],
        stage2: null,
        manualKeep: null,
      }));
      setCurated(merged);
      setStage("shortlist-review");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStage("pick-folder");
    }
  }, [token]);

  const handleRunSmartScoring = useCallback(async () => {
    const shortlist = curated.filter(isKept);
    if (shortlist.length === 0) {
      setError("Nothing passed the local checks to score.");
      return;
    }
    setStage("semantic-scoring");
    setProgress({ label: "Smart scoring shortlist", done: 0, total: shortlist.length });
    const items = shortlist.map((c) => ({
      fileId: c.photo.id,
      img: imgCacheRef.current.get(c.photo.id)!,
    }));
    const { scorePhotosSequentially } = await import("@/lib/gemini/scorePhoto");
    const results = await scorePhotosSequentially(items, (done, total) =>
      setProgress({ label: "Smart scoring shortlist", done, total })
    );
    const resultMap = new Map(results.map((r) => [r.fileId, r]));
    setCurated((prev) =>
      prev.map((c) => (resultMap.has(c.photo.id) ? { ...c, stage2: resultMap.get(c.photo.id)! } : c))
    );
    setStage("final-review");
  }, [curated]);

  const handleToggleKeep = useCallback((fileId: string) => {
    setCurated((prev) =>
      prev.map((c) => (c.photo.id === fileId ? { ...c, manualKeep: !isKept(c) } : c))
    );
  }, []);

  const handleExport = useCallback(async () => {
    if (!token || !folder) return;
    const keptList = curated.filter(isKept);
    setStage("exporting");
    setProgress({ label: "Exporting to Drive", done: 0, total: keptList.length });
    try {
      const destId = await createFolder(
        `Selected - ${new Date().toISOString().slice(0, 10)}`,
        folder.id,
        token
      );
      await mapWithConcurrency(
        keptList,
        4,
        async (c) => copyFileToFolder(c.photo.id, destId, token),
        (done, total) => setProgress({ label: "Exporting to Drive", done, total })
      );
      setExportedFolderId(destId);
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStage("final-review");
    }
  }, [token, folder, curated]);

  const keptCount = curated.filter(isKept).length;
  const shortlistCount = curated.filter((c) => !c.stage1.rejected).length;

  if (!isGoogleConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <SetupNotice />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-1 text-2xl font-semibold">Photo Curator</h1>
      <p className="mb-6 text-sm text-gray-500">
        Runs under your own Google account — nothing is uploaded anywhere except back to your Drive.
      </p>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {stage === "connect" && (
        <button
          onClick={handleConnect}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Connect Google Drive
        </button>
      )}

      {stage === "pick-folder" && (
        <button
          onClick={handlePickFolder}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Choose folder to curate
        </button>
      )}

      {(stage === "scanning" || stage === "semantic-scoring" || stage === "exporting") && (
        <div className="space-y-4">
          <ProgressBar label={progress.label} done={progress.done} total={progress.total} />
        </div>
      )}

      {stage === "shortlist-review" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm">
              Local checks: <strong>{shortlistCount}</strong> passed out of{" "}
              <strong>{curated.length}</strong>. Click any card to override.
            </p>
            <button
              onClick={handleRunSmartScoring}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Run smart scoring on shortlist ({keptCount})
            </button>
            <button
              onClick={() => setStage("final-review")}
              className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Skip smart scoring, review manually
            </button>
          </div>
          <PhotoGrid items={curated} onToggleKeep={handleToggleKeep} />
        </div>
      )}

      {stage === "final-review" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p
              className={`text-sm font-medium ${
                keptCount < MIN_TARGET || keptCount > MAX_TARGET
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {keptCount} kept — target {MIN_TARGET}-{MAX_TARGET}
            </p>
            <button
              onClick={handleExport}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Export {keptCount} selected photos to Drive
            </button>
          </div>
          <PhotoGrid items={curated} onToggleKeep={handleToggleKeep} />
        </div>
      )}

      {stage === "done" && (
        <div className="space-y-3">
          <p className="font-medium text-green-700 dark:text-green-400">
            Done! {keptCount} photos copied into a new &quot;Selected&quot; folder.
          </p>
          {exportedFolderId && (
            <a
              className="text-blue-600 underline"
              href={`https://drive.google.com/drive/folders/${exportedFolderId}`}
              target="_blank"
              rel="noreferrer"
            >
              Open the folder in Drive
            </a>
          )}
        </div>
      )}
    </main>
  );
}
