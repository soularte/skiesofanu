/** Remember each recording independently; unavailable storage must never stop playback. */
export function rememberAudioProgress(player: HTMLAudioElement) {
  const source = player.querySelector('source')?.getAttribute('src');
  if (!source) return;
  const key = `music-progress:v1:${source}`;
  let saved = 0;
  try {
    const value = Number(localStorage.getItem(key));
    if (Number.isFinite(value) && value > 0) saved = value;
  } catch { /* Browser storage may be disabled. */ }

  let restored = saved === 0;
  const restore = () => {
    if (restored || !Number.isFinite(player.duration) || player.duration <= 0) return;
    try {
      player.currentTime = saved < player.duration ? saved : 0;
      restored = true;
    } catch { /* Retry when the media becomes seekable. */ }
  };
  let lastWrite = 0;
  const save = () => {
    if (!restored || !Number.isFinite(player.currentTime)) return;
    try {
      if (player.ended || player.currentTime <= 0) localStorage.removeItem(key);
      else localStorage.setItem(key, String(player.currentTime));
      lastWrite = Date.now();
    } catch { /* Playback still works without persistence. */ }
  };

  player.addEventListener('loadedmetadata', restore);
  player.addEventListener('canplay', restore);
  if (saved > 0) {
    // Fetch metadata only for recordings with a saved listening position.
    player.preload = 'metadata';
    if (player.readyState >= 1) restore();
  }
  player.addEventListener('timeupdate', () => {
    if (Date.now() - lastWrite >= 3000) save();
  });
  ['pause', 'seeked', 'ended'].forEach(event => player.addEventListener(event, save));
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
  });
}
