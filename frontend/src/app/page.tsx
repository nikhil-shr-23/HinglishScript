"use client";

import { useState, useCallback } from "react";
import { Upload, Download, Loader2, FileText, AlertCircle } from "lucide-react";

export default function Home() {
  const [originalSRT, setOriginalSRT] = useState("");
  const [convertedSRT, setConvertedSRT] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleConvert = async () => {
    if (!originalSRT) return;

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
    a.download = fileName.replace(".srt", "_hinglish.srt");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setOriginalSRT("");
    setConvertedSRT("");
    setFileName("");
    setError("");
  };

  return (
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Hindi → Hinglish SRT Converter
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Convert Devanagari Hindi subtitles to Roman Hindi (Hinglish)
          </p>
        </header>

        {/* Upload Area */}
        {!originalSRT && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all
              ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }
            `}
          >
            <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium text-foreground">
              Drop your .srt file here
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              or click to browse
            </p>
            <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Select File
              <input
                type="file"
                accept=".srt"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Area */}
        {originalSRT && (
          <>
            {/* Actions */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{fileName}</span>
              </div>

              <div className="flex gap-2 ml-auto">
                <button
                  onClick={handleReset}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Reset
                </button>

                <button
                  onClick={handleConvert}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    "Convert to Hinglish"
                  )}
                </button>

                {convertedSRT && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                )}
              </div>
            </div>

            {/* Side by Side Preview */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                  Original (Hindi)
                </h2>
                <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm text-foreground font-mono">
                  {originalSRT}
                </pre>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                  Converted (Hinglish)
                </h2>
                {convertedSRT ? (
                  <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm text-foreground font-mono">
                    {convertedSRT}
                  </pre>
                ) : (
                  <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                    {isLoading
                      ? "Converting..."
                      : 'Click "Convert to Hinglish" to start'}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
