# API Routes

All routes live under `frontend/src/app/api/` and run on the Node.js
runtime (they shell out to `ffmpeg` and need `OPENAI_API_KEY`).

## `POST /api/convert`

Converts Devanagari Hindi SRT text to Hinglish.

**Request** (`application/json`)

```json
{ "srtContent": "1\n00:00:01,000 --> 00:00:03,000\nतुम कैसे हो?\n" }
```

**Response**

```json
{ "convertedSRT": "1\n00:00:01,000 --> 00:00:03,000\nTum kaise ho?\n" }
```

`400` if `srtContent` is missing/invalid or no valid SRT blocks are found.

## `POST /api/transcribe`

Auto-generates captions for an uploaded video.

**Request** (`multipart/form-data`)

| field | type | required |
|---|---|---|
| `video` | file | yes |
| `language` | string (ISO-639-1, e.g. `hi`) | no — auto-detected if omitted |

**Response**

```json
{ "srt": "1\n00:00:00,000 --> 00:00:02,400\nनमस्ते\n" }
```

`400` for a missing/oversized (>200MB) video, `422` if no speech is
detected.

## `POST /api/burn-captions`

Hard-codes captions into a video's picture and returns the rendered file.

**Request** (`multipart/form-data`)

| field | type | required |
|---|---|---|
| `video` | file | yes |
| `srt` | string (SRT content) | yes |

**Response**

`video/mp4` binary stream, `Content-Disposition: attachment;
filename="captioned-video.mp4"`.

`400` for a missing video/SRT or an oversized (>200MB) video.
