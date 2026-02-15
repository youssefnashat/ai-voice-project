"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { TranscriptEntry, ConversationHistory, Phase } from "@/types";
import { useSmallestSTT } from "./useSmallestSTT";
import { useElevenLabsTTS } from "./useElevenLabsTTS";
import { VOICE_CONFIG } from "@/lib/voice-config";

type LLMStatus = "idle" | "thinking" | "stalling";

const STALL_MESSAGES = [
  "Hmm... give me a sec on that one.",
  "Hold on, let me think about that.",
  "One second... okay, go on.",
];

// Bluff-catching messages when confidence drops below 20
const LOW_CONFIDENCE_MESSAGES = [
  "Look... I'm going to be honest with you. I don't think you've done enough homework on this yet. The numbers aren't there, the answers are vague, and I can't see a clear path. Go back, talk to more users, get real data, and come back when you've got something concrete.",
  "Okay, I'm going to stop you here. I've heard a lot of buzzwords but not a lot of substance. That's not a pitch—that's a wish list. Go build something real, get ten paying customers, and then let's talk again.",
  "I'll be straight with you—I'm losing confidence in this. You're not ready for this conversation yet. And that's okay. Go ship something this week, talk to twenty users, come back with real numbers. I'll be here.",
];

export function useSession() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [history, setHistory] = useState<ConversationHistory[]>([]);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [silenceWarning, setSilenceWarning] = useState(false);
  const [marcusThinking, setMarcusThinking] = useState<LLMStatus>("idle");
  const [confidence, setConfidence] = useState(50);

  const stt = useSmallestSTT();
  const tts = useElevenLabsTTS();

  // Refs for accessing latest state in event handlers
  const historyRef = useRef(history);
  historyRef.current = history;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const exchangeCountRef = useRef(exchangeCount);
  exchangeCountRef.current = exchangeCount;
  const confidenceRef = useRef(confidence);
  confidenceRef.current = confidence;

  // Silence event listeners
  useEffect(() => {
    const onSilenceWarning = () => setSilenceWarning(true);
    const onSilenceTimeout = () => setSilenceWarning(false);

    window.addEventListener("stt:silence-warning", onSilenceWarning);
    window.addEventListener("stt:silence-timeout", onSilenceTimeout);

    return () => {
      window.removeEventListener("stt:silence-warning", onSilenceWarning);
      window.removeEventListener("stt:silence-timeout", onSilenceTimeout);
    };
  }, []);

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

  // Phase progression: setup (1-2) → rapid-fire (3-5) → pushback (6-7) → scorecard (8+)
  const recordExchange = useCallback(() => {
    setExchangeCount((prev) => {
      const next = prev + 1;
      if (next >= 2 && next < 5) setPhase("qa");
      else if (next >= 5 && next < 7) setPhase("negotiation");
      else if (next >= 7) setPhase("scorecard");
      return next;
    });
  }, []);

  const startPitch = useCallback(async () => {
    setPhase("pitch");
    setTranscript([]);
    setHistory([]);
    setExchangeCount(0);
    setElapsedSeconds(0);
    setSilenceWarning(false);
    setMarcusThinking("idle");
    setConfidence(50);
    await stt.startListening();
  }, [stt]);

  // Handle low confidence — agent catches the bluff, speaks dismissal, triggers scorecard
  const handleLowConfidence = useCallback(
    async (currentConfidence: number) => {
      if (currentConfidence > 20) return false;

      stt.stopListening();
      setSilenceWarning(false);
      setMarcusThinking("idle");

      const dismissal =
        LOW_CONFIDENCE_MESSAGES[
          Math.floor(Math.random() * LOW_CONFIDENCE_MESSAGES.length)
        ];

      addTranscriptEntry("investor", dismissal, false);
      addHistoryEntry("assistant", dismissal);

      // Speak the dismissal, then send to scorecard
      await tts.speak(dismissal);
      setPhase("scorecard");

      return true;
    },
    [stt, tts, addTranscriptEntry, addHistoryEntry]
  );

  const submitTurn = useCallback(async () => {
    const userText = stt.transcript.trim();
    if (!userText) return;

    stt.stopListening();
    setSilenceWarning(false);
    setMarcusThinking("idle");

    // Add user message to transcript + history
    addTranscriptEntry("user", userText, false);
    addHistoryEntry("user", userText);

    // LLM call with timeout tracking
    let thinkingTimer: ReturnType<typeof setTimeout> | null = null;
    let stallingTimer: ReturnType<typeof setTimeout> | null = null;

    thinkingTimer = setTimeout(() => {
      setMarcusThinking("thinking");
    }, VOICE_CONFIG.TIMEOUTS.LLM);

    stallingTimer = setTimeout(() => {
      setMarcusThinking("stalling");
    }, VOICE_CONFIG.TIMEOUTS.LLM_STALL);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userText,
          history: historyRef.current,
        }),
      });

      if (thinkingTimer) clearTimeout(thinkingTimer);
      if (stallingTimer) clearTimeout(stallingTimer);
      setMarcusThinking("idle");

      if (!response.ok) throw new Error("Chat API failed");

      const { agentText, confidence: newConfidence } = await response.json();
      const text = agentText || "Hmm... let me think about that for a second.";

      // Update confidence from agent's assessment
      if (typeof newConfidence === "number") {
        setConfidence(newConfidence);
      }

      addHistoryEntry("assistant", text);
      addTranscriptEntry("investor", text, false);
      recordExchange();

      // Check if confidence dropped below 20 — catch the bluff
      if (typeof newConfidence === "number" && newConfidence <= 20) {
        await tts.speak(text);
        await handleLowConfidence(newConfidence);
        return;
      }

      // Speak the response via ElevenLabs TTS
      await tts.speak(text);

      // Resume listening if not in scorecard
      if (phaseRef.current !== "scorecard") {
        stt.reset();
        await stt.startListening();
      }
    } catch (err) {
      if (thinkingTimer) clearTimeout(thinkingTimer);
      if (stallingTimer) clearTimeout(stallingTimer);
      setMarcusThinking("idle");

      console.error("Turn error:", err);
      const fallback =
        STALL_MESSAGES[Math.floor(Math.random() * STALL_MESSAGES.length)];
      addTranscriptEntry("investor", fallback, false);
      addHistoryEntry("assistant", fallback);
      await tts.speak(fallback);

      if (phaseRef.current !== "scorecard") {
        stt.reset();
        await stt.startListening();
      }
    }
  }, [stt, tts, addTranscriptEntry, addHistoryEntry, recordExchange, handleLowConfidence]);

  const endSession = useCallback(async () => {
    stt.stopListening();
    tts.stop();
    setPhase("scorecard");
    setSilenceWarning(false);
    setMarcusThinking("idle");

    try {
      const response = await fetch("/api/scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      console.error("Scorecard error:", err);
      return null;
    }
  }, [stt, tts, transcript]);

  const reset = useCallback(() => {
    stt.stopListening();
    stt.reset();
    tts.stop();
    setPhase("landing");
    setTranscript([]);
    setHistory([]);
    setExchangeCount(0);
    setElapsedSeconds(0);
    setSilenceWarning(false);
    setMarcusThinking("idle");
    setConfidence(50);
  }, [stt, tts]);

  return {
    // Session state
    phase,
    transcript,
    history,
    exchangeCount,
    elapsedSeconds,
    setElapsedSeconds,
    confidence,

    // STT state
    sttTranscript: stt.transcript,
    interimTranscript: stt.interimTranscript,
    isListening: stt.state === "listening",
    sttState: stt.state,
    usingFallbackSTT: stt.usingFallback,

    // TTS state
    isSpeaking: tts.isPlaying,
    ttsState: tts.state,
    usingFallbackTTS: tts.usingFallback,

    // UI state
    silenceWarning,
    marcusThinking,

    // Actions
    startPitch,
    submitTurn,
    endSession,
    reset,
    addTranscriptEntry,
    addHistoryEntry,
    stopListening: stt.stopListening,
  };
}
