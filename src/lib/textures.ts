import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();

function finalizeTexture(texture: THREE.Texture): THREE.Texture {
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.premultiplyAlpha = false;
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.generateMipmaps = false;
	texture.needsUpdate = true;
	return texture;
}

function loadTextureWithImage(url: string): Promise<THREE.Texture> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.decoding = 'async';
		image.onload = () => {
			try {
				const width = image.naturalWidth || image.width;
				const height = image.naturalHeight || image.height;
				const canvas = document.createElement('canvas');
				canvas.width = Math.max(1, width);
				canvas.height = Math.max(1, height);
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('2d-context-unavailable'));
					return;
				}
				ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
				resolve(finalizeTexture(new THREE.CanvasTexture(canvas)));
			} catch (error) {
				reject(error);
			}
		};
		image.onerror = () => reject(new Error(`image-load-failed:${url}`));
		image.src = url;
	});
}

function loadTextureWithThree(url: string): Promise<THREE.Texture> {
	return new Promise((resolve, reject) => {
		new THREE.TextureLoader().load(
			url,
			texture => resolve(finalizeTexture(texture)),
			undefined,
			reject
		);
	});
}

export async function loadTexture(url: string): Promise<THREE.Texture> {
	if (cache.has(url)) return cache.get(url)!;

	try {
		const texture = await loadTextureWithImage(url);
		cache.set(url, texture);
		return texture;
	} catch {
		const texture = await loadTextureWithThree(url);
		cache.set(url, texture);
		return texture;
	}
}

export function disposeTexture(url: string): void {
	const texture = cache.get(url);
	if (texture) {
		texture.dispose();
		cache.delete(url);
	}
}
