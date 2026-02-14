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
    <div className="h-64 bg-slate-50 rounded-lg border border-slate-200 p-4 overflow-y-auto flex flex-col">
      <div className="space-y-4 mb-4">
        {transcript.map((entry) => (
          <div key={entry.id}>
            <p className="text-xs font-bold text-slate-600 mb-1">
              {entry.speaker === "user" ? "You" : "Marcus Chen"}
            </p>
            <p
              className={`text-sm ${
                entry.isInterim
                  ? "text-slate-400 italic"
                  : "text-slate-900 font-medium"
              }`}
            >
              {entry.text}
            </p>
          </div>
        ))}
      </div>

      {isListening && !isSilent && transcript.length > 0 && (
        <p className="text-xs text-slate-500 italic">Listening...</p>
      )}

      {isSilent && isListening && (
        <p className="text-xs text-yellow-600 font-semibold">
          Still there? Take your time.
        </p>
      )}

      <div ref={endRef} />
    </div>
  );
}
