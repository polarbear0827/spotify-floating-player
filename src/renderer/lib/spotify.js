// Spotify PKCE OAuth + API client (renderer side)

const REDIRECT_URI = 'http://127.0.0.1:8888/callback';
const SCOPES = [
  'user-read-playback-state',
  'user-read-currently-playing',
  'user-modify-playback-state',
].join(' ');

// ---- PKCE helpers ----
function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateCodeVerifier() {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  return await crypto.subtle.digest('SHA-256', data);
}

export async function loginWithPKCE(clientId) {
  const codeVerifier = generateCodeVerifier();
  const challengeBuf = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(challengeBuf);

  // main process opens browser & catches callback
  const code = await window.api.oauth.start({
    clientId,
    scopes: SCOPES,
    codeChallenge,
    redirectUri: REDIRECT_URI,
  });

  // exchange code for tokens
  const tokens = await exchangeCodeForTokens(clientId, code, codeVerifier);
  await saveTokens(tokens);
  return tokens;
}

async function exchangeCodeForTokens(clientId, code, codeVerifier) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('Token exchange failed: ' + err);
  }

  const json = await res.json();
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Date.now() + json.expires_in * 1000,
  };
}

async function refreshAccessToken(clientId, refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('Refresh failed: ' + err);
  }
  const json = await res.json();
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token || refreshToken,
    expires_at: Date.now() + json.expires_in * 1000,
  };
}

async function saveTokens(tokens) {
  await window.api.config.set('tokens', tokens);
}

export async function getValidAccessToken(clientId) {
  let tokens = await window.api.config.get('tokens');
  if (!tokens) return null;
  // refresh if expiring within 60s
  if (Date.now() > tokens.expires_at - 60_000) {
    try {
      tokens = await refreshAccessToken(clientId, tokens.refresh_token);
      await saveTokens(tokens);
    } catch (e) {
      console.error('Refresh token failed', e);
      return null;
    }
  }
  return tokens.access_token;
}

export async function logout() {
  await window.api.config.set('tokens', null);
}

// ---- Spotify Web API wrappers ----
async function spotifyFetch(token, path, options = {}) {
  const res = await fetch('https://api.spotify.com/v1' + path, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + token,
      ...(options.headers || {}),
    },
  });
  if (res.status === 204) return null; // no content
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify ${res.status}: ${text}`);
  }
  // Some control endpoints have empty body
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  return res.json();
}

export async function getCurrentlyPlaying(token) {
  return spotifyFetch(token, '/me/player/currently-playing');
}

export async function play(token) {
  return spotifyFetch(token, '/me/player/play', { method: 'PUT' });
}
export async function pause(token) {
  return spotifyFetch(token, '/me/player/pause', { method: 'PUT' });
}
export async function next(token) {
  return spotifyFetch(token, '/me/player/next', { method: 'POST' });
}
export async function previous(token) {
  return spotifyFetch(token, '/me/player/previous', { method: 'POST' });
}
export async function seek(token, positionMs) {
  return spotifyFetch(token, `/me/player/seek?position_ms=${Math.round(positionMs)}`, { method: 'PUT' });
}
