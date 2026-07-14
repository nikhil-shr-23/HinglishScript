# Agents

Standalone Node scripts that run the captioning pipeline outside of the
Next.js app (`frontend/`). Useful for batch-processing videos or wiring the
pipeline into other automation without going through the web UI.

## caption-agent

Extracts audio from a video, transcribes it with Whisper, optionally
converts the captions to Hinglish, and optionally burns the captions
directly into the video with ffmpeg.

### Setup

```bash
cd agents
npm install
```

Requires `ffmpeg` on your `PATH` and an `OPENAI_API_KEY`, either exported or
placed in `agents/.env`:

```
OPENAI_API_KEY=sk-...
```

### Usage

```bash
node caption-agent.mjs <video-path> [--lang original|hinglish] [--burn] [--out <dir>]
```

- `--lang hinglish` (default) — also generate a Hinglish `.srt`
- `--lang original` — keep only the raw transcription
- `--burn` — additionally render `<name>_captioned.mp4` with the captions
  hard-coded into the picture
- `--out <dir>` — where to write output files (defaults to the video's own
  folder)

### Example

```bash
node caption-agent.mjs ~/Videos/interview.mp4 --lang hinglish --burn
```

Produces:

- `interview.srt` — original-language captions
- `interview_hinglish.srt` — Hinglish captions
- `interview_captioned.mp4` — video with Hinglish captions burned in

## Future agents

This folder is meant to grow — e.g. a batch-processing agent that watches a
folder for new videos, or an agent that posts finished captions somewhere
(Slack, a CMS, etc.).
