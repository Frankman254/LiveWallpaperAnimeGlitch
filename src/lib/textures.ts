import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();

export async function loadTexture(url: string): Promise<THREE.Texture> {
  if (cache.has(url)) return cache.get(url)!;

  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        cache.set(url, texture);
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

export function disposeTexture(url: string): void {
  const texture = cache.get(url);
  if (texture) {
    texture.dispose();
    cache.delete(url);
  }
}
