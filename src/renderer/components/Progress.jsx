import React, { useRef } from 'react';

function fmt(ms) {
  if (!ms || ms < 0) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function Progress({ progressMs, durationMs, onSeek, disabled }) {
  const barRef = useRef(null);
  const pct = durationMs > 0 ? Math.min(100, (progressMs / durationMs) * 100) : 0;

  const handleClick = (e) => {
    if (disabled || !barRef.current || !durationMs) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, ratio)) * durationMs);
  };

  return (
    <div className="px-4 py-1.5 flex items-center gap-2 text-[10px] text-white/60" style={{ minHeight: 32 }}>
      <span className="w-9 text-right tabular-nums">{fmt(progressMs)}</span>
      <div
        ref={barRef}
        onClick={handleClick}
        className={`flex-1 h-1 bg-white/15 rounded-full relative ${disabled ? 'cursor-not-allowed' : 'cursor-pointer group'}`}
      >
        <div
          className="h-full bg-white rounded-full group-hover:bg-spotify-green transition-colors"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${pct}% - 5px)` }}
        />
      </div>
      <span className="w-9 tabular-nums">{fmt(durationMs)}</span>
    </div>
  );
}
