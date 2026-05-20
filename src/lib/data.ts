import { readFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

// Build-time cache: each file is parsed only once per build
const cache = new Map<string, { data: unknown; content: string }>();

/**
 * Минимальный парсер markdown → HTML.
 * Поддерживает: **жирный**, *курсив*, [ссылки](url), абзацы (двойной перенос).
 */
export function miniMarkdown(src: string): string {
  if (!src) return '';
  return src
    .split(/\n\n+/)
    .map(para => {
      let html = para.replace(/\n/g, ' ').trim();
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
        // Only allow safe URL protocols
        if (/^(https?:\/\/|\/|#|mailto:)/.test(url)) {
          return `<a href="${url}" class="text-dp-gold-ink border-b border-dp-gold/30 hover:text-dp-gold hover:border-dp-gold transition-colors">${text}</a>`;
        }
        return text;
      });
      return `<p>${html}</p>`;
    })
    .join('');
}

function readAndCache(relativePath: string): { data: unknown; content: string } | null {
  if (cache.has(relativePath)) return cache.get(relativePath)!;
  try {
    const raw = readFileSync(join(process.cwd(), relativePath), 'utf-8');
    const result = matter(raw);
    const entry = { data: result.data, content: result.content.trim() };
    cache.set(relativePath, entry);
    return entry;
  } catch {
    return null;
  }
}

/**
 * Безопасно читает YAML-frontmatter из файла в `src/data/`.
 * При ошибке (отсутствие файла, невалидный YAML) возвращает `fallback`
 * и пишет предупреждение в консоль — сборка не падает.
 */
export function loadDataFile<T>(relativePath: string, fallback: T): T {
  const entry = readAndCache(relativePath);
  if (!entry) {
    console.warn(`[data] Не удалось загрузить ${relativePath}`);
    return fallback;
  }
  return entry.data as T;
}

/**
 * Загружает файл с frontmatter и возвращает и data, и markdown-body (content).
 */
export function loadDataFileWithContent<T>(relativePath: string, fallback: T): { data: T; content: string } {
  const entry = readAndCache(relativePath);
  if (!entry) {
    console.warn(`[data] Не удалось загрузить ${relativePath}`);
    return { data: fallback, content: '' };
  }
  return { data: entry.data as T, content: entry.content };
}
