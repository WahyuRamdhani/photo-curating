import { DrivePhoto } from "@/types/photo";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const IMAGE_MIME_PREFIX = "image/";

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function driveFetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...authHeaders(token), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

/** Recursively lists image files under a folder (one level of subfolders deep is enough
 * for typical shoot-day folders, but we walk arbitrarily deep in case of nesting). */
export async function listPhotosInFolder(
  folderId: string,
  token: string
): Promise<DrivePhoto[]> {
  const photos: DrivePhoto[] = [];
  const queue: string[] = [folderId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        q: `'${currentId}' in parents and trashed = false`,
        fields:
          "nextPageToken, files(id, name, mimeType, imageMediaMetadata(width,height))",
        pageSize: "1000",
        ...(pageToken ? { pageToken } : {}),
      });
      const res = await driveFetch<{
        nextPageToken?: string;
        files: Array<{
          id: string;
          name: string;
          mimeType: string;
          imageMediaMetadata?: { width?: number; height?: number };
        }>;
      }>(`${DRIVE_API}/files?${params}`, token);

      for (const f of res.files) {
        if (f.mimeType === "application/vnd.google-apps.folder") {
          queue.push(f.id);
        } else if (f.mimeType.startsWith(IMAGE_MIME_PREFIX)) {
          photos.push({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            width: f.imageMediaMetadata?.width,
            height: f.imageMediaMetadata?.height,
          });
        }
      }
      pageToken = res.nextPageToken;
    } while (pageToken);
  }

  return photos;
}

/** Fetches a downsized image (via Drive thumbnail) as an object URL, cheap enough
 * to run CV/vision scoring on without ever pulling the full-resolution original. */
export async function fetchThumbnailObjectUrl(
  fileId: string,
  token: string,
  maxSize = 1000
): Promise<string> {
  const res = await fetch(
    `${DRIVE_API}/files/${fileId}/thumbnail?sz=w${maxSize}`,
    { headers: authHeaders(token) }
  );
  if (!res.ok) {
    // Fallback: some files don't expose /thumbnail; use the alt=media stream instead.
    const fallback = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
      headers: authHeaders(token),
    });
    if (!fallback.ok) throw new Error(`Could not fetch image for ${fileId}`);
    return URL.createObjectURL(await fallback.blob());
  }
  return URL.createObjectURL(await res.blob());
}

export async function createFolder(
  name: string,
  parentId: string,
  token: string
): Promise<string> {
  const res = await driveFetch<{ id: string }>(`${DRIVE_API}/files`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  return res.id;
}

export async function copyFileToFolder(
  fileId: string,
  destFolderId: string,
  token: string
): Promise<void> {
  await driveFetch(`${DRIVE_API}/files/${fileId}/copy`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parents: [destFolderId] }),
  });
}
