"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { getSmallestAPIKey } from "@/lib/feature-flags";

const WAVES_WS_URL =
  "wss://waves-api.smallest.ai/api/v1/lightning-v2/get_speech/stream";
const SAMPLE_RATE = 24000;

export function useSmallestTTS() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const abortRef = useRef(false);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
    }
    return audioContextRef.current;
  }, []);

  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        const apiKey = getSmallestAPIKey();
        if (!apiKey) {
          reject(new Error("Smallest AI API key not configured"));
          return;
        }

        abortRef.current = false;
        setIsPlaying(true);

        const ctx = getAudioContext();
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const ws = new WebSocket(WAVES_WS_URL);
        const chunks: AudioBuffer[] = [];
        let nextStartTime = ctx.currentTime;

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              token: apiKey,
              text,
              voice_id: "emily",
              model: "lightning-v2",
              sample_rate: SAMPLE_RATE,
            })
          );
        };

        ws.onmessage = (event) => {
          if (abortRef.current) {
            ws.close();
            return;
          }

          try {
            const data = JSON.parse(event.data);

            if (data.audio) {
              // Decode base64 PCM to Float32
              const raw = atob(data.audio);
              const bytes = new Uint8Array(raw.length);
              for (let i = 0; i < raw.length; i++) {
                bytes[i] = raw.charCodeAt(i);
              }
              // PCM 16-bit LE → Float32
              const int16 = new Int16Array(bytes.buffer);
              const float32 = new Float32Array(int16.length);
              for (let i = 0; i < int16.length; i++) {
                float32[i] = int16[i] / 32768;
              }

              const audioBuffer = ctx.createBuffer(1, float32.length, SAMPLE_RATE);
              audioBuffer.getChannelData(0).set(float32);
              chunks.push(audioBuffer);

              // Schedule seamless playback
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);

              const when = Math.max(ctx.currentTime, nextStartTime);
              source.start(when);
              nextStartTime = when + audioBuffer.duration;
            }

            if (data.done) {
              // Wait for all audio to finish playing
              const remaining = nextStartTime - ctx.currentTime;
              setTimeout(
                () => {
                  setIsPlaying(false);
                  resolve();
                },
                Math.max(0, remaining * 1000 + 100)
              );
              ws.close();
            }
          } catch {
            // Ignore non-JSON messages
          }
        };

        ws.onerror = () => {
          setIsPlaying(false);
          reject(new Error("Smallest AI TTS WebSocket error"));
        };

        ws.onclose = () => {
          if (!abortRef.current) {
            // If closed unexpectedly, wait for queued audio
            const remaining = nextStartTime - ctx.currentTime;
            if (remaining > 0) {
              setTimeout(() => {
                setIsPlaying(false);
                resolve();
              }, remaining * 1000 + 100);
            } else {
              setIsPlaying(false);
              resolve();
            }
          }
        };
      });
    },
    [getAudioContext]
  );

  const stop = useCallback(() => {
    abortRef.current = true;
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return { speak, stop, isPlaying };
}
