import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parse, type DefaultTreeAdapterMap } from 'parse5';
import updates from '../data/site-updates.json';
import telegramSnapshot from '../data/telegram-feed.json';

export const feedTimeZone = 'Europe/Madrid';

export const feedTitle = 'Лента «Небес Ану»';
export const feedDescription = 'Публикации из соцсетей и последние изменения на сайте.';

type Entry = { id: string; title: string; description: string; date: string; url: string; source: string };
type Node = DefaultTreeAdapterMap['node'];

function find(node: Node, selector: (node: Node) => boolean): Node[] {
  return [
    ...(selector(node) ? [node] : []),
    ...('childNodes' in node ? node.childNodes.flatMap(child => find(child, selector)) : []),
  ];
}

function attr(node: Node | undefined, name: string) {
  return node && 'attrs' in node ? node.attrs.find(a => a.name === name)?.value : undefined;
}

function byClass(node: Node, name: string) {
  return find(node, item => !!attr(item, 'class')?.split(/\s+/).includes(name));
}

function content(node?: Node): string {
  if (!node) return '';
  if ('value' in node) return node.value;
  if ('tagName' in node && ['br', 'p', 'div'].includes(node.tagName)) {
    return node.childNodes.map(content).join('') + ' ';
  }
  return 'childNodes' in node ? node.childNodes.map(content).join('') : '';
}

function brief(text: string, max = 320) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const prefix = clean.slice(0, max - 1);
  const boundary = prefix.lastIndexOf(' ');
  return (boundary > 0 ? prefix.slice(0, boundary) : prefix) + '…';
}

async function fetchPublic(url: URL | string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}

function social(source: string, url: string, date: string, text: string, title?: string): Entry {
  return { id: url, url, date, source, title: brief(title || text, title ? 90 : 48) || 'Публикация', description: brief(text) };
}

async function telegram() {
  const page = parse(await (await fetchPublic('https://t.me/s/skiesofanu')).text());
  return byClass(page, 'tgme_widget_message').flatMap(post => {
    const url = attr(byClass(post, 'tgme_widget_message_date')[0], 'href');
    const date = attr(find(post, node => 'tagName' in node && node.tagName === 'time')[0], 'datetime');
    if (!url || !/^https:\/\/t\.me\/skiesofanu\/\d+$/.test(url) || !date) return [];
    return [social('Telegram', url, date, content(byClass(post, 'tgme_widget_message_text')[0]))];
  });
}

async function pikabu() {
  const response = await fetchPublic('https://pikabu.ru/@ViZet85');
  const charset = response.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1] || 'utf-8';
  const page = parse(new TextDecoder(charset).decode(await response.arrayBuffer()));
  return byClass(page, 'story__main').flatMap(post => {
    const heading = byClass(post, 'story__title')[0];
    const link = heading && find(heading, node => 'tagName' in node && node.tagName === 'a')[0];
    const href = attr(link, 'href');
    const date = attr(find(post, node => 'tagName' in node && node.tagName === 'time')[0], 'datetime');
    if (!href || !date) return [];
    const url = new URL(href, 'https://pikabu.ru');
    if (url.origin !== 'https://pikabu.ru' || !url.pathname.startsWith('/story/')) return [];
    return [social('Пикабу', url.href, date, content(byClass(post, 'story__content-inner')[0]), content(link))];
  });
}

async function dzen() {
  const endpoint = 'https://dzen.ru/api/v3/launcher/export?channel_name=skiesofanu.ru&tab=articles';
  const { items } = await (await fetchPublic(endpoint)).json() as {
    items?: {
      publisher_id?: string;
      share_link?: string;
      publication_date?: string;
      title?: string;
      text?: string;
    }[];
  };
  return (items ?? []).flatMap(post => {
    if (post.publisher_id !== '61800b6bbc90d54cb8f056dd' ||
        !post.share_link || !/^https:\/\/dzen\.ru\/a\/[\w-]+$/.test(post.share_link) ||
        !post.publication_date || !post.title) return [];
    const date = new Date(Number(post.publication_date) * 1000);
    if (!Number.isFinite(date.getTime())) return [];
    return [social('Дзен', post.share_link, date.toISOString(), post.text ?? '', post.title)];
  });
}

async function vk(token: string) {
  const body = new URLSearchParams({
    domain: 'skiesofanu', filter: 'owner', count: '15', v: '5.199', access_token: token,
  });
  const response = await fetch('https://api.vk.ru/method/wall.get', {
    method: 'POST', body, redirect: 'error', signal: AbortSignal.timeout(8000),
  }).catch(error => {
    const causeCode = error?.cause?.code;
    const code = typeof causeCode === 'string' && /^(?:E[A-Z]+|UND_ERR_[A-Z_]+)$/.test(causeCode)
      ? causeCode
      : error?.name === 'TimeoutError' ? 'timeout' : 'request failed';
    throw new Error(`VK connection: ${code}`);
  });
  if (!response.ok) throw new Error(`VK HTTP ${response.status}`);

  const data = await response.json().catch(() => {
    throw new Error('VK returned a non-JSON response');
  }) as {
    error?: { error_code?: number };
    response?: { items: { owner_id: number; id: number; date: number; text: string }[] };
  };
  if (Number.isInteger(data.error?.error_code)) {
    throw new Error(`VK wall.get error code ${data.error!.error_code}`);
  }
  if (!Array.isArray(data.response?.items)) throw new Error('VK returned no wall items');
  return data.response.items.map(post => social('Группа ВК',
    `https://vk.com/wall${post.owner_id}_${post.id}`, new Date(post.date * 1000).toISOString(), post.text ?? ''));
}

