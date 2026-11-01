import type { CollectionEntry } from 'astro:content';

export function compareLoreEntries(a: CollectionEntry<'lore'>, b: CollectionEntry<'lore'>) {
  const first = a.data.order ?? Infinity;
  const second = b.data.order ?? Infinity;
  if (first !== second) return first - second;
  return a.data.title.localeCompare(b.data.title, 'ru');
}
