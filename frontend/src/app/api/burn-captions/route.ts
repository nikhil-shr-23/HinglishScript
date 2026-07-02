import { NextRequest, NextResponse } from "next/server";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { burnSubtitles } from "@/lib/ffmpeg";

export const runtime = "nodejs";

const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB

export async function POST(request: NextRequest) {
  let workDir: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("video");
    const srtContent = formData.get("srt");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload a video file" },
        { status: 400 },
      );
    }

    if (typeof srtContent !== "string" || !srtContent.trim()) {
      return NextResponse.json(
        { error: "No caption text to burn into the video" },
        { status: 400 },
      );
    }

    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { error: "Video is too large (max 200MB)" },
        { status: 400 },
      );
    }

    workDir = await mkdtemp(join(tmpdir(), "hinglishscript-burn-"));
    const videoPath = join(workDir, `input-${file.name}`);
    const srtPath = join(workDir, "captions.srt");
    const outputPath = join(workDir, "output.mp4");

    const videoBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(videoPath, videoBuffer);
    await writeFile(srtPath, srtContent, "utf-8");

    await burnSubtitles(videoPath, srtPath, outputPath);

    const outputBuffer = await readFile(outputPath);

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="captioned-video.mp4"',
      },
    });
  } catch (error) {
    console.error("Caption burn-in error:", error);
    return NextResponse.json(
      { error: "Failed to add captions to the video. Please try again." },
      { status: 500 },
    );
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
