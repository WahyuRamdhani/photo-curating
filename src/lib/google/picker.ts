import { loadScript } from "./loadScript";

declare global {
  interface Window {
    gapi?: {
      load: (mod: string, cb: () => void) => void;
    };
    google2?: unknown;
  }
}

// google.picker lives on the same `google` global as Identity Services,
// but is only populated after gapi's "picker" module loads.
type PickerDoc = { id: string; name: string; mimeType: string };

export interface PickedFolder {
  id: string;
  name: string;
}

export async function ensurePickerLoaded(): Promise<void> {
  await loadScript("https://apis.google.com/js/api.js");
  await new Promise<void>((resolve) => {
    window.gapi!.load("picker", () => resolve());
  });
}

export async function pickFolder(opts: {
  apiKey: string;
  accessToken: string;
}): Promise<PickedFolder | null> {
  await ensurePickerLoaded();

  // google.picker is attached to window.google by the api.js "picker" module,
  // loaded dynamically at runtime — no official types package for it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const google = (window as any).google;

  return new Promise((resolve) => {
    const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
      .setSelectFolderEnabled(true)
      .setIncludeFolders(true)
      .setMimeTypes("application/vnd.google-apps.folder");

    const picker = new google.picker.PickerBuilder()
      .setOAuthToken(opts.accessToken)
      .setDeveloperKey(opts.apiKey)
      .addView(view)
      .setTitle("Select the Drive folder to curate")
      .setCallback(
        (data: {
          action: string;
          docs?: PickerDoc[];
        }) => {
          if (data.action === google.picker.Action.PICKED && data.docs?.length) {
            const doc = data.docs[0];
            resolve({ id: doc.id, name: doc.name });
          } else if (data.action === google.picker.Action.CANCEL) {
            resolve(null);
          }
        }
      )
      .build();
    picker.setVisible(true);
  });
}
