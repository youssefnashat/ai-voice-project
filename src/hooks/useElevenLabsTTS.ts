"use client";

import { useCallback, useRef, useState } from "react";
import { VOICE_CONFIG } from "@/lib/voice-config";

export type TTSState = "idle" | "synthesizing" | "playing" | "error";

interface UseElevenLabsTTSReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  state: TTSState;
  error: string | null;
  isPlaying: boolean;
  usingFallback: boolean;
}

export function useElevenLabsTTS(): UseElevenLabsTTSReturn {
  const [state, setState] = useState<TTSState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis?.cancel();
    setState("idle");
  }, []);

  const speakWithElevenLabs = async (text: string): Promise<void> => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Call our server-side TTS route (keeps API key secure)
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setState("playing");
      audio.onended = () => {
        setState("idle");
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = () => {
        setState("error");
        URL.revokeObjectURL(audioUrl);
        reject(new Error("Audio playback failed"));
      };

      audio.play().catch(reject);
    });
  };

  const speakWithFallback = async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error("Browser TTS not supported"));
        return;
      }

      setUsingFallback(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const voice =
        voices.find((v) => v.name.includes("Google US English")) ||
        voices.find((v) => v.lang === "en-US") ||
        voices[0];
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setState("playing");
      utterance.onend = () => {
        setState("idle");
        resolve();
      };
      utterance.onerror = (e) => {
        setState("error");
        reject(e);
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  const speak = useCallback(
    async (text: string) => {
      setError(null);
      stop();

      if (VOICE_CONFIG.ELEVENLABS.ENABLED) {
        try {
          setUsingFallback(false);
          setState("synthesizing");
          await speakWithElevenLabs(text);
          return;
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          console.warn("ElevenLabs failed, falling back:", err);
        }
      }

      try {
        await speakWithFallback(text);
      } catch (err) {
        setError("TTS failed: " + (err as Error).message);
        setState("error");
      }
    },
    [stop]
  );

  return {
    speak,
    stop,
    state,
    error,
    isPlaying: state === "playing",
    usingFallback,
  };
}
