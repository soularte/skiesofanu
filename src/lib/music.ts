export function trackAnchor(bookSlug: string, src: string) {
  return `${bookSlug}-${src.split('/').pop()!.replace(/\.[^.]+$/, '')}`;
}

export function audioMime(src: string) {
  const extension = src.split('.').pop()?.toLowerCase();
  return ({ mp3: 'audio/mpeg', m4a: 'audio/mp4', ogg: 'audio/ogg', wav: 'audio/wav', flac: 'audio/flac', aac: 'audio/aac' } as Record<string, string>)[extension ?? ''] ?? 'audio/mpeg';
}

export function normalizeTrackSearch(value: string) {
  return value.toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
