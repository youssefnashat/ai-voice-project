"use client";

import { useRef, useState } from "react";

interface UseAudioPlaybackProps {
  onPlaybackEnd?: () => void;
}

export function useAudioPlayback({ onPlaybackEnd }: UseAudioPlaybackProps = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = async (audioBlob: Blob) => {
    return new Promise<void>((resolve) => {
      try {
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);

        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          onPlaybackEnd?.();
          resolve();
        };

        audio.onerror = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          console.error("Audio playback error");
          resolve();
        };

        audioRef.current = audio;
        setIsPlaying(true);
        audio.play().catch((error) => {
          console.error("Failed to play audio:", error);
          setIsPlaying(false);
          resolve();
        });
      } catch (error) {
        console.error("Error creating audio:", error);
        resolve();
      }
    });
  };

  const playFallbackTTS = (text: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;

        utterance.onend = () => {
          setIsPlaying(false);
          onPlaybackEnd?.();
          resolve();
        };

        utterance.onerror = () => {
          setIsPlaying(false);
          resolve();
        };

        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Error with browser TTS:", error);
        resolve();
      }
    });
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return { playAudio, playFallbackTTS, stop, isPlaying };
}
