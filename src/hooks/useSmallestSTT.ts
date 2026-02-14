"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getSmallestAPIKey } from "@/lib/feature-flags";

interface UseSmallestSTTProps {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

const PULSE_WS_URL = "wss://waves-api.smallest.ai/api/v1/pulse/get_text";
const SAMPLE_RATE = 16000;
const SILENCE_TIMEOUT_MS = 2000;

function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

export function useSmallestSTT({ onResult, onError }: UseSmallestSTTProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSilent, setIsSilent] = useState(false);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const cleanup = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (isListening) return;

    const apiKey = getSmallestAPIKey();
    if (!apiKey) {
      onErrorRef.current?.("Smallest AI API key not configured");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: SAMPLE_RATE, channelCount: 1, echoCancellation: true },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      // Buffer size 4096 at 16kHz = 256ms chunks
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const ws = new WebSocket(PULSE_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send config message
        ws.send(
          JSON.stringify({
            token: apiKey,
            sample_rate: SAMPLE_RATE,
            language: "en",
          })
        );

        // Start audio pipeline
        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const pcm = float32ToInt16(e.inputBuffer.getChannelData(0));
          ws.send(pcm.buffer);
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        setIsListening(true);
        setIsSilent(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.transcript) {
            // Reset silence timer on any speech
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
            }
            setIsSilent(false);

            onResultRef.current(data.transcript, !!data.is_final);

            if (data.is_final) {
              silenceTimeoutRef.current = setTimeout(() => {
                setIsSilent(true);
              }, SILENCE_TIMEOUT_MS);
            }
          }
        } catch {
          // Ignore non-JSON messages
        }
      };

      ws.onerror = () => {
        onErrorRef.current?.("Smallest AI STT WebSocket error");
        cleanup();
        setIsListening(false);
      };

      ws.onclose = () => {
        setIsListening(false);
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone access failed";
      onErrorRef.current?.(msg);
      cleanup();
    }
  }, [isListening, cleanup]);

  const stop = useCallback(() => {
    cleanup();
    setIsListening(false);
    setIsSilent(false);
  }, [cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { start, stop, isListening, isSilent };
}
