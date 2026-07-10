import { CuratedPhoto } from "@/types/photo";
import PhotoCard from "./PhotoCard";

export default function PhotoGrid({
  items,
  onToggleKeep,
}: {
  items: CuratedPhoto[];
  onToggleKeep?: (fileId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item) => (
        <PhotoCard key={item.photo.id} item={item} onToggleKeep={onToggleKeep} />
      ))}
    </div>
  );
}
