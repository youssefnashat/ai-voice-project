"use client";

import { useState, useRef, useCallback } from "react";

export type LLMStatus = "idle" | "thinking" | "stalling";

const THINKING_DELAY_MS = 8000;
const STALLING_DELAY_MS = 15000;

const STALL_MESSAGES = [
  "That's a deep question — give me a second.",
  "I want to give you a thoughtful response. One moment.",
  "Interesting angle. Let me think about that.",
  "Hold on, I'm weighing a few things here.",
];

export function useLLMTimeout() {
  const [status, setStatus] = useState<LLMStatus>("idle");
  const thinkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stallingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (thinkingTimer.current) {
      clearTimeout(thinkingTimer.current);
      thinkingTimer.current = null;
    }
    if (stallingTimer.current) {
      clearTimeout(stallingTimer.current);
      stallingTimer.current = null;
    }
    setStatus("idle");
  }, []);

  const startTimer = useCallback(() => {
    clearTimers();
    thinkingTimer.current = setTimeout(() => {
      setStatus("thinking");
    }, THINKING_DELAY_MS);
    stallingTimer.current = setTimeout(() => {
      setStatus("stalling");
    }, STALLING_DELAY_MS);
  }, [clearTimers]);

  const getStallMessage = useCallback(() => {
    return STALL_MESSAGES[Math.floor(Math.random() * STALL_MESSAGES.length)];
  }, []);

  /** Wraps a fetch call with timeout tracking. Does NOT abort the fetch. */
  const fetchWithTimeout = useCallback(
    async (url: string, options?: RequestInit): Promise<Response> => {
      startTimer();
      try {
        const response = await fetch(url, options);
        return response;
      } finally {
        clearTimers();
      }
    },
    [startTimer, clearTimers]
  );

  return { status, fetchWithTimeout, clearTimers, getStallMessage };
}
