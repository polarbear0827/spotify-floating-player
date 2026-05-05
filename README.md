# 🎵 Spotify Floating Player

一個給 **Windows 11** 用的 Spotify 懸浮迷你播放器，靈感來自 KKBOX。
圓角毛玻璃介面、可調透明度、即時同步歌詞，並可永遠置頂在桌面上。

![platform](https://img.shields.io/badge/platform-Windows%2011-blue)
![electron](https://img.shields.io/badge/Electron-31-47848F)
![license](https://img.shields.io/badge/license-MIT-green)

---

## ✨ 功能

- 🪟 **無邊框毛玻璃懸浮視窗** — 可拖曳、置頂切換、記住位置
- 🎚️ **透明度調整** — 0% ~ 90%
- 📐 **響應式排版** — 拉大歌詞顯示更多行；拉到最小只顯示當前歌詞
- 🎯 **歌詞自動置中** — 當前播放行永遠垂直居中、平滑滾動高亮
- ⏯️ **完整播放控制** — 上一首 / 暫停播放 / 下一首 / 進度條拖曳
- 🔐 **PKCE 授權流程** — 不需要 Client Secret，零洩漏風險
- 💾 **記住一切** — 視窗位置、透明度、登入狀態

---

## 📸 介面區塊

由上至下四個區塊：

| 區塊 | 內容 | 高度 |
|---|---|---|
| 1 | 歌名 + 歌手 + 專輯封面 | 固定 |
| 2 | 同步歌詞（當前行高亮置中） | **彈性**（隨視窗縮放） |
| 3 | 播放進度條 + 時間 | 固定 |
| 4 | 上一首 / 播放暫停 / 下一首 | 固定 |

右上角小按鈕：⚙️ 設定 / 📌 置頂 / ➖ 最小化 / ✖ 關閉

---

## 🚀 快速開始

### 1. 取得 Spotify Client ID

1. 前往 [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. 點 **Create app**：
   - App name: `Spotify Floating Player`（隨便取）
   - App description: 隨便填
   - **Redirect URI**: `http://127.0.0.1:8888/callback`（**這行必須一字不差！**）
   - APIs used: 勾 **Web API**
3. 建立後在 App 頁面複製 **Client ID**（不需要 Client Secret，PKCE 用不到）

### 2. 開發模式執行

```bash
git clone https://github.com/polarbear0827/spotify-floating-player.git
cd spotify-floating-player
npm install
npm run dev
```

首次啟動會請你貼上 Client ID，然後點「使用 Spotify 登入」會開啟瀏覽器授權。

### 3. 打包成 .exe

```bash
npm run build:win
```

產出的安裝檔位於 `release/` 資料夾，雙擊 `.exe` 即可安裝。

---

## ⚙️ 設定

點齒輪 ⚙️ 開啟設定面板：

- **視窗透明度**：滑桿 0% ~ 90%
- **Spotify Client ID**：可隨時修改
- **登出**：清除授權，下次啟動需重新登入

---

## 🎨 技術棧

| 層級 | 技術 |
|---|---|
| 桌面框架 | Electron 31 |
| UI | React 18 + Vite + Tailwind CSS |
| 狀態保存 | electron-store（存於 `%APPDATA%/spotify-floating-player/`） |
| Spotify 認證 | PKCE (RFC 7636) |
| 歌詞來源 | [LRCLIB](https://lrclib.net/)（免費、開源、無需 API Key） |

---

## 📋 系統需求

- **OS**：Windows 11（也支援 10/macOS/Linux，但毛玻璃效果最佳於 Win11）
- **Spotify 帳號**：**Premium**（控制播放需要 Premium，免費帳號只能看資訊）
- **Node.js**：18+（僅開發/打包需要，使用者執行 `.exe` 不需要）

---

## 🗂️ 專案結構

```
spotify-floating-player/
├── electron/              # Electron main process
│   ├── main.cjs           # 視窗管理、PKCE callback server、IPC
│   └── preload.cjs        # 安全 API 橋接
├── src/renderer/          # React 前端
│   ├── App.jsx            # 主元件、輪詢 Spotify、狀態整合
│   ├── components/
│   │   ├── TitleBar.jsx       # 右上小按鈕區
│   │   ├── NowPlaying.jsx     # 區塊 1：歌名歌手
│   │   ├── Lyrics.jsx         # 區塊 2：歌詞置中滾動
│   │   ├── Progress.jsx       # 區塊 3：進度條
│   │   ├── Controls.jsx       # 區塊 4：播放控制
│   │   ├── SettingsPanel.jsx  # 透明度滑桿、Client ID 修改
│   │   └── Login.jsx          # 首次設定 + OAuth 登入
│   └── lib/
│       ├── spotify.js     # PKCE flow + Spotify Web API client
│       └── lrclib.js      # LRCLIB 歌詞抓取與 LRC 解析
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 🔒 安全說明

- 採用 **PKCE OAuth 2.1**，**不儲存也不需要 Client Secret**
- 你的 Client ID 只存在本機 `%APPDATA%`
- Spotify access/refresh token 加密存於 electron-store，不上傳任何外部伺服器
- 所有網路請求僅發送至 `accounts.spotify.com`、`api.spotify.com`、`lrclib.net`

---

## ❓ 常見問題

**Q: 為什麼按播放/暫停沒反應？**
A: 確認 Spotify 桌面 app 或網頁播放器已經開啟並有「啟動的播放裝置」。Spotify 規定遠端控制必須有 active device。

**Q: 歌詞顯示「無歌詞」？**
A: 該歌曲在 LRCLIB 資料庫沒有同步歌詞，這是正常情況，特別是冷門或華語新歌。

**Q: 視窗看不到了？**
A: 設定面板的視窗位置存在 `%APPDATA%/spotify-floating-player/config.json`，刪除該檔重啟即恢復預設。

**Q: 透明度設太高什麼都看不到？**
A: 點齒輪可以重新調回來；如果完全透明點不到，刪除上面那個 config.json 即可。

---

## 📜 授權

[MIT License](LICENSE) © polarbear0827
