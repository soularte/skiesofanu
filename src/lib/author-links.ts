import type { CollectionEntry } from 'astro:content';

/** Resolve only explicit book-page links, never match a story to a same-title collection. */
export function authorBookLinks(hrefs: string[], books: CollectionEntry<'books'>[]) {
  const links: { label: string; url: string }[] = [];
  for (const href of hrefs) {
    const match = href.match(/^\/books\/([^/#]+)\/?(?:#book-(\d+))?$/);
    if (!match) continue;
    const book = books.find(book => book.slug === match[1]);
    const source = match[2] ? book?.data.books?.[Number(match[2]) - 1]?.links : book?.data.links;
    for (const link of source ?? []) {
      if (!links.some(existing => existing.url === link.url)) links.push(link);
    }
  }
  return links;
}
