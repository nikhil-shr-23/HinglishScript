import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  parseSRT,
  extractTextLines,
  reconstructSRT,
} from "@/lib/srt-parser";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a professional Hindi-to-Hinglish subtitle converter.

Rules:
- Convert Devanagari Hindi to Hinglish (Roman Hindi).
- Do NOT translate to English.
- Preserve informal spoken tone.
- Keep sentence length natural for subtitles.
- Do NOT add explanations.
- Output EXACTLY the same number of lines as input.
- Each output line corresponds to the input line at the same position.

Examples:
तुम कैसे हो? → Tum kaise ho?
मुझे देर हो गई → Mujhe der ho gayi

IMPORTANT: Output exactly one converted line per input line, maintaining the same order.`;

// Process in batches to avoid token limits and improve reliability
const BATCH_SIZE = 20;

async function convertBatch(lines: string[]): Promise<string[]> {
  if (lines.length === 0) return [];

  const numberedLines = lines
    .map((line, i) => `${i + 1}. ${line}`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Convert these ${lines.length} lines:\n\n${numberedLines}` },
    ],
    temperature: 0.2,
  });

  const gptOutput = response.choices[0]?.message?.content || "";

  // Parse GPT response - handle various formats
  const outputLines = gptOutput
    .split("\n")
    .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter((line) => line.length > 0);

  // If GPT returned wrong number of lines, pad/trim to match
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i < outputLines.length && outputLines[i]) {
      result.push(outputLines[i]);
    } else {
      // Fallback: keep original if GPT missed this line
      result.push(lines[i]);
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { srtContent } = await request.json();

    if (!srtContent || typeof srtContent !== "string") {
      return NextResponse.json(
        { error: "Invalid SRT content" },
        { status: 400 }
      );
    }

    const blocks = parseSRT(srtContent);
    if (blocks.length === 0) {
      return NextResponse.json(
        { error: "No valid SRT blocks found" },
        { status: 400 }
      );
    }

    const textLines = extractTextLines(blocks);

    // Process in batches for reliability
    const allConvertedLines: string[] = [];

    for (let i = 0; i < textLines.length; i += BATCH_SIZE) {
      const batch = textLines.slice(i, i + BATCH_SIZE);
      try {
        const convertedBatch = await convertBatch(batch);
        allConvertedLines.push(...convertedBatch);
      } catch (batchError) {
        console.error(`Batch ${i / BATCH_SIZE} failed, using originals:`, batchError);
        // On batch failure, keep originals
        allConvertedLines.push(...batch);
      }
    }

    const convertedSRT = reconstructSRT(blocks, allConvertedLines);

    return NextResponse.json({ convertedSRT });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "Failed to convert subtitles. Please try again." },
      { status: 500 }
    );
  }
}
