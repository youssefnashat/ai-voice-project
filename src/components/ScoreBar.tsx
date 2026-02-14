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

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="text-xl font-bold text-blue-600">{displayScore}/10</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-500"
          style={{ width: `${(displayScore / 10) * 100}%` }}
        />
      </div>
      <p className="text-xs text-slate-600">{feedback}</p>
    </div>
  );
}
