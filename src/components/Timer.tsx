"use client";

import { useEffect, useState } from "react";

interface TimerProps {
  active: boolean;
  onTick?: (seconds: number) => void;
}

export function Timer({ active, onTick }: TimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newVal = prev + 1;
        onTick?.(newVal);
        return newVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [active, onTick]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="text-2xl font-mono font-bold text-slate-700">
      {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}
