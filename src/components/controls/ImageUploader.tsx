
import { useWallpaperStore } from "@/store/wallpaperStore";
import { useRef } from "react";

export default function ImageUploader() {
  const { setImageUrl } = useWallpaperStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-cyan-400 uppercase tracking-widest">Background Image</span>
      <button
        onClick={() => inputRef.current?.click()}
        className="px-3 py-1 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
      >
        Upload Image
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}
