import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

/**
 * Render a markdown string to HTML.
 */
export function renderMarkdown(md: string): string {
  const result = processor.processSync(md);
  return String(result);
}

export type ContentSegment =
  | { type: 'html'; html: string }
  | { type: 'slot'; name: string };

/**
 * Split markdown body by :::marker lines.
 * Returns an array of segments: text (rendered to HTML) and slot markers.
 * Supported markers: :::books, :::cards, :::gallery, :::featured
 */
export function splitContentByMarkers(body: string): ContentSegment[] {
  const markerRegex = /^:::(books|cards|gallery|featured)\s*$/;
  const lines = body.split('\n');
  const segments: ContentSegment[] = [];
  let buffer: string[] = [];

  function flushBuffer() {
    const text = buffer.join('\n').trim();
    if (text) {
      segments.push({ type: 'html', html: renderMarkdown(text) });
    }
    buffer = [];
  }

  for (const line of lines) {
    const match = line.match(markerRegex);
    if (match) {
      flushBuffer();
      segments.push({ type: 'slot', name: match[1] });
    } else {
      buffer.push(line);
    }
  }
  flushBuffer();

  return segments;
}
