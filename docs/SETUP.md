# Setup

## Prerequisites

- [Bun](https://bun.sh) (the web app uses `bun.lock`)
- Node.js 20+ (for `agents/`)
- [ffmpeg](https://ffmpeg.org) on your `PATH` — used to extract audio from
  uploaded videos and to burn captions into video
- An `OPENAI_API_KEY` (used for Hindi→Hinglish conversion and Whisper
  transcription)

## Web app (`frontend/`)

```bash
cd frontend
bun install
cp .env.example .env   # if present, otherwise create .env with OPENAI_API_KEY=...
bun run dev
```

Open http://localhost:3000.

- **Subtitle Text** mode converts pasted/uploaded Devanagari Hindi `.srt`
  files to Hinglish.
- **Video Captions** mode uploads a video, auto-generates captions with
  Whisper, optionally converts them to Hinglish, and can burn them into a
  downloadable captioned video.

## Agents (`agents/`)

```bash
cd agents
npm install
node caption-agent.mjs <video-path> --lang hinglish --burn
```

See [agents/README.md](../agents/README.md) for full CLI usage.

## Backend (`backend/`)

Not implemented yet — see [backend/README.md](../backend/README.md) for the
current plan.
