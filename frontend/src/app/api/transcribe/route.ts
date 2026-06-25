import { NextRequest, NextResponse } from "next/server";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import OpenAI, { toFile } from "openai";
import { extractAudio } from "@/lib/ffmpeg";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Keep uploads reasonable for a single request/response round trip.
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB

export async function POST(request: NextRequest) {
  let workDir: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("video");
    const language = formData.get("language");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload a video file" },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Uploaded video is empty" },
        { status: 400 },
      );
    }

    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { error: "Video is too large (max 200MB)" },
        { status: 400 },
      );
    }

    workDir = await mkdtemp(join(tmpdir(), "hinglishscript-"));
    const videoPath = join(workDir, `input-${file.name}`);
    const audioPath = join(workDir, "audio.mp3");

    const videoBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(videoPath, videoBuffer);

    await extractAudio(videoPath, audioPath);

    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(createReadStream(audioPath), "audio.mp3"),
      model: "whisper-1",
      response_format: "srt",
      ...(typeof language === "string" && language ? { language } : {}),
    });

    // response_format "srt" returns the raw SRT text, not a JSON object
    const srt =
      typeof transcription === "string" ? transcription : String(transcription);

    if (!srt.trim()) {
      return NextResponse.json(
        { error: "Could not detect any speech in this video" },
        { status: 422 },
      );
    }

    return NextResponse.json({ srt });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to auto-generate captions. Please try again." },
      { status: 500 },
    );
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
