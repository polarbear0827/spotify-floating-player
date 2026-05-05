import React from 'react';

export default function NowPlaying({ track }) {
  return (
    <div className="px-4 pt-1 pb-2 flex items-center gap-3" style={{ minHeight: 56 }}>
      {track?.albumArt ? (
        <img
          src={track.albumArt}
          alt=""
          className="w-10 h-10 rounded-md object-cover flex-shrink-0 shadow-md"
        />
      ) : (
        <div className="w-10 h-10 rounded-md bg-white/5 flex-shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold truncate">
          {track?.name || '目前沒有播放'}
        </div>
        <div className="text-xs text-white/60 truncate">
          {track?.artists || '\u00A0'}
        </div>
      </div>
    </div>
  );
}
