"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getSTTProvider } from "@/lib/feature-flags";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useSmallestSTT } from "./useSmallestSTT";
import type { STTProvider } from "@/types";

interface UseUnifiedSTTProps {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useUnifiedSTT({ onResult, onError }: UseUnifiedSTTProps) {
  const [activeProvider, setActiveProvider] = useState<STTProvider>(getSTTProvider);
  const [hasFallenBack, setHasFallenBack] = useState(false);
  const pendingStartRef = useRef(false);

  const onSmallestError = useCallback(
    (error: string) => {
      console.warn(`[UnifiedSTT] Smallest AI failed: ${error}, falling back to browser`);
      setActiveProvider("browser");
      setHasFallenBack(true);
      pendingStartRef.current = true;
      onError?.(error);
    },
    [onError]
  );

  const browser = useSpeechRecognition({ onResult, onError });
  const smallest = useSmallestSTT({ onResult, onError: onSmallestError });

  const active = activeProvider === "smallest" ? smallest : browser;

  // Auto-start browser STT after fallback
  useEffect(() => {
    if (pendingStartRef.current && activeProvider === "browser") {
      pendingStartRef.current = false;
      browser.start();
    }
  }, [activeProvider, browser]);

  const start = useCallback(() => {
    active.start();
  }, [active]);

  const stop = useCallback(() => {
    active.stop();
  }, [active]);

  return {
    start,
    stop,
    isListening: active.isListening,
    isSilent: active.isSilent,
    activeProvider,
    hasFallenBack,
  };
}
