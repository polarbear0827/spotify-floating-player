import React from 'react';

export default function Controls({ isPlaying, onPlayPause, onNext, onPrev, disabled }) {
  return (
    <div className="px-4 pb-3 pt-1 flex items-center justify-center gap-6" style={{ minHeight: 56 }}>
      <Btn onClick={onPrev} disabled={disabled} title="上一首">
        <PrevIcon />
      </Btn>
      <Btn onClick={onPlayPause} disabled={disabled} title={isPlaying ? '暫停' : '播放'} primary>
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </Btn>
      <Btn onClick={onNext} disabled={disabled} title="下一首">
        <NextIcon />
      </Btn>
    </div>
  );
}

function Btn({ children, onClick, disabled, title, primary }) {
  if (primary) {
    return (
      <button
        title={title}
        onClick={onClick}
        disabled={disabled}
        className={`w-10 h-10 rounded-full flex items-center justify-center bg-white text-black hover:scale-105 transition-transform ${
          disabled ? 'opacity-40 cursor-not-allowed hover:scale-100' : ''
        }`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition ${
        disabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''
      }`}
    >
      {children}
    </button>
  );
}

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2.5v11l11-5.5z"/></svg>
);
const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="3.5" height="12"/><rect x="9.5" y="2" width="3.5" height="12"/></svg>
);
const PrevIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="2" height="12"/><path d="M14 2v12L5 8z"/></svg>
);
const NextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="12" y="2" width="2" height="12"/><path d="M2 2v12l9-6z"/></svg>
);
