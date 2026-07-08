"use client";

import { Type, Video } from "lucide-react";

export type Mode = "text" | "video";

const OPTIONS: { mode: Mode; label: string; icon: typeof Type }[] = [
  { mode: "text", label: "Subtitle Text", icon: Type },
  { mode: "video", label: "Video Captions", icon: Video },
];

export default function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  const activeIndex = OPTIONS.findIndex((o) => o.mode === mode);

  return (
    <div className="relative inline-flex items-center rounded-full border border-dashed border-border bg-card/80 p-1 shadow-sm backdrop-blur-sm">
      <div
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full shadow-sm transition-transform duration-300 ease-out"
        style={{
          backgroundColor: "oklch(0.65 0.18 250)",
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {OPTIONS.map(({ mode: optionMode, label, icon: Icon }) => (
        <button
          key={optionMode}
          type="button"
          onClick={() => onChange(optionMode)}
          className={`relative z-10 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ${
            mode === optionMode
              ? "text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
