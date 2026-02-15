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
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const pendingChunksRef = useRef<ArrayBuffer[]>([]);
  const streamDoneRef = useRef(false);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }

    // Clean up MediaSource
    if (
      mediaSourceRef.current &&
      mediaSourceRef.current.readyState === "open"
    ) {
      try {
        mediaSourceRef.current.endOfStream();
      } catch {
        // Already ended
      }
    }
    mediaSourceRef.current = null;
    sourceBufferRef.current = null;
    pendingChunksRef.current = [];
    streamDoneRef.current = false;

    window.speechSynthesis?.cancel();
    setState("idle");
  }, []);

  // Append buffered chunks to SourceBuffer when it's ready
  const flushPendingChunks = useCallback(() => {
    const sb = sourceBufferRef.current;
    if (!sb || sb.updating || pendingChunksRef.current.length === 0) return;

    const chunk = pendingChunksRef.current.shift();
    if (chunk) {
      try {
        sb.appendBuffer(chunk);
      } catch {
        // Buffer full or closed — skip
      }
    }
  }, []);

  // Stream audio from /api/tts using MediaSource for instant playback
  const speakWithElevenLabs = useCallback(
    async (text: string): Promise<void> => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      // Check if MediaSource streaming is supported for audio/mpeg
      const canStream =
        typeof MediaSource !== "undefined" &&
        MediaSource.isTypeSupported("audio/mpeg");

      if (canStream && response.body) {
        // ── Streaming path: play audio as chunks arrive ──
        return new Promise((resolve, reject) => {
          const mediaSource = new MediaSource();
          mediaSourceRef.current = mediaSource;
          pendingChunksRef.current = [];
          streamDoneRef.current = false;

          const audio = new Audio();
          audioRef.current = audio;
          audio.src = URL.createObjectURL(mediaSource);

          mediaSource.addEventListener(
            "sourceopen",
            async () => {
              let sourceBuffer: SourceBuffer;
              try {
                sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
                sourceBufferRef.current = sourceBuffer;
              } catch (e) {
                reject(e);
                return;
              }

              // When a chunk finishes appending, flush the next one
              sourceBuffer.addEventListener("updateend", () => {
                flushPendingChunks();

                // If stream is done and no more pending chunks, signal end
                if (
                  streamDoneRef.current &&
                  pendingChunksRef.current.length === 0 &&
                  !sourceBuffer.updating
                ) {
                  try {
                    if (mediaSource.readyState === "open") {
                      mediaSource.endOfStream();
                    }
                  } catch {
                    // Already ended
                  }
                }
              });

              // Read the response stream chunk by chunk
              const reader = response.body!.getReader();

              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  if (abortController.signal.aborted) {
                    reader.cancel();
                    return;
                  }

                  // Copy to standalone ArrayBuffer for SourceBuffer compatibility
                  const copy = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
                  pendingChunksRef.current.push(copy);

                  // Try to flush immediately if SourceBuffer isn't busy
                  if (!sourceBuffer.updating) {
                    flushPendingChunks();
                  }

                  // Start playback as soon as we have some data buffered
                  if (audio.paused && sourceBuffer.buffered.length > 0) {
                    setState("playing");
                    audio.play().catch(() => {});
                  }
                }
              } catch (err) {
                if ((err as Error).name !== "AbortError") {
                  reject(err);
                  return;
                }
              }

              // Mark stream as done — updateend handler will call endOfStream
              streamDoneRef.current = true;
              if (
                pendingChunksRef.current.length === 0 &&
                !sourceBuffer.updating
              ) {
                try {
                  if (mediaSource.readyState === "open") {
                    mediaSource.endOfStream();
                  }
                } catch {
                  // Already ended
                }
              }
            },
            { once: true }
          );

          audio.onplay = () => setState("playing");
          audio.onended = () => {
            setState("idle");
            URL.revokeObjectURL(audio.src);
            resolve();
          };
          audio.onerror = () => {
            // If streaming fails, fall through to blob fallback on next call
            setState("error");
            URL.revokeObjectURL(audio.src);
            reject(new Error("Streaming audio playback failed"));
          };
        });
      }

      // ── Blob fallback: wait for full response then play ──
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
    },
    [flushPendingChunks]
  );

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
    [stop, speakWithElevenLabs]
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
