# Personal Media Downloader

A modern, responsive web application for downloading media you have rights to (your own uploads, openly licensed content, etc.). Features a beautiful glassmorphic dark UI, real-time download progress, queue management, and download history.

![Tech Stack](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-blue) ![Node.js](https://img.shields.io/badge/Node.js-20+-green) ![Socket.io](https://img.shields.io/badge/Socket.io-4-black)

## Features

- 🔗 **URL Detection** — Paste any supported URL, auto-detect title, thumbnail, duration, uploader
- 🎬 **Quality Selection** — 144p to 4K, video-only, audio-only, video+audio
- 📦 **Format Options** — MP4, MKV, WebM, MP3, Original
- 📊 **Real-time Progress** — Percentage, speed, ETA, file size via Socket.io
- 📋 **Download Queue** — Configurable concurrent downloads (1-10)
- 📜 **Download History** — Searchable, with thumbnails and metadata
- ⚙️ **Settings** — Default quality, format, mode, concurrent limit
- 🎯 **Drag & Drop** — Drop URLs directly onto the input
- 🔒 **Security** — No shell execution, URL validation, path traversal prevention
- 📱 **Responsive** — Works on desktop and mobile
- 🌙 **Dark Mode** — Premium glassmorphic design

## Prerequisites

| Dependency | Version | Install |
|------------|---------|---------|
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org) |
| **yt-dlp** | Latest | `pip install yt-dlp` or `brew install yt-dlp` or [GitHub Releases](https://github.com/yt-dlp/yt-dlp/releases) |
| **FFmpeg** | Latest | [ffmpeg.org/download](https://ffmpeg.org/download.html) or `brew install ffmpeg` |

> **Important:** Both `yt-dlp` and `ffmpeg` must be available on your system PATH.

## Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ytdowloader

# 2. Install all dependencies
npm install

# 3. Copy environment template
cp .env.example server/.env

# 4. Start development (both client & server)
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5174

## Environment Variables

Create a `server/.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5174` | Backend server port |
| `DOWNLOAD_DIR` | `./downloads` | Where files are saved |
| `MAX_CONCURRENT` | `3` | Max simultaneous downloads |
| `CORS_ORIGIN` | `http://localhost:5173` | Frontend URL for CORS |

## Project Structure

```
ytdowloader/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API & Socket.io clients
│   │   ├── stores/         # Zustand state stores
│   │   ├── App.tsx         # Main application
│   │   ├── main.tsx        # Entry point
│   │   └── index.css       # Design system + Tailwind
│   ├── index.html
│   └── vite.config.ts
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/      # Validation, error handling
│   │   ├── utils/          # Sanitization, format utils
│   │   ├── config.ts       # Configuration
│   │   └── index.ts        # Server entry
│   └── package.json
├── shared/                 # Shared TypeScript types
│   └── types.ts
└── package.json            # Root workspace
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/info` | Fetch media metadata |
| `POST` | `/api/download` | Start a download |
| `GET` | `/api/download` | List active downloads |
| `DELETE` | `/api/download/:id` | Cancel a download |
| `POST` | `/api/download/:id/retry` | Retry a failed download |
| `GET` | `/api/history` | Get download history |
| `DELETE` | `/api/history/:id` | Delete history item |
| `DELETE` | `/api/history` | Clear all history |
| `GET` | `/api/settings` | Get settings |
| `PUT` | `/api/settings` | Update settings |
| `GET` | `/api/files/:filename` | Download a file |
| `POST` | `/api/files/open-folder` | Open downloads folder |
| `GET` | `/api/health` | Health check |

## Production Build

### Frontend

```bash
cd client
npm run build
# Deploy the `dist/` folder to GitHub Pages, Cloudflare Pages, or Vercel
```

For **GitHub Pages**, set the correct base path in `vite.config.ts`:
```ts
base: '/your-repo-name/'
```

### Backend

```bash
cd server
npm run build
npm start
```

For production, use **PM2** for process management:

```bash
npm install -g pm2
pm2 start server/dist/index.js --name media-downloader
pm2 save
pm2 startup
```

> **Note:** When deploying frontend separately, update `CORS_ORIGIN` in your backend `.env` to match the frontend's domain.

## Security

| Threat | Mitigation |
|--------|-----------|
| Command injection | `spawn()` with array args, no shell, no `--exec` |
| Path traversal | Resolve all paths & verify within download root |
| Filename injection | `sanitize-filename` + null byte/control char stripping |
| Request abuse | Rate limiting (100 req/min), body size limit (1MB) |
| URL validation | Zod URL schema + protocol whitelist (http/https) |
| XSS | Helmet headers, React's built-in escaping |
| DoS via downloads | Concurrent download limit (configurable) |

## License

MIT
