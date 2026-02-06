"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  Download,
  Loader2,
  FileText,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

export default function Home() {
  const [originalSRT, setOriginalSRT] = useState("");
  const [convertedSRT, setConvertedSRT] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".srt")) {
      setError("Please upload a valid .srt file");
      return;
    }

    setFileName(file.name);
    setError("");
    setConvertedSRT("");

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setOriginalSRT(content);
    };
    reader.readAsText(file);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOriginalSRT(e.target.value);
    setConvertedSRT("");
    setError("");
  };

  const handleConvert = async () => {
    if (!originalSRT.trim()) {
      setError("Please paste or upload SRT content first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ srtContent: originalSRT }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Conversion failed");
      }

      setConvertedSRT(data.convertedSRT);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!convertedSRT) return;

    const blob = new Blob([convertedSRT], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName
      ? fileName.replace(".srt", "_hinglish.srt")
      : "converted_hinglish.srt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!convertedSRT) return;
    await navigator.clipboard.writeText(convertedSRT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setOriginalSRT("");
    setConvertedSRT("");
    setFileName("");
    setError("");
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Left Panel - Input Area */}
        <div className="flex-1 flex flex-col border-r border-border">
          {/* Header */}
          <header className="px-8 py-6 border-b border-border">
            <h1
              className="text-3xl font-semibold text-foreground tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Hindi → Hinglish
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste or upload Devanagari Hindi SRT content
            </p>
          </header>

          {/* Text Area */}
          <div className="flex-1 p-6">
            <textarea
              value={originalSRT}
              onChange={handleTextChange}
              placeholder={`Paste your SRT content here...

Example:
1
00:00:01,000 --> 00:00:03,000
तुम कैसे हो?

2
00:00:04,000 --> 00:00:06,000
मुझे देर हो गई`}
              className="w-full h-full resize-none rounded-xl border border-border bg-card p-6 text-foreground font-mono text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Convert Button */}
          <div className="px-6 pb-6">
            <button
              onClick={handleConvert}
              disabled={isLoading || !originalSRT.trim()}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-primary py-4 text-lg font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Converting...
                </>
              ) : (
                "Convert to Hinglish"
              )}
            </button>
          </div>
        </div>

        {/* Right Panel - Actions & Output */}
        <div className="w-96 flex flex-col bg-card/50">
          {/* Actions Header */}
          <div className="px-6 py-6 border-b border-border">
            <h2
              className="text-lg font-medium text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Actions
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="p-6 space-y-3">
            {/* Upload */}
            <label className="flex items-center gap-3 w-full cursor-pointer rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-accent">
              <Upload className="h-5 w-5 text-primary" />
              <span>Upload .srt file</span>
              <input
                type="file"
                accept=".srt"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>

            {fileName && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="truncate">{fileName}</span>
              </div>
            )}

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={!convertedSRT}
              className="flex items-center gap-3 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="h-5 w-5 text-primary" />
              <span>Download converted</span>
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              disabled={!convertedSRT}
              className="flex items-center gap-3 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 text-primary" />
                  <span>Copy to clipboard</span>
                </>
              )}
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              disabled={!originalSRT && !convertedSRT}
              className="flex items-center gap-3 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className="h-5 w-5 text-primary" />
              <span>Reset</span>
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Output Preview */}
          <div className="flex-1 flex flex-col px-6 pb-6 pt-3">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Output Preview
            </h3>
            <div className="flex-1 rounded-xl border border-border bg-card p-4 overflow-auto">
              {convertedSRT ? (
                <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                  {convertedSRT}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">
                  Converted output will appear here...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
