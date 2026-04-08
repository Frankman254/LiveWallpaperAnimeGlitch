import { useWallpaperStore } from '@/store/wallpaperStore';
import { useRef } from 'react';

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
			<span
				className="text-xs uppercase tracking-widest"
				style={{ color: 'var(--editor-accent-soft)' }}
			>
				Background Image
			</span>
			<button
				onClick={() => inputRef.current?.click()}
				className="px-3 py-1 text-xs rounded border transition-colors"
				style={{
					background: 'var(--editor-button-bg)',
					borderColor: 'var(--editor-button-border)',
					color: 'var(--editor-button-fg)'
				}}
			>
				Upload Image
			</button>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				onChange={handleFile}
				className="hidden"
			/>
		</div>
	);
}
