# Backend (planned)

Not implemented yet. Today all processing happens inside the Next.js app's
API routes (`frontend/src/app/api/`) and the CLI scripts in `agents/`,
which is fine for short, single-request jobs.

A dedicated backend would make sense once we need:

- **Long-running jobs** — large videos can take longer to transcribe/burn
  than a serverless function's request timeout allows
- **A job queue** — accept an upload, return immediately, process async,
  notify/poll for completion
- **Persistent storage** — keep uploaded videos and generated captions
  instead of processing them in a temp dir and discarding them
- **Multi-tenant usage tracking** — API keys, rate limits, usage-based
  billing, etc.

## Rough shape (not yet decided)

- A small Node/TypeScript service (reusing `src/lib/ffmpeg.ts` /
  `src/lib/srt-parser.ts` logic from `frontend/`) with:
  - an upload endpoint that enqueues a job
  - a worker process that runs the extract → transcribe → convert → burn
    pipeline
  - object storage (e.g. S3-compatible) for inputs/outputs
  - a status endpoint the frontend polls
- The `frontend/` app would call this service instead of doing the work
  inline in its own API routes.

Nothing here is final — update this doc once the approach is chosen.
