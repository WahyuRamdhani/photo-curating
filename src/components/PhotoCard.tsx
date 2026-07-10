import { CuratedPhoto } from "@/types/photo";

export default function PhotoCard({
  item,
  onToggleKeep,
}: {
  item: CuratedPhoto;
  onToggleKeep?: (fileId: string) => void;
}) {
  const { photo, thumbUrl, stage1, stage2, manualKeep } = item;
  const kept = manualKeep ?? (stage2 ? stage2.suggestedKeep : !stage1.rejected);

  return (
    <div
      className={`overflow-hidden rounded-lg border ${
        kept
          ? "border-green-400 dark:border-green-600"
          : "border-gray-200 opacity-60 dark:border-gray-800"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbUrl} alt={photo.name} className="aspect-[3/2] w-full object-cover" />
      <div className="space-y-1 p-2 text-xs">
        <p className="truncate font-medium" title={photo.name}>
          {photo.name}
        </p>
        {stage1.rejected && (
          <p className="text-red-600 dark:text-red-400">{stage1.reasons.join(", ")}</p>
        )}
        {stage1.avoidTags.length > 0 && (
          <p className="text-amber-600 dark:text-amber-400">
            Flagged: {stage1.avoidTags.join(", ")}
          </p>
        )}
        {stage2 && !stage2.error && (
          <p className="text-gray-600 dark:text-gray-300">
            {stage2.framingStyle} · score {stage2.professionalScore}/10
            {stage2.eyeContactIssue ? " · eye-contact issue" : ""}
            {stage2.isSelfieInGroup ? " · selfie?" : ""}
          </p>
        )}
        {stage2?.error && <p className="text-red-600 dark:text-red-400">{stage2.notes}</p>}
        {onToggleKeep && (
          <button
            onClick={() => onToggleKeep(photo.id)}
            className={`mt-1 w-full rounded px-2 py-1 text-xs font-medium ${
              kept
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {kept ? "Keep" : "Rejected — click to keep"}
          </button>
        )}
      </div>
    </div>
  );
}
