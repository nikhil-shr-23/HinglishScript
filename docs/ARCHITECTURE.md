# Architecture

```
HinglishScript/
├── frontend/    Next.js app (UI + API routes) — the main product today
├── agents/      standalone Node CLI scripts that run the same pipeline
│                outside the web app, for batch/automation use
├── backend/     placeholder for a future dedicated backend service
└── docs/        this folder
```

## frontend/

A single Next.js app (App Router) that serves both the UI and the API:

- `src/app/page.tsx` — home page, switches between "Subtitle Text" and
  "Video Captions" modes via `ModeSwitcher`
- `src/components/VideoCaptions.tsx` — video upload, live caption preview
  (via an HTML5 `<track>` built from a client-side SRT→VTT conversion),
  and actions to convert/download/burn captions
- `src/lib/srt-parser.ts` — SRT parsing, reconstruction, and SRT→VTT
  conversion
- `src/lib/ffmpeg.ts` — thin wrapper around the system `ffmpeg` binary for
  audio extraction and subtitle burn-in
- `src/app/api/convert` — Devanagari Hindi SRT → Hinglish SRT (OpenAI chat
  completions, batched by line)
- `src/app/api/transcribe` — video → SRT captions (ffmpeg extracts audio,
  OpenAI Whisper transcribes it)
- `src/app/api/burn-captions` — video + SRT → captioned video file (ffmpeg
  hard-codes the subtitles into the picture)

All video/audio processing happens in a temp directory per request and is
cleaned up afterwards; nothing is persisted server-side.

## agents/

Same pipeline (extract audio → transcribe → convert → burn), but as a CLI
you can run against a local file or wire into other automation, without
going through the Next.js server. See [agents/README.md](../agents/README.md).

## backend/

Reserved for a future dedicated service — see
[backend/README.md](../backend/README.md) for what that would take on.
