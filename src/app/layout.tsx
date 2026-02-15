import type { Metadata } from "next";
import { Geist, Geist_Mono, Calistoga } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const clashDisplay = Calistoga({
  variable: "--font-clash-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "VoicePitch - AI Voice Pitch Simulator",
  description: "Practice your startup pitch with an AI investor. Real-time voice feedback powered by Mastra and Groq.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${clashDisplay.variable} antialiased bg-background text-foreground`}
      >
        <div className="noise-overlay" />
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
