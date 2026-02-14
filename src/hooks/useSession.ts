"use client";

import { useState, useCallback } from "react";
import { TranscriptEntry, ConversationHistory, Phase } from "@/types";

export function useSession() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [history, setHistory] = useState<ConversationHistory[]>([]);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const addTranscriptEntry = useCallback(
    (speaker: "user" | "investor", text: string, isInterim = false) => {
      const id = `${speaker}-${Date.now()}-${Math.random()}`;
      const entry: TranscriptEntry = {
        id,
        speaker,
        text,
        timestamp: Date.now(),
        isInterim,
      };
      setTranscript((prev) => {
        // Update interim results in-place
        if (isInterim && prev.length > 0) {
          const last = prev[prev.length - 1];
          if (last.speaker === speaker && last.isInterim) {
            return [...prev.slice(0, -1), { ...last, text }];
          }
        }
        return [...prev, entry];
      });
    },
    []
  );

  const addHistoryEntry = useCallback(
    (role: "user" | "assistant", content: string) => {
      setHistory((prev) => [...prev, { role, content }]);
    },
    []
  );

  const startPitch = useCallback(() => {
    setPhase("pitch");
    setTranscript([]);
    setHistory([]);
    setExchangeCount(0);
    setElapsedSeconds(0);
  }, []);

  const endPitch = useCallback(() => {
    setPhase("scorecard");
  }, []);

  const recordExchange = useCallback(() => {
    setExchangeCount((prev) => prev + 1);

    // Update phase based on exchange count
    if (exchangeCount === 0) {
      setPhase("qa");
    } else if (exchangeCount === 2) {
      setPhase("negotiation");
    } else if (exchangeCount >= 3) {
      setPhase("scorecard");
    }
  }, [exchangeCount]);

  const reset = useCallback(() => {
    setPhase("landing");
    setTranscript([]);
    setHistory([]);
    setExchangeCount(0);
    setElapsedSeconds(0);
  }, []);

  return {
    phase,
    transcript,
    history,
    exchangeCount,
    elapsedSeconds,
    setElapsedSeconds,
    addTranscriptEntry,
    addHistoryEntry,
    startPitch,
    endPitch,
    recordExchange,
    reset,
  };
}
