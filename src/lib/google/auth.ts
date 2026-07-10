import { loadScript } from "./loadScript";

// Narrowest scope that still lets the app read files/folders the user
// explicitly picks via Google Picker, and read/write files it creates itself
// (the "Selected" output folder). No broad Drive access is ever requested.
const SCOPE = "https://www.googleapis.com/auth/drive.file";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken: (opts?: { prompt?: string }) => void };
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

let cachedToken: string | null = null;

export async function ensureGisLoaded(): Promise<void> {
  await loadScript("https://accounts.google.com/gsi/client");
}

export function getCachedToken(): string | null {
  return cachedToken;
}

export function signOut(): void {
  if (cachedToken && window.google) {
    window.google.accounts.oauth2.revoke(cachedToken, () => {});
  }
  cachedToken = null;
}

export async function requestAccessToken(clientId: string): Promise<string> {
  await ensureGisLoaded();
  if (!window.google) throw new Error("Google Identity Services failed to load");

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error ?? "Authorization failed"));
          return;
        }
        cachedToken = resp.access_token;
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: cachedToken ? "" : "consent" });
  });
}
