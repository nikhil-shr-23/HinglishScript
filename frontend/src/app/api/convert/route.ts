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
- Output only the converted lines in the same order.

Examples:
तुम कैसे हो? → Tum kaise ho?
मुझे देर हो गई → Mujhe der ho gayi

Now convert:`;

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
    const numberedLines = textLines
      .map((line, i) => `${i + 1}. ${line}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: numberedLines },
      ],
      temperature: 0.3,
    });

    const gptOutput = response.choices[0]?.message?.content || "";

    // Parse GPT response - expects numbered lines like "1. Tum kaise ho?"
    const convertedLines = gptOutput
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((line) => line.length > 0);

    // Ensure we have the same number of lines
    const finalLines =
      convertedLines.length === textLines.length
        ? convertedLines
        : textLines.map((_, i) => convertedLines[i] || textLines[i]);

    const convertedSRT = reconstructSRT(blocks, finalLines);

    return NextResponse.json({ convertedSRT });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "Failed to convert subtitles" },
      { status: 500 }
    );
  }
}
