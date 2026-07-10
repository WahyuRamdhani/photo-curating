export default function SetupNotice() {
  return (
    <div className="max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
      <h2 className="mb-2 font-semibold">One-time setup needed</h2>
      <p className="mb-2">
        This app runs entirely under your own Google account — it needs a free
        Google Cloud OAuth client ID and API key before it can talk to Drive.
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          Create a project at{" "}
          <span className="font-mono">console.cloud.google.com</span> (free).
        </li>
        <li>Enable the &quot;Google Drive API&quot; and &quot;Google Picker API&quot;.</li>
        <li>
          Create an OAuth 2.0 Client ID (type: Web application) and an API key
          under &quot;APIs &amp; Services &gt; Credentials&quot;.
        </li>
        <li>
          Add your dev URL (e.g. <span className="font-mono">http://localhost:3000</span>)
          to the OAuth client&apos;s authorized JavaScript origins.
        </li>
        <li>
          Copy <span className="font-mono">.env.local.example</span> to{" "}
          <span className="font-mono">.env.local</span> and fill in{" "}
          <span className="font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</span> and{" "}
          <span className="font-mono">NEXT_PUBLIC_GOOGLE_API_KEY</span>.
        </li>
        <li>
          (Optional, for smart scoring) Get a free key at{" "}
          <span className="font-mono">aistudio.google.com/apikey</span> and set{" "}
          <span className="font-mono">GEMINI_API_KEY</span> in the same file.
        </li>
      </ol>
      <p className="mt-2">Restart the dev server after editing the file.</p>
    </div>
  );
}
