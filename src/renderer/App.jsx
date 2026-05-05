import React, { useEffect, useState, useCallback } from 'react';
import TitleBar from './components/TitleBar.jsx';
import NowPlaying from './components/NowPlaying.jsx';
import Lyrics from './components/Lyrics.jsx';
import Progress from './components/Progress.jsx';
import Controls from './components/Controls.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import Login from './components/Login.jsx';
import { fetchLyrics } from './lib/lrclib.js';
import {
  getValidAccessToken,
  getCurrentlyPlaying,
  play, pause, next, previous, seek,
  logout,
} from './lib/spotify.js';

const POLL_INTERVAL = 3000; // ms — Spotify rate-limits aggressive polling

export default function App() {
  const [clientId, setClientId] = useState('');
  const [hasTokens, setHasTokens] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [track, setTrack] = useState(null); // { id, name, artists, album, durationMs }
  const [progressMs, setProgressMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lyrics, setLyrics] = useState({ synced: null, plain: null });
  const [lyricsLoading, setLyricsLoading] = useState(false);

  // Init: load clientId & token state
  useEffect(() => {
    (async () => {
      const cid = await window.api.config.get('clientId');
      const tokens = await window.api.config.get('tokens');
      setClientId(cid || '');
      setHasTokens(!!tokens);
    })();
  }, []);

  // Polling current playback
  useEffect(() => {
    if (!clientId || !hasTokens) return;
    let cancelled = false;
    let lastTrackId = null;
    let timeoutId = null;
    let consecutive429 = 0;

    const tick = async () => {
      let nextDelay = POLL_INTERVAL;
      try {
        const token = await getValidAccessToken(clientId);
        if (!token) {
          setHasTokens(false);
          return;
        }
        const data = await getCurrentlyPlaying(token);
        if (cancelled) return;
        consecutive429 = 0;

        if (!data || !data.item) {
          setTrack(null);
          setIsPlaying(false);
          setProgressMs(0);
          lastTrackId = null;
          setLyrics({ synced: null, plain: null });
        } else {
          const item = data.item;
          const newTrack = {
            id: item.id,
            name: item.name,
            artists: (item.artists || []).map((a) => a.name).join(', '),
            album: item.album?.name,
            albumArt: item.album?.images?.[0]?.url,
            durationMs: item.duration_ms,
          };
          setTrack(newTrack);
          setProgressMs(data.progress_ms || 0);
          setIsPlaying(!!data.is_playing);

          if (item.id !== lastTrackId) {
            lastTrackId = item.id;
            setLyrics({ synced: null, plain: null });
            setLyricsLoading(true);
            fetchLyrics({
              trackName: item.name,
              artistName: item.artists?.[0]?.name,
              albumName: item.album?.name,
              durationSec: item.duration_ms / 1000,
            }).then((l) => {
              if (!cancelled) {
                setLyrics(l);
                setLyricsLoading(false);
              }
            });
          }
        }
      } catch (e) {
        if (e.status === 429) {
          consecutive429 += 1;
          // Spotify's retry-after often understates; use exponential floor
          const headerWait = (e.retryAfter || 5) * 1000;
          const expWait = Math.min(60000, 15000 * Math.pow(2, consecutive429 - 1));
          nextDelay = Math.max(headerWait, expWait);
          console.warn(`Rate-limited (#${consecutive429}), backing off ${nextDelay}ms`);
        } else {
          console.error('poll error', e);
        }
      } finally {
        if (!cancelled) timeoutId = setTimeout(tick, nextDelay);
      }
    };

    tick();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [clientId, hasTokens]);

  // Local progress smoothing (advance progress between API polls when playing)
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setProgressMs((p) => (track ? Math.min(p + 250, track.durationMs) : p));
    }, 250);
    return () => clearInterval(id);
  }, [isPlaying, track]);

  // -------- control handlers --------
  const withToken = useCallback(
    async (fn) => {
      const token = await getValidAccessToken(clientId);
      if (!token) return;
      try { await fn(token); } catch (e) { console.error(e); }
    },
    [clientId]
  );

  const handlePlayPause = () => withToken((t) => (isPlaying ? pause(t) : play(t)));
  const handleNext = () => withToken((t) => next(t));
  const handlePrev = () => withToken((t) => previous(t));
  const handleSeek = (ms) => {
    setProgressMs(ms);
    withToken((t) => seek(t, ms));
  };

  const handleLoginSuccess = async () => {
    setHasTokens(true);
  };

  const handleLogout = async () => {
    await logout();
    setHasTokens(false);
  };

  // -------- render --------
  if (!clientId || !hasTokens) {
    return (
      <div className="h-screen w-screen">
        <div className="glass h-full w-full flex flex-col">
          <TitleBar onSettings={() => {}} hideSettings />
          <div className="flex-1 flex items-center justify-center p-6 no-drag">
            <Login
              clientId={clientId}
              onSaveClientId={async (cid) => {
                await window.api.config.set('clientId', cid);
                setClientId(cid);
              }}
              onLoginSuccess={handleLoginSuccess}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <div className="glass h-full w-full flex flex-col overflow-hidden relative">
        <TitleBar onSettings={() => setShowSettings((s) => !s)} />

        {/* Section 1: Track info — fixed height */}
        <NowPlaying track={track} />

        {/* Section 2: Lyrics — flexible */}
        <Lyrics
          lyrics={lyrics}
          loading={lyricsLoading}
          progressMs={progressMs}
          hasTrack={!!track}
        />

        {/* Section 3: Progress — fixed */}
        <Progress
          progressMs={progressMs}
          durationMs={track?.durationMs || 0}
          onSeek={handleSeek}
          disabled={!track}
        />

        {/* Section 4: Controls — fixed */}
        <Controls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          disabled={!track}
        />

        {/* Settings overlay */}
        {showSettings && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            onLogout={handleLogout}
            clientId={clientId}
            onChangeClientId={async (cid) => {
              await window.api.config.set('clientId', cid);
              setClientId(cid);
            }}
          />
        )}
      </div>
    </div>
  );
}
