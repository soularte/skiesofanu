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
