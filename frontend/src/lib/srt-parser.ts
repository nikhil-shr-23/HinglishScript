export interface SRTBlock {
  index: number;
  timestamp: string;
  text: string[];
}

/**
 * Parse SRT content into structured blocks
 * Handles various line ending formats (CRLF, LF, CR)
 */
export function parseSRT(content: string): SRTBlock[] {
  const blocks: SRTBlock[] = [];
  
  // Normalize line endings to LF
  const normalized = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  
  // Split on blank lines (one or more consecutive newlines)
  const rawBlocks = normalized.split(/\n\n+/);

  for (const rawBlock of rawBlocks) {
    const trimmedBlock = rawBlock.trim();
    if (!trimmedBlock) continue;
    
    const lines = trimmedBlock.split("\n");
    if (lines.length < 2) continue;

    // First line should be the index number
    const indexMatch = lines[0].match(/^\d+$/);
    if (!indexMatch) continue;
    
    const index = parseInt(lines[0], 10);
    if (isNaN(index)) continue;

    // Second line should be the timestamp
    const timestamp = lines[1];
    if (!timestamp.includes("-->")) continue;
    
    // Remaining lines are the subtitle text
    const text = lines.slice(2).filter(line => line.trim().length > 0);
    if (text.length === 0) continue;

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
