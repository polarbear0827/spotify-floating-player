import React, { useEffect, useState } from 'react';

export default function TitleBar({ onSettings, hideSettings = false }) {
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    window.api.window.isAlwaysOnTop().then(setPinned);
  }, []);

  const togglePin = async () => {
    const next = await window.api.window.toggleAlwaysOnTop();
    setPinned(next);
  };

  return (
    <div className="drag flex items-center justify-between px-3 py-1.5 select-none">
      <div className="text-xs text-white/40 tracking-wider">SPOTIFY · MINI</div>
      <div className="no-drag flex items-center gap-1">
        {!hideSettings && (
          <IconBtn title="設定" onClick={onSettings}>
            <GearIcon />
          </IconBtn>
        )}
        <IconBtn
          title={pinned ? '取消置頂' : '置頂'}
          onClick={togglePin}
          active={pinned}
        >
          <PinIcon />
        </IconBtn>
        <IconBtn title="最小化" onClick={() => window.api.window.minimize()}>
          <MinIcon />
        </IconBtn>
        <IconBtn title="關閉" onClick={() => window.api.window.close()} hover="hover:bg-red-500/70">
          <CloseIcon />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title, active = false, hover = 'hover:bg-white/10' }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${hover} ${
        active ? 'text-spotify-green' : 'text-white/70'
      }`}
    >
      {children}
    </button>
  );
}

const GearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 9V4l1-1V2H7v1l1 1v5l-2 2v2h5.2v6l.8 1 .8-1v-6H18v-2l-2-2z"/>
  </svg>
);

const MinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12"><rect x="2" y="6" width="8" height="1" fill="currentColor"/></svg>
);

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/></svg>
);
