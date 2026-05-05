import React, { useState } from 'react';
import { loginWithPKCE } from '../lib/spotify.js';

export default function Login({ clientId, onSaveClientId, onLoginSuccess }) {
  const [cidInput, setCidInput] = useState(clientId || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const step = clientId ? 'login' : 'clientId';

  const handleSaveCid = async () => {
    const trimmed = cidInput.trim();
    if (trimmed.length < 10) {
      setError('Client ID 看起來不正確');
      return;
    }
    setError('');
    await onSaveClientId(trimmed);
  };

  const handleLogin = async () => {
    setBusy(true);
    setError('');
    try {
      await loginWithPKCE(clientId);
      onLoginSuccess();
    } catch (e) {
      setError(e.message || '登入失敗');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-sm text-center">
      <div className="text-3xl mb-3">🎵</div>
      <h1 className="text-base font-semibold mb-1">Spotify Floating Player</h1>
      <p className="text-xs text-white/50 mb-6">需要連結你的 Spotify 帳號才能使用</p>

      {step === 'clientId' && (
        <div className="space-y-3">
          <div className="text-left text-[11px] text-white/60 leading-relaxed bg-white/5 rounded-lg p-3">
            <div className="font-semibold text-white/80 mb-1">如何取得 Client ID：</div>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>前往 <span className="text-spotify-green">developer.spotify.com/dashboard</span></li>
              <li>建立 App，取得 Client ID</li>
              <li>於 App Settings → Redirect URIs 加入：<br/><code className="text-[10px] text-spotify-green">http://127.0.0.1:8888/callback</code></li>
            </ol>
          </div>
          <input
            value={cidInput}
            onChange={(e) => setCidInput(e.target.value)}
            placeholder="貼上 Client ID（32 字元）"
            className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-spotify-green"
          />
          {error && <div className="text-xs text-red-400">{error}</div>}
          <button
            onClick={handleSaveCid}
            className="w-full bg-spotify-green hover:bg-[#1ed760] text-black font-semibold rounded-full py-2 text-sm transition-colors"
          >
            繼續
          </button>
        </div>
      )}

      {step === 'login' && (
        <div className="space-y-3">
          <div className="text-[11px] text-white/50">
            點擊下方按鈕，瀏覽器將開啟 Spotify 授權頁
          </div>
          {error && <div className="text-xs text-red-400 px-3">{error}</div>}
          <button
            onClick={handleLogin}
            disabled={busy}
            className="w-full bg-spotify-green hover:bg-[#1ed760] disabled:opacity-50 text-black font-semibold rounded-full py-2.5 text-sm transition-colors"
          >
            {busy ? '等待授權中…' : '使用 Spotify 登入'}
          </button>
          <button
            onClick={() => onSaveClientId('')}
            className="text-[11px] text-white/40 hover:text-white/70"
          >
            修改 Client ID
          </button>
        </div>
      )}
    </div>
  );
}
