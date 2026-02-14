"use client";

import { useEffect, useState } from "react";

interface ScoreBarProps {
  label: string;
  score: number;
  feedback: string;
}

export function ScoreBar({ label, score, feedback }: ScoreBarProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayScore((prev) => {
        if (prev < score) return prev + 1;
        return prev;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [score]);

  const color = score >= 7 ? "#00FFB2" : score >= 4 ? "#00F5FF" : "#FF3B5C";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-foreground/80">{label}</span>
        <span className="text-lg font-bold font-mono" style={{ color }}>
          {displayScore}<span className="text-text-muted text-xs">/10</span>
        </span>
      </div>
      <div className="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(displayScore / 10) * 100}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
          }}
        />
      </div>
      <p className="text-[11px] text-text-muted leading-relaxed">{feedback}</p>
    </div>
  );
}
