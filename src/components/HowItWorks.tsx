export default function HowItWorks() {
  return (
    <div className="mb-6 space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
      <p>
        <strong>What this does:</strong> point it at a folder of photos in your
        Google Drive, and it helps you narrow hundreds of them down to the best
        50–100.
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          <strong>Connect Google Drive.</strong> You&apos;ll see Google&apos;s own
          sign-in screen — this only lets the app see the one folder you pick
          next, nothing else.
        </li>
        <li>
          <strong>Pick your photo folder.</strong>
        </li>
        <li>
          <strong>Wait a bit.</strong> It automatically checks every photo for
          blur, closed eyes, and duplicates — just a progress bar, no clicking.
        </li>
        <li>
          <strong>Choose how to finish reviewing:</strong>{" "}
          🟢 <em>Private review</em> — you pick the keepers yourself, nothing
          ever leaves your browser. 🟠 <em>Smart review</em> — the app also
          suggests keep/skip using AI; it&apos;ll ask for your own free API key
          first so it&apos;s optional and never shared photo data without you
          choosing to.
        </li>
        <li>
          <strong>Review the grid</strong> and click any photo to flip it
          between keep/skip.
        </li>
        <li>
          <strong>Click Export.</strong> Your picks are copied into a new
          &quot;Selected&quot; folder in Drive — your originals are never
          touched or deleted.
        </li>
      </ol>
      <p className="text-xs text-blue-800 dark:text-blue-300">
        Safe by design: only the one folder you pick is ever touched, private
        review never sends anything anywhere, and you always end up with a new
        folder of copies — nothing original is changed.
      </p>
    </div>
  );
}
