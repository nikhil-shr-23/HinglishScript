export interface SRTBlock {
  index: number;
  timestamp: string;
  text: string[];
}

/**
 * Parse SRT content into structured blocks
 */
export function parseSRT(content: string): SRTBlock[] {
  const blocks: SRTBlock[] = [];
  const rawBlocks = content.trim().split(/\n\n+/);

  for (const rawBlock of rawBlocks) {
    const lines = rawBlock.trim().split("\n");
    if (lines.length < 3) continue;

    const index = parseInt(lines[0], 10);
    if (isNaN(index)) continue;

    const timestamp = lines[1];
    const text = lines.slice(2);

    blocks.push({ index, timestamp, text });
  }

  return blocks;
}

/**
 * Extract only text lines for GPT (no timestamps/indices)
 * Returns array of text entries, each entry can be multi-line
 */
export function extractTextLines(blocks: SRTBlock[]): string[] {
  return blocks.map((block) => block.text.join("\n"));
}

/**
 * Reconstruct valid SRT with original timing + converted text
 */
export function reconstructSRT(
  blocks: SRTBlock[],
  convertedLines: string[]
): string {
  const result: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const convertedText = convertedLines[i] || block.text.join("\n");

    result.push(`${block.index}`);
    result.push(block.timestamp);
    result.push(convertedText);
    result.push("");
  }

  return result.join("\n").trim();
}
