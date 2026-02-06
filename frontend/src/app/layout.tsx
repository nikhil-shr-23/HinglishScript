import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "boltype",
  description:
    "Convert Devanagari Hindi subtitles to Roman Hindi (Hinglish) using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
