"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  Loader2,
  AlertCircle,
  Video,
  Wand2,
  Languages,
  Film,
} from "lucide-react";
import { srtToVTT } from "@/lib/srt-parser";
import ModeSwitcher, { type Mode } from "@/components/ModeSwitcher";

type CaptionLang = "original" | "hinglish";

export default function VideoCaptions({
  mode,
  onModeChange,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [originalSRT, setOriginalSRT] = useState("");
  const [hinglishSRT, setHinglishSRT] = useState("");
  const [activeLang, setActiveLang] = useState<CaptionLang>("original");
  const [vttUrl, setVttUrl] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSRT = activeLang === "hinglish" ? hinglishSRT : originalSRT;

  const rebuildTrack = useCallback((srt: string) => {
    setVttUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      const vtt = srtToVTT(srt);
      const blob = new Blob([vtt], { type: "text/vtt" });
      return URL.createObjectURL(blob);
    });
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Please upload a valid video file");
      return;
    }

    setVideoFile(file);
    setVideoUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return URL.createObjectURL(file);
    });
    setOriginalSRT("");
    setHinglishSRT("");
    setVttUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return "";
    });
    setActiveLang("original");
    setError("");
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleGenerateCaptions = async () => {
    if (!videoFile) return;

    setIsTranscribing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("video", videoFile);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Auto-captioning failed");
      }

      setOriginalSRT(data.srt);
      setHinglishSRT("");
      setActiveLang("original");
      rebuildTrack(data.srt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auto-captioning failed");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleConvertToHinglish = async () => {
    if (!originalSRT) return;

    setIsConverting(true);
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

      setHinglishSRT(data.convertedSRT);
      setActiveLang("hinglish");
      rebuildTrack(data.convertedSRT);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setIsConverting(false);
    }
  };

  const handleToggleLang = (lang: CaptionLang) => {
    const srt = lang === "hinglish" ? hinglishSRT : originalSRT;
    if (!srt) return;
    setActiveLang(lang);
    rebuildTrack(srt);
  };

  const handleDownloadSRT = () => {
    if (!activeSRT) return;

    const blob = new Blob([activeSRT], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const suffix = activeLang === "hinglish" ? "_hinglish" : "_captions";
    a.download = videoFile
      ? `${videoFile.name.replace(/\.[^/.]+$/, "")}${suffix}.srt`
      : `captions${suffix}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBurnCaptions = async () => {
    if (!videoFile || !activeSRT) return;

    setIsBurning(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("srt", activeSRT);

      const response = await fetch("/api/burn-captions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add captions to the video");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = videoFile.name.replace(/\.[^/.]+$/, "") + "_captioned.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add captions to the video",
      );
    } finally {
      setIsBurning(false);
    }
  };

  const trackKey = useMemo(
    () => `${vttUrl}-${activeLang}`,
    [vttUrl, activeLang],
  );

  return (
    <div className="flex h-screen">
      {/* Left Panel - Video Preview */}
      <div className="flex-1 flex flex-col border-r border-dashed border-border">
        <header className="px-8 py-6 border-b border-dashed border-border flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight italic">
              Boltype
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a video and auto-generate synced Hindi or Hinglish captions
            </p>
          </div>
          <ModeSwitcher mode={mode} onChange={onModeChange} />
        </header>

        <div className="flex-1 p-6 flex items-center justify-center">
          {videoUrl ? (
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              className="max-h-full max-w-full rounded-xl border border-dashed border-border bg-black"
            >
              {vttUrl && (
                <track
                  key={trackKey}
                  kind="subtitles"
                  src={vttUrl}
                  srcLang={activeLang === "hinglish" ? "en" : "hi"}
                  label={activeLang === "hinglish" ? "Hinglish" : "Original"}
                  default
                />
              )}
            </video>
          ) : (
            // biome-ignore lint/a11y/useSemanticElements: acts as a styled drop target, not a real button
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  fileInputRef.current?.click();
              }}
              className="w-full h-full flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card cursor-pointer hover:bg-accent/50 hover:border-accent transition-all"
            >
              <Film className="h-10 w-10 text-primary" />
              <p className="text-sm text-muted-foreground">
                Drag & drop a video, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handleGenerateCaptions}
            disabled={!videoFile || isTranscribing}
            className="w-full flex items-center justify-center gap-3 rounded-xl py-4 text-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "oklch(0.65 0.18 250)" }}
          >
            {isTranscribing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating captions...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" />
                Auto-generate captions
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Panel - Actions & Output */}
      <div className="w-96 flex flex-col bg-card/50">
        <div className="px-6 py-6 border-b border-dashed border-border">
          <h2
            className="text-lg font-medium text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Actions
          </h2>
        </div>

        <div className="p-6 space-y-3">
          <label className="flex items-center gap-3 w-full cursor-pointer rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-accent">
            <Upload className="h-5 w-5 text-primary" />
            <span>{videoFile ? "Replace video" : "Upload video"}</span>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>

          {videoFile && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border bg-secondary/50 text-sm text-muted-foreground">
              <Video className="h-4 w-4 shrink-0" />
              <span className="truncate">{videoFile.name}</span>
            </div>
          )}

          {originalSRT && (
            <button
              onClick={handleConvertToHinglish}
              disabled={isConverting}
              className="flex items-center gap-3 w-full rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConverting ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <Languages className="h-5 w-5 text-primary" />
              )}
              <span>Convert captions to Hinglish</span>
            </button>
          )}

          {(originalSRT || hinglishSRT) && (
            <div className="flex rounded-xl border border-dashed border-border overflow-hidden text-sm">
              <button
                onClick={() => handleToggleLang("original")}
                disabled={!originalSRT}
                className={`flex-1 py-2 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeLang === "original"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                Original
              </button>
              <button
                onClick={() => handleToggleLang("hinglish")}
                disabled={!hinglishSRT}
                className={`flex-1 py-2 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeLang === "hinglish"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                Hinglish
              </button>
            </div>
          )}

          <button
            onClick={handleDownloadSRT}
            disabled={!activeSRT}
            className="flex items-center gap-3 w-full rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="h-5 w-5 text-primary" />
            <span>Download captions (.srt)</span>
          </button>

          <button
            onClick={handleBurnCaptions}
            disabled={!activeSRT || isBurning}
            className="flex items-center gap-3 w-full rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isBurning ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            ) : (
              <Film className="h-5 w-5 text-primary" />
            )}
            <span>
              {isBurning
                ? "Adding captions to video..."
                : "Download video with captions"}
            </span>
          </button>
        </div>

        {error && (
          <div className="mx-6 flex items-center gap-2 rounded-lg border border-dashed border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="px-6 pb-6 pt-3">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Caption Preview
          </h3>
          <div className="h-80 rounded-xl border border-dashed border-border bg-card p-4 overflow-y-auto">
            {activeSRT ? (
              <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                {activeSRT}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">
                Generated captions will appear here...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
