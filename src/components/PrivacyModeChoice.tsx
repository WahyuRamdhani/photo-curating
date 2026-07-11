import { useState } from "react";

export default function PrivacyModeChoice({
  shortlistCount,
  apiKey,
  onApiKeyChange,
  hasServerKey,
  onChoosePrivate,
  onChooseSmart,
}: {
  shortlistCount: number;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  hasServerKey: boolean;
  onChoosePrivate: () => void;
  onChooseSmart: () => void;
}) {
  const [expandSmart, setExpandSmart] = useState(false);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
        <h3 className="font-semibold text-green-900 dark:text-green-200">
          Private review — recommended for sensitive photos
        </h3>
        <p className="mt-1 flex-1 text-sm text-green-800 dark:text-green-300">
          Nothing leaves your browser. You review the {shortlistCount} shortlisted photos
          yourself against the brief, using only the local checks already run (blur,
          orientation, closed eyes, duplicates, avoid-list tags).
        </p>
        <button
          onClick={onChoosePrivate}
          className="mt-3 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
        >
          Use private review
        </button>
      </div>

      <div className="flex flex-col rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <h3 className="font-semibold text-amber-900 dark:text-amber-200">
          Smart scoring — faster, sends thumbnails to Google
        </h3>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
          Downsized thumbnails of the {shortlistCount} shortlisted photos are sent to
          Gemini&apos;s free API to score against the shoot brief (professionalism, framing,
          candid/posed rules).
        </p>
        {!expandSmart ? (
          <button
            onClick={() => setExpandSmart(true)}
            className="mt-3 rounded border border-amber-400 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900"
          >
            Use smart scoring
          </button>
        ) : (
          <div className="mt-3 space-y-2 rounded border border-amber-400 bg-amber-100 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-200">
            <p>
              Google&apos;s <strong>free tier</strong> API terms have historically allowed
              submitted content to be used to improve their products (unlike the paid
              tier&apos;s stricter no-training terms). If these are photos of real,
              identifiable people who haven&apos;t consented to that, use private review
              instead.
            </p>
            <div>
              <label className="mb-1 block font-medium" htmlFor="gemini-key">
                Your own free Gemini API key (recommended)
              </label>
              <input
                id="gemini-key"
                type="password"
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="Paste your key from aistudio.google.com/apikey"
                className="w-full rounded border border-amber-400 bg-white px-2 py-1 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
              />
              <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
                Stored only in your browser (never sent anywhere except directly to Google
                for scoring). Using your own key means this run counts against{" "}
                <strong>your</strong> free quota, not anyone else&apos;s.
                {hasServerKey && !apiKey && (
                  <> Leave blank to use the app&apos;s shared key instead — that shares quota with everyone else using this app.</>
                )}
              </p>
            </div>
            <button
              onClick={onChooseSmart}
              disabled={!apiKey && !hasServerKey}
              className="w-full rounded bg-amber-700 px-3 py-2 font-medium text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              I understand — send thumbnails to Google
            </button>
            {!apiKey && !hasServerKey && (
              <p className="text-[11px] text-red-700 dark:text-red-400">
                No key available — paste your own free key above to continue.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
