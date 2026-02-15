"use client";

import { motion } from "framer-motion";
import { Phase } from "@/types";

interface StatusHUDProps {
  phase: Phase;
  elapsedSeconds: number;
  maxSeconds?: number;
  exchangeCount: number;
  confidence: number;
}

const PHASE_LABELS: Record<Phase, string> = {
  landing: "STANDBY",
  pitch: "SETUP",
  qa: "RAPID-FIRE",
  negotiation: "PUSHBACK",
  scorecard: "DEBRIEF",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getConfidenceColor(confidence: number): string {
  if (confidence <= 20) return "#FF3B5C"; // red — danger zone
  if (confidence <= 40) return "#FF8C42"; // orange — skeptical
  if (confidence <= 60) return "#00F5FF"; // cyan — neutral
  if (confidence <= 80) return "#00FFB2"; // green — interested
  return "#00FFB2"; // bright green — very interested
}

export function StatusHUD({ phase, elapsedSeconds, maxSeconds = 300, exchangeCount, confidence }: StatusHUDProps) {
  const timeRemaining = Math.max(0, maxSeconds - elapsedSeconds);
  const timePercent = (timeRemaining / maxSeconds) * 100;
  const isLowTime = timeRemaining < 60;
  const isLowConfidence = confidence <= 20;
  const confidenceColor = getConfidenceColor(confidence);

  return (
    <motion.div
      className="glass-panel rounded-lg px-5 py-3 flex items-center gap-6 font-mono text-xs"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      {/* Phase indicator */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse-glow" />
        <span className="text-cyan tracking-[0.2em] text-[10px] font-bold">
          {PHASE_LABELS[phase]}
        </span>
      </div>

      <div className="w-px h-6 bg-border-bright" />

      {/* Time remaining */}
      <div className="flex items-center gap-3">
        <span className="text-text-muted tracking-widest text-[10px] uppercase">Time</span>
        <span className={`tabular-nums tracking-wider font-bold ${isLowTime ? "text-red-flag" : "text-foreground"}`}>
          {formatTime(timeRemaining)}
        </span>
        <div className="w-20 h-1 bg-surface-elevated rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isLowTime
                ? "linear-gradient(90deg, #FF3B5C, #FF6B7F)"
                : "linear-gradient(90deg, #00F5FF, #00FFB2)",
            }}
            animate={{ width: `${timePercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="w-px h-6 bg-border-bright" />

      {/* Investor Confidence — now dynamic from LLM */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <span className="text-text-muted tracking-widest text-[10px] uppercase">
          {isLowConfidence ? "LOSING INTEREST" : "Confidence"}
        </span>
        <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${confidenceColor}88, ${confidenceColor})`,
            }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <motion.span
          className="font-bold tabular-nums text-[10px]"
          style={{ color: confidenceColor }}
          animate={isLowConfidence ? { opacity: [1, 0.4, 1] } : {}}
          transition={isLowConfidence ? { duration: 0.8, repeat: Infinity } : {}}
        >
          {confidence}%
        </motion.span>
      </div>

      <div className="w-px h-6 bg-border-bright" />

      {/* Exchange count */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted tracking-widest text-[10px] uppercase">Round</span>
        <span className="text-foreground font-bold tabular-nums">{exchangeCount}</span>
      </div>
    </motion.div>
  );
}
