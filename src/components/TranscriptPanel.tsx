"use client";

import { useEffect, useRef } from "react";
import { TranscriptEntry } from "@/types";

interface TranscriptPanelProps {
  transcript: TranscriptEntry[];
  isListening: boolean;
  isSilent: boolean;
}

export function TranscriptPanel({
  transcript,
  isListening,
  isSilent,
}: TranscriptPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  return (
    <div className="h-full p-4 overflow-y-auto flex flex-col">
      <div className="space-y-3 mb-4">
        {transcript.map((entry) => (
          <div key={entry.id} className="flex gap-3">
            <div
              className="w-1 rounded-full shrink-0 mt-1"
              style={{
                height: 12,
                background:
                  entry.speaker === "user"
                    ? "rgba(0, 255, 178, 0.5)"
                    : "rgba(0, 245, 255, 0.5)",
              }}
            />
            <div>
              <p
                className="text-[10px] font-mono font-bold tracking-wider uppercase mb-0.5"
                style={{
                  color:
                    entry.speaker === "user"
                      ? "rgba(0, 255, 178, 0.6)"
                      : "rgba(0, 245, 255, 0.6)",
                }}
              >
                {entry.speaker === "user" ? "You" : "Marcus Chen"}
              </p>
              <p
                className={`text-[13px] leading-relaxed ${
                  entry.isInterim
                    ? "text-text-muted italic"
                    : "text-foreground/80"
                }`}
              >
                {entry.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {isListening && !isSilent && transcript.length > 0 && (
        <p className="text-[10px] text-emerald/50 font-mono tracking-wider">
          Listening...
        </p>
      )}

      {isSilent && isListening && (
        <p className="text-[10px] text-cyan-dim font-mono tracking-wider">
          Still there? Take your time.
        </p>
      )}

      <div ref={endRef} />
    </div>
  );
}
