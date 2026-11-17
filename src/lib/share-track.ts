export async function copyTrackLink(url: string): Promise<'copied' | 'manual'> {
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'manual';
  }
}
