#!/usr/bin/env node
// Standalone CLI agent that runs the full captioning pipeline (transcribe ->
// optionally convert to Hinglish -> optionally burn into the video) without
// going through the Next.js app. Useful for batch jobs and automation.
//
// Usage:
//   OPENAI_API_KEY=sk-... node agents/caption-agent.mjs <video-path> [options]
//
// Options:
//   --lang <original|hinglish>  which captions to keep as the primary output (default: hinglish)
//   --burn                      also render a captioned copy of the video (requires ffmpeg)
//   --out <dir>                 output directory (default: same folder as the input video)

import "dotenv/config";
import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import OpenAI, { toFile } from "openai";

const HINGLISH_SYSTEM_PROMPT = `You are a professional Hindi-to-Hinglish subtitle converter.

Rules:
- Convert Devanagari Hindi to Hinglish (Roman Hindi).
- Do NOT translate to English.
- Preserve informal spoken tone.
- Keep the exact SRT structure: same indices, same timestamps.
- Only rewrite the dialogue lines.
- Output valid SRT and nothing else (no commentary, no code fences).`;

function parseArgs(argv) {
  const [videoPath, ...rest] = argv;
  const options = { lang: "hinglish", burn: false, out: null };

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--lang") options.lang = rest[++i];
    else if (arg === "--burn") options.burn = true;
    else if (arg === "--out") options.out = rest[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!videoPath) {
    throw new Error("Usage: caption-agent <video-path> [--lang original|hinglish] [--burn] [--out <dir>]");
  }
  if (!["original", "hinglish"].includes(options.lang)) {
    throw new Error('--lang must be "original" or "hinglish"');
  }

  return { videoPath: resolve(videoPath), ...options };
}

function runFfmpeg(args) {
  return new Promise((resolvePromise, reject) => {
    execFile("ffmpeg", args, { maxBuffer: 1024 * 1024 * 64 }, (error, _stdout, stderr) => {
      if (error) {
        reject(new Error(stderr?.toString().slice(-2000) || error.message));
        return;
      }
      resolvePromise();
    });
  });
}

async function extractAudio(inputPath, outputPath) {
  await runFfmpeg(["-y", "-i", inputPath, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "64k", outputPath]);
}

async function burnSubtitles(videoPath, srtPath, outputPath) {
  const escapedSrtPath = srtPath.replace(/\\/g, "\\\\").replace(/:/g, "\\:");
  await runFfmpeg(["-y", "-i", videoPath, "-vf", `subtitles='${escapedSrtPath}'`, "-c:a", "copy", outputPath]);
}

async function transcribe(openai, audioPath) {
  const srt = await openai.audio.transcriptions.create({
    file: await toFile(createReadStream(audioPath), "audio.mp3"),
    model: "whisper-1",
    response_format: "srt",
  });
  return typeof srt === "string" ? srt : String(srt);
}

async function convertToHinglish(openai, srtContent) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    messages: [
      { role: "system", content: HINGLISH_SYSTEM_PROMPT },
      { role: "user", content: srtContent },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || srtContent;
}

async function main() {
  const { videoPath, lang, burn, out } = parseArgs(process.argv.slice(2));

  await stat(videoPath).catch(() => {
    throw new Error(`Video not found: ${videoPath}`);
  });

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set (add it to a .env file or export it)");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const outDir = resolve(out || dirname(videoPath));
  const stem = basename(videoPath, extname(videoPath));
  const workDir = await mkdtemp(join(tmpdir(), "caption-agent-"));

  try {
    console.log(`[1/4] extracting audio from ${basename(videoPath)}...`);
    const audioPath = join(workDir, "audio.mp3");
    await extractAudio(videoPath, audioPath);

    console.log("[2/4] transcribing with whisper...");
    const originalSRT = await transcribe(openai, audioPath);
    const originalSRTPath = join(outDir, `${stem}.srt`);
    await writeFile(originalSRTPath, originalSRT, "utf-8");
    console.log(`      wrote ${originalSRTPath}`);

    let activeSRT = originalSRT;
    let activeSRTPath = originalSRTPath;

    if (lang === "hinglish") {
      console.log("[3/4] converting captions to hinglish...");
      const hinglishSRT = await convertToHinglish(openai, originalSRT);
      activeSRT = hinglishSRT;
      activeSRTPath = join(outDir, `${stem}_hinglish.srt`);
      await writeFile(activeSRTPath, hinglishSRT, "utf-8");
      console.log(`      wrote ${activeSRTPath}`);
    } else {
      console.log("[3/4] skipping hinglish conversion (--lang original)");
    }

    if (burn) {
      console.log("[4/4] burning captions into the video...");
      const outputVideoPath = join(outDir, `${stem}_captioned.mp4`);
      await burnSubtitles(videoPath, activeSRTPath, outputVideoPath);
      console.log(`      wrote ${outputVideoPath}`);
    } else {
      console.log("[4/4] skipping video burn-in (pass --burn to enable)");
    }

    console.log("done.");
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(1);
});
