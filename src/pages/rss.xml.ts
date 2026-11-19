import type { APIRoute } from 'astro';
import { feedTitle, feedDescription, getFeed } from '../lib/feed';

function escapeXml(value: string) {
  return value.replace(/[^\u0009\u000a\u000d\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

export const GET: APIRoute = async ({ site }) => {
  const pageUrl = escapeXml(new URL('/feed/', site).href);
  const rssUrl = escapeXml(new URL('/rss.xml', site).href);
  const entries = await getFeed();
  const items = entries.map(entry => `
    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(new URL(entry.url, site).href)}</link>
      <guid isPermaLink="false">${escapeXml(entry.id)}</guid>
      <pubDate>${new Date(entry.date).toUTCString()}</pubDate>
      <category>${escapeXml(entry.source)}</category>
      <description>${escapeXml(entry.description.split('\n').map(escapeXml).join('<br />'))}</description>
    </item>`).join('');

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${pageUrl}</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>ru</language>
    <atom:link href="${rssUrl}" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