const updateSections = [
  [/^src\/(pages\/books\/|content\/(books|lore)\/|components\/book\/)/, 'Каталог и страницы книг'],
  [/^src\/(pages\/blog\/|content\/blog\/)/, 'Блог'],
  [/^src\/(pages\/music\.astro|content\/music\/)/, 'Музыка'],
  [/^src\/(pages\/about\/|content\/authors\/)/, 'Об авторах'],
  [/^src\/pages\/character-map\.astro$/, 'Карта персонажей'],
  [/^src\/(pages\/index\.astro|data\/news\.md)$/, 'Главная страница'],
  [/^src\/(pages\/(feed\.astro|rss\.xml\.ts)|lib\/feed\.ts)$/, 'Лента публикаций'],
  [/^src\/(components\/(Header|Footer|SocialBar)\.astro|data\/links\.md)$/, 'Навигация и внешние ссылки'],
] as const;

function siteUpdates(): Entry[] {
  const history = execFileSync('git', [
    'log', '-20', '--first-parent', '--diff-merges=first-parent', '--name-only',
    '--format=%x1e%H%x1f%cI%x1f%B%x1f',
  ], { encoding: 'utf8' });
  const changes = history.split('\x1e').flatMap(record => {
    const [hash, date, message, paths] = record.trim().split('\x1f');
    if (!date) return [];
    const note = (updates as Record<string, string[]>)[hash];
    const title = note?.[0] || message?.match(/^Site-Update: +(.+)$/m)?.[1];
    const description = note?.[1] || message?.match(/^Site-Update-Details: +(.+)$/m)?.[1] || '';
    const files = paths?.trim().split('\n') ?? [];
    const sections = updateSections.filter(([pattern]) => files.some(file => pattern.test(file)));
    if (!title && !sections.length) return [];
    const firstSection = sections.length === 1 ? sections[0] : undefined;
    return [{
      title: title || (firstSection ? `Обновление раздела «${firstSection[1]}»` : 'Обновление сайта'),
      description: description || (!title && !firstSection ? sections.map(([, label]) => label).join(', ') : ''),
      date,
    }];
  });

  const calendar = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeZone: feedTimeZone });
  const days = new Map<string, typeof changes>();
  for (const change of changes) {
    const day = calendar.format(new Date(change.date));
    const entries = days.get(day) ?? [];
    entries.push(change);
    days.set(day, entries);
  }

  return [...days].map(([day, entries]) => {
    const latest = entries.reduce((a, b) => Date.parse(a.date) > Date.parse(b.date) ? a : b);
    return {
      id: `urn:skiesofanu:day:${day}`,
      title: 'Что изменилось на сайте',
      description: [...new Set(entries.map(({ title, description }) =>
        description ? `${title}. ${description}` : title))].map(line => `• ${line}`).join('\n'),
      date: latest.date,
      url: `/feed/#update-${day}`,
      source: 'Сайт',
    };
  });
}

async function collectFeed() {
  const snapshot = '.feed-cache/posts.json';
  const previous: Entry[] = await readFile(snapshot, 'utf8').then(JSON.parse).catch(() => []);
  const token = process.env.VK_FEED_TOKEN?.trim();
  if (!token && process.env.CI && process.env.GITHUB_EVENT_NAME !== 'pull_request') {
    console.warn('[feed] Группа ВК: VK_FEED_TOKEN is missing');
  }
  const sources = [
    { name: 'Telegram', load: telegram },
    { name: 'Пикабу', load: pikabu },
    { name: 'Дзен', load: dzen },
    ...(token ? [{ name: 'Группа ВК', load: () => vk(token) }] : []),
  ];
  const groups = await Promise.all(sources.map(async ({ name, load }) => {
    try {
      const items = (await load()).filter(item => Number.isFinite(Date.parse(item.date)));
      if (items.length) return items.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 15);
      console.warn(`[feed] ${name}: no readable posts`);
    } catch (error) {
      const reason = error instanceof Error && /^VK (?:connection: |HTTP |wall\.get error code |returned )/.test(error.message)
        ? error.message
        : 'source unavailable';
      console.warn(`[feed] ${name}: ${reason}`);
    }
    const cached = previous.filter(item => item.source === name);
    return cached.length || name !== 'Telegram' ? cached : telegramSnapshot;
  }));
  const external = groups.flat();
  if (process.env.CI) {
    await mkdir('.feed-cache', { recursive: true });
    await writeFile(snapshot, JSON.stringify(external));
  }
  return [...new Map([...external, ...siteUpdates()].map(entry => [entry.id, entry])).values()]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 55);
}

let feed: ReturnType<typeof collectFeed> | undefined;
export function getFeed() {
  return feed ??= collectFeed();
}
