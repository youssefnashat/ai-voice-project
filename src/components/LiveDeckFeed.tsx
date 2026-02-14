"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TranscriptEntry } from "@/types";
import { useEffect, useRef, useState, useMemo } from "react";

interface InsightCard {
  id: string;
  type: "moment" | "flag" | "insight";
  label: string;
  text: string;
  timestamp: number;
}

interface LiveDeckFeedProps {
  transcript: TranscriptEntry[];
}

const FLAG_KEYWORDS = [
  "no revenue", "pre-revenue", "no traction", "no customers",
  "um", "uh", "like", "basically", "you know",
  "not sure", "i think", "maybe", "hopefully",
];

const MOMENT_KEYWORDS = [
  "million", "growth", "revenue", "users", "customers",
  "patent", "proprietary", "first-mover", "profitable",
  "partnership", "contract", "signed", "raised",
];

function analyzeEntry(entry: TranscriptEntry): InsightCard | null {
  const text = entry.text.toLowerCase();

  for (const keyword of FLAG_KEYWORDS) {
    if (text.includes(keyword)) {
      const labels: Record<string, string> = {
        "no revenue": "No Revenue Mentioned",
        "pre-revenue": "Pre-Revenue Stage",
        "no traction": "Weak Traction Signal",
        "no customers": "No Customer Base",
        "um": "Filler Words Detected",
        "uh": "Filler Words Detected",
        "like": "Hedging Language",
        "basically": "Hedging Language",
        "you know": "Filler Pattern",
        "not sure": "Uncertainty Signal",
        "i think": "Low Conviction",
        "maybe": "Uncertainty Signal",
        "hopefully": "Low Conviction",
      };
      return {
        id: `flag-${entry.id}`,
        type: "flag",
        label: labels[keyword] || "Red Flag",
        text: entry.text.length > 80 ? entry.text.slice(0, 77) + "..." : entry.text,
        timestamp: entry.timestamp,
      };
    }
  }

  for (const keyword of MOMENT_KEYWORDS) {
    if (text.includes(keyword)) {
      return {
        id: `moment-${entry.id}`,
        type: "moment",
        label: "Key Moment",
        text: entry.text.length > 80 ? entry.text.slice(0, 77) + "..." : entry.text,
        timestamp: entry.timestamp,
      };
    }
  }

  if (entry.speaker === "investor" && !entry.isInterim) {
    return {
      id: `insight-${entry.id}`,
      type: "insight",
      label: "Investor Response",
      text: entry.text.length > 80 ? entry.text.slice(0, 77) + "..." : entry.text,
      timestamp: entry.timestamp,
    };
  }

  return null;
}

export function LiveDeckFeed({ transcript }: LiveDeckFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const processedIds = useRef(new Set<string>());
  const [cards, setCards] = useState<InsightCard[]>([]);

  useEffect(() => {
    const newCards: InsightCard[] = [];
    for (const entry of transcript) {
      if (entry.isInterim || processedIds.current.has(entry.id)) continue;
      processedIds.current.add(entry.id);
      const card = analyzeEntry(entry);
      if (card) newCards.push(card);
    }
    if (newCards.length > 0) {
      setCards((prev) => [...prev, ...newCards]);
    }
  }, [transcript]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [cards]);

  const sortedCards = useMemo(() => cards.slice(-20), [cards]);

  return (
    <motion.div
      className="glass-panel rounded-lg overflow-hidden flex flex-col h-full"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-cyan animate-pulse-glow" />
          <span className="font-mono text-[10px] tracking-[0.25em] text-cyan uppercase font-bold">
            Live Deck
          </span>
        </div>
        <span className="font-mono text-[10px] text-text-muted">
          {cards.length} insights
        </span>
      </div>

      {/* Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence initial={false}>
          {sortedCards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: i > sortedCards.length - 4 ? 0.05 : 0 }}
              className="rounded-md p-3"
              style={{
                background:
                  card.type === "flag"
                    ? "rgba(255, 59, 92, 0.06)"
                    : card.type === "moment"
                    ? "rgba(0, 245, 255, 0.06)"
                    : "rgba(123, 97, 255, 0.04)",
                border: `1px solid ${
                  card.type === "flag"
                    ? "rgba(255, 59, 92, 0.2)"
                    : card.type === "moment"
                    ? "rgba(0, 245, 255, 0.15)"
                    : "rgba(123, 97, 255, 0.1)"
                }`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
                  style={{
                    color: card.type === "flag" ? "#FF3B5C" : card.type === "moment" ? "#00F5FF" : "#7B61FF",
                    background:
                      card.type === "flag"
                        ? "rgba(255, 59, 92, 0.1)"
                        : card.type === "moment"
                        ? "rgba(0, 245, 255, 0.08)"
                        : "rgba(123, 97, 255, 0.08)",
                  }}
                >
                  {card.type === "flag" ? "FLAG" : card.type === "moment" ? "KEY" : "NOTE"}
                </span>
                <span className="text-[10px] text-text-muted font-mono">{card.label}</span>
              </div>
              <p className="text-[11px] text-foreground/70 leading-relaxed">{card.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>

        {cards.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-muted text-[11px] font-mono tracking-wider">
              Insights will appear here...
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
