"use client";

import { useState, useCallback } from "react";
import { getTTSProvider } from "@/lib/feature-flags";
import { useAudioPlayback } from "./useAudioPlayback";
import { useSmallestTTS } from "./useSmallestTTS";
import type { TTSProvider } from "@/types";

interface UseUnifiedTTSProps {
  onPlaybackEnd?: () => void;
}

export function useUnifiedTTS({ onPlaybackEnd }: UseUnifiedTTSProps = {}) {
  const [activeProvider, setActiveProvider] = useState<TTSProvider>(getTTSProvider);
  const [hasFallenBack, setHasFallenBack] = useState(false);

  const elevenLabs = useAudioPlayback({ onPlaybackEnd });
  const smallest = useSmallestTTS();

  /** Speak text using Smallest AI TTS with fallback chain. */
  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (activeProvider === "smallest") {
        try {
          await smallest.speak(text);
          onPlaybackEnd?.();
          return;
        } catch (err) {
          console.warn("[UnifiedTTS] Smallest AI TTS failed, falling back:", err);
          setActiveProvider("elevenlabs");
          setHasFallenBack(true);
          // Fall through to ElevenLabs/browser below
        }
      }

      // For "elevenlabs" provider, the caller passes an audio blob from the API.
      // This method is only used when the caller has text but no blob (Smallest path).
      // Fall all the way to browser TTS.
      await elevenLabs.playFallbackTTS(text);
    },
    [activeProvider, smallest, elevenLabs, onPlaybackEnd]
  );

  /** Play an audio blob (from ElevenLabs API response). */
  const playAudio = useCallback(
    async (blob: Blob): Promise<void> => {
      await elevenLabs.playAudio(blob);
    },
    [elevenLabs]
  );

  /** Play browser fallback TTS. */
  const playFallbackTTS = useCallback(
    async (text: string): Promise<void> => {
      await elevenLabs.playFallbackTTS(text);
    },
    [elevenLabs]
  );

  const stop = useCallback(() => {
    smallest.stop();
    elevenLabs.stop();
  }, [smallest, elevenLabs]);

  const isPlaying = smallest.isPlaying || elevenLabs.isPlaying;

  /** Whether the active provider is Smallest (client-side TTS). */
  const isSmallestActive = activeProvider === "smallest";

  return {
    speak,
    playAudio,
    playFallbackTTS,
    stop,
    isPlaying,
    activeProvider,
    isSmallestActive,
    hasFallenBack,
  };
}
