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
      return await searchFallback({ trackName, artistName, durationSec });
    }
    if (!res.ok) return { synced: null, plain: null };
    const data = await res.json();
    const parsed = parseLyricsResponse(data);
    if (!parsed.synced) {
      const fb = await searchFallback({ trackName, artistName, durationSec });
      if (fb.synced || fb.plain) return fb;
    }
    return parsed;
  } catch (e) {
    console.error('LRCLIB fetch failed', e);
    return { synced: null, plain: null };
  }
}

async function searchFallback({ trackName, artistName, durationSec }) {
  const qs = new URLSearchParams({
    track_name: trackName || '',
    artist_name: artistName || '',
  });
  try {
    const res = await fetch(`${BASE}/search?${qs.toString()}`);
    if (!res.ok) return { synced: null, plain: null };
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) return { synced: null, plain: null };
    const synced = list.filter((x) => x.syncedLyrics);
    if (synced.length === 0) {
      // no synced anywhere → return plain from closest-duration result
      const best = pickClosest(list, durationSec) || list[0];
      return parseLyricsResponse(best);
    }
    // Prefer synced version whose duration is closest to actual track.
    // If gap > 5s, treat as unreliable and fall back to plain (better no scroll than wrong scroll).
    const best = pickClosest(synced, durationSec);
    if (durationSec && best && Math.abs((best.duration || 0) - durationSec) > 5) {
      // synced version's timing won't match → use plain from closest-duration result instead
      const plainBest = pickClosest(list, durationSec) || list[0];
      return { synced: null, plain: plainBest.plainLyrics || null };
    }
    return parseLyricsResponse(best);
  } catch (e) {
    return { synced: null, plain: null };
  }
}

function pickClosest(list, durationSec) {
  if (!durationSec) return list[0];
  let best = null;
  let bestGap = Infinity;
  for (const x of list) {
    const gap = Math.abs((x.duration || 0) - durationSec);
    if (gap < bestGap) { bestGap = gap; best = x; }
  }
  return best;
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
