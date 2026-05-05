import React, { useEffect, useRef, useState, useMemo } from 'react';

const LINE_HEIGHT = 32; // px per lyric line

export default function Lyrics({ lyrics, loading, progressMs, hasTrack }) {
  const containerRef = useRef(null);
  const [containerH, setContainerH] = useState(0);

  // observe container height (responsive)
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerH(entry.contentRect.height);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const synced = lyrics?.synced;
  const plain = lyrics?.plain;
  const progressSec = progressMs / 1000;

  // Find current line index
  const currentIndex = useMemo(() => {
    if (!synced || synced.length === 0) return -1;
    let lo = 0, hi = synced.length - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (synced[mid].time <= progressSec) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans;
  }, [synced, progressSec]);

  // ---- Render states ----
  if (!hasTrack) {
    return (
      <div ref={containerRef} className="flex-1 min-h-0 flex items-center justify-center text-white/30 text-sm px-4">
        — 等待播放 —
      </div>
    );
  }

  if (loading) {
    return (
      <div ref={containerRef} className="flex-1 min-h-0 flex items-center justify-center text-white/30 text-sm px-4">
        正在載入歌詞…
      </div>
    );
  }

  if (!synced && !plain) {
    return (
      <div ref={containerRef} className="flex-1 min-h-0 flex items-center justify-center text-white/30 text-sm px-4">
        無歌詞
      </div>
    );
  }

  // Plain (no timing) — show centered scrollable
  if (!synced && plain) {
    return (
      <div ref={containerRef} className="flex-1 min-h-0 overflow-auto no-scrollbar px-4 text-center text-white/70 text-sm leading-relaxed py-2">
        {plain.split(/\r?\n/).map((line, i) => (
          <div key={i} className="py-0.5">{line || '\u00A0'}</div>
        ))}
      </div>
    );
  }

  // Synced lyrics: vertically center current line, others extend up & down.
  // translateY = (containerH/2) - (currentIndex * LINE_HEIGHT) - (LINE_HEIGHT/2)
  const offsetY = containerH / 2 - (currentIndex < 0 ? 0 : currentIndex) * LINE_HEIGHT - LINE_HEIGHT / 2;

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-hidden relative px-4"
    >
      {/* fade masks top & bottom */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-spotify-dark/80 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-spotify-dark/80 to-transparent z-10" />

      <div
        className="text-center will-change-transform"
        style={{
          transform: `translateY(${offsetY}px)`,
          transition: 'transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      >
        {synced.map((line, i) => {
          const isCurrent = i === currentIndex;
          const distance = Math.abs(i - currentIndex);
          let cls = 'text-white/30';
          if (isCurrent) cls = 'text-white font-bold scale-105';
          else if (distance === 1) cls = 'text-white/55';
          else if (distance === 2) cls = 'text-white/40';
          return (
            <div
              key={i}
              className={`flex items-center justify-center transition-all duration-300 ${cls}`}
              style={{
                height: `${LINE_HEIGHT}px`,
                fontSize: isCurrent ? '15px' : '13px',
              }}
            >
              <span className="px-2 truncate max-w-full">{line.text || '\u266A'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
