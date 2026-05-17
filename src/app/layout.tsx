import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#050816",
  width: "device-width",
  initialScale: 1,
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sentra AI — AI Phishing Sentinel",
    template: "%s · Sentra AI",
  },
  description:
    "Paste any suspicious email. Sentra AI inspects headers, links and language with deterministic heuristics, then asks Gemini 2.5 Flash to explain the threat in plain English — and lets you chat with the verdict.",
  applicationName: "Sentra AI",
  authors: [{ name: "Mateusz", url: "https://github.com/Mateuszl28" }],
  keywords: [
    "phishing",
    "email security",
    "Gemini",
    "AI",
    "URL inspector",
    "Sentra",
    "cybersecurity",
    "hack the tech",
  ],
  creator: "Mateusz",
  openGraph: {
    title: "Sentra AI — Stop guessing if an email is real.",
    description:
      "Two-layer email defense: deterministic heuristics + Gemini analyst. Seven modes, instant verdict, follow-up chat.",
    type: "website",
    siteName: "Sentra AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sentra AI — Phishing Sentinel",
    description:
      "Paste any suspicious email. Get a verdict, the reasoning, and a follow-up chat in seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
