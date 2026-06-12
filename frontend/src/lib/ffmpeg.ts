import { execFile } from "node:child_process";

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      args,
      { maxBuffer: 1024 * 1024 * 64 },
      (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(stderr?.toString().slice(-2000) || error.message));
          return;
        }
        resolve();
      },
    );
  });
}

/**
 * Extract a small mono/low-bitrate audio track from a video file.
 * Whisper only needs audio, and this keeps uploads well under API size limits.
 */
export async function extractAudio(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  await runFfmpeg([
    "-y",
    "-i",
    inputPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-b:a",
    "64k",
    outputPath,
  ]);
}

/**
 * Hard-code (burn) subtitles into a video's picture, producing a new
 * standalone video file that carries the captions permanently.
 */
export async function burnSubtitles(
  videoPath: string,
  srtPath: string,
  outputPath: string,
): Promise<void> {
  // ffmpeg's subtitles filter needs an escaped path (colons/backslashes trip up its mini-parser)
  const escapedSrtPath = srtPath.replace(/\\/g, "\\\\").replace(/:/g, "\\:");

  await runFfmpeg([
    "-y",
    "-i",
    videoPath,
    "-vf",
    `subtitles='${escapedSrtPath}'`,
    "-c:a",
    "copy",
    outputPath,
  ]);
}
