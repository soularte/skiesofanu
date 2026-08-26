import type { ImageMetadata } from 'astro';

// Жадно импортируем все изображения из src/assets/images.
// Ключ — путь относительно src/assets/images, без ведущего слэша.
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{jpg,jpeg,png,webp,avif,gif,svg}',
  { eager: true }
);

const byKey = new Map<string, ImageMetadata>();
for (const [absPath, mod] of Object.entries(modules)) {
  const relative = absPath.replace('/src/assets/images/', '');
  byKey.set(relative, mod.default);
  // Также индексируем по имени файла (для случаев, когда подпапка
  // подразумевается контекстом — например, photo: "lem.jpg" в книге).
  const filename = relative.split('/').pop();
  if (filename && !byKey.has(filename)) {
    byKey.set(filename, mod.default);
  }
}

/**
 * Получить ImageMetadata по относительному пути (или имени файла).
 * Поддерживает пути вида:
 *   - "01 Авиаторы Его Величества.jpg" (на корне)
 *   - "authors/kk.jpg"
 *   - "characters/lem.jpg"
 * Возвращает undefined, если файла нет.
 */
export function findImage(path: string): ImageMetadata | undefined {
  return byKey.get(path);
}

/**
 * Получить все изображения из указанной подпапки src/assets/images/.
 * Возвращает массив { path, image } отсортированный по имени файла.
 */
export function findImagesInFolder(folder: string): { path: string; image: ImageMetadata }[] {
  const prefix = folder.endsWith('/') ? folder : folder + '/';
  const results: { path: string; image: ImageMetadata }[] = [];
  for (const [key, meta] of byKey.entries()) {
    if (key.startsWith(prefix) && !key.slice(prefix.length).includes('/')) {
      results.push({ path: key, image: meta });
    }
  }
  return results.sort((a, b) => a.path.localeCompare(b.path));
}
