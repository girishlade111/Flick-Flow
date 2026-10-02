# Flick Flow

Flick Flow is a modern, minimalist, and high-performance media player built with Next.js 15 and Tailwind CSS (originally scaffolded in Firebase Studio). It provides a seamless, intuitive interface for **local media playback** — everything runs in the browser, with no server, no login, and no uploads.

Live demo: https://girishlade111.github.io/Flick-Flow/

## Features

- **Modern, minimalist UI** — clean, unobtrusive interface that puts your content front and center
- **Local file playback** — load and play video (`.mp4`, `.webm`, `.ogg`) and audio (`.mp3`, `.wav`, etc.) straight from your device (nothing leaves the browser)
- **Custom subtitles** — external `.vtt` subtitle file support for an accessible viewing experience
- **Advanced playback controls**:
  - Play/Pause
  - Volume control and mute
  - Timeline scrubbing
  - Adjustable playback speed (0.25x to 2.5x)
- **Enhanced viewing**:
  - Fullscreen mode
  - Zoom in/out controls to focus on details
- **Fully responsive** — flawless experience across desktop, tablet, and mobile
- **Keyboard shortcuts** — control playback without touching the mouse
- **Shareable links** — pass a video URL via the `?video=` query param

## Tech stack

- Next.js 15 (App Router, static export)
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui components (Radix UI)
- lucide-react icons
- Exported as a fully static site (`output: 'export'`) — no backend required

## Quick start

```bash
npm install
npm run dev        # dev server at http://localhost:9002
npm run build      # static export to ./out
```

## Project structure

```
src/
├── app/            # App Router: layout.tsx, page.tsx, globals.css
├── components/     # VideoPlayer + shadcn/ui components
├── hooks/          # reusable React hooks
├── lib/            # utilities
└── ai/             # Genkit scaffolding (unused in the client player)
```

## Deploy notes

The site is deployed as a static export on **GitHub Pages** (branch `main`, root path). The build output lives at the repo root (`index.html`, `_next/`, `static/`) alongside the source so GitHub Pages can serve it directly. A `.nojekyll` file is included so paths starting with `_` are served correctly. To re-deploy: edit the source, run `npm run build`, copy `out/` over the repo root, and push to `main`.

## Built by

**Built by Girish Lade** — [ladestack.in](https://ladestack.in)
