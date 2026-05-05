// LRCLIB lyrics client
// API docs: https://lrclib.net/docs

const BASE = 'https://lrclib.net/api';

/**
 * Fetch synced lyrics for a track.
 * @param {object} params { trackName, artistName, albumName, durationSec }
 * @returns {Promise<{ synced: Array<{time:number,text:string}> | null, plain: string | null }>}
 */
export async function fetchLyrics({ trackName, artistName, albumName, durationSec }) {
  const qs = new URLSearchParams({
    track_name: trackName || '',
    artist_name: artistName || '',
  });
  if (albumName) qs.set('album_name', albumName);
  if (durationSec) qs.set('duration', String(Math.round(durationSec)));

  try {
    const res = await fetch(`${BASE}/get?${qs.toString()}`, {
      headers: { 'User-Agent': 'spotify-floating-player (https://github.com/polarbear0827/spotify-floating-player)' },
    });
    if (res.status === 404) {
      // Try search fallback
      return await searchFallback({ trackName, artistName });
    }
    if (!res.ok) return { synced: null, plain: null };
    const data = await res.json();
    const parsed = parseLyricsResponse(data);
    // If /get returned only plain lyrics, try /search to find a version with synced lyrics
    if (!parsed.synced) {
      const fb = await searchFallback({ trackName, artistName });
      if (fb.synced) return fb;
    }
    return parsed;
  } catch (e) {
    console.error('LRCLIB fetch failed', e);
    return { synced: null, plain: null };
  }
}

async function searchFallback({ trackName, artistName }) {
  const qs = new URLSearchParams({
    track_name: trackName || '',
    artist_name: artistName || '',
  });
  try {
    const res = await fetch(`${BASE}/search?${qs.toString()}`);
    if (!res.ok) return { synced: null, plain: null };
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) return { synced: null, plain: null };
    // pick first with syncedLyrics
    const best = list.find((x) => x.syncedLyrics) || list[0];
    return parseLyricsResponse(best);
  } catch (e) {
    return { synced: null, plain: null };
  }
}

function parseLyricsResponse(data) {
  const synced = data.syncedLyrics ? parseLrc(data.syncedLyrics) : null;
  const plain = data.plainLyrics || null;
  return { synced, plain };
}

/**
 * Parse LRC text into [{time: secondsFloat, text: string}]
 */
function parseLrc(lrcText) {
  const lines = lrcText.split(/\r?\n/);
  const out = [];
  const re = /\[(\d+):(\d+)(?:\.(\d+))?\]/g;
  for (const line of lines) {
    let match;
    const stamps = [];
    let lastIndex = 0;
    re.lastIndex = 0;
    while ((match = re.exec(line)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const frac = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) / 1000 : 0;
      stamps.push(min * 60 + sec + frac);
      lastIndex = re.lastIndex;
    }
    if (stamps.length === 0) continue;
    const text = line.slice(lastIndex).trim();
    for (const t of stamps) {
      out.push({ time: t, text });
    }
  }
  out.sort((a, b) => a.time - b.time);
  return out;
}
