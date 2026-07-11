export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
export const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "";

// Whether the app owner configured a shared GEMINI_API_KEY on the server.
// Purely informational for the UI — the actual key never reaches the client.
export const HAS_SERVER_GEMINI_KEY = process.env.NEXT_PUBLIC_HAS_SERVER_GEMINI_KEY === "true";

export const GEMINI_KEY_STORAGE_KEY = "photo-curator:gemini-api-key";

export const MIN_TARGET = 50;
export const MAX_TARGET = 100;

export function isGoogleConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_API_KEY);
}
