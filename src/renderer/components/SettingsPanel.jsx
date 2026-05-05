import React, { useEffect, useState } from 'react';

export default function SettingsPanel({ onClose, onLogout, clientId, onChangeClientId }) {
  const [opacity, setOpacity] = useState(100);
  const [editingClientId, setEditingClientId] = useState(false);
  const [cidInput, setCidInput] = useState(clientId || '');

  useEffect(() => {
    window.api.config.get('opacity').then((v) => {
      setOpacity(Math.round((v ?? 1) * 100));
    });
  }, []);

  const handleOpacity = (e) => {
    const pct = parseInt(e.target.value, 10);
    setOpacity(pct);
    // Map slider 0-90 (UI) -> opacity 1.0 -> 0.1
    // User wants "0% to 90% transparency" — i.e., window opacity 1.0 down to 0.1
    const winOpacity = Math.max(0.1, 1 - pct / 100);
    window.api.window.setOpacity(winOpacity);
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4 no-drag"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-spotify-dark/95 border border-white/10 rounded-xl p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">設定</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none">×</button>
        </div>

        {/* Opacity */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-white/70">視窗透明度</label>
            <span className="text-xs text-spotify-green tabular-nums">{opacity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="5"
            value={opacity}
            onChange={handleOpacity}
            className="slider w-full"
          />
          <div className="flex justify-between text-[10px] text-white/40 mt-1">
            <span>0%</span><span>90%</span>
          </div>
        </div>

        {/* Client ID */}
        <div className="mb-5">
          <label className="text-xs text-white/70 block mb-2">Spotify Client ID</label>
          {!editingClientId ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-white/60 bg-black/30 rounded px-2 py-1.5 truncate">
                {clientId || '（未設定）'}
              </code>
              <button
                onClick={() => { setCidInput(clientId); setEditingClientId(true); }}
                className="text-xs text-spotify-green hover:underline"
              >
                修改
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={cidInput}
                onChange={(e) => setCidInput(e.target.value)}
                className="flex-1 text-xs bg-black/40 rounded px-2 py-1.5 text-white border border-white/10 focus:outline-none focus:border-spotify-green"
                placeholder="32 字元 Client ID"
              />
              <button
                onClick={async () => {
                  await onChangeClientId(cidInput.trim());
                  setEditingClientId(false);
                }}
                className="text-xs text-spotify-green hover:underline"
              >
                儲存
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="border-t border-white/10 pt-4">
          <button
            onClick={async () => { await onLogout(); onClose(); }}
            className="w-full py-2 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors"
          >
            登出 Spotify
          </button>
        </div>

        <div className="text-[10px] text-white/30 text-center mt-4">
          Spotify Floating Player · v0.1.0
        </div>
      </div>
    </div>
  );
}
