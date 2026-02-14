export const VOICE_CONFIG = {
  // STT: Smallest AI
  SMALLEST: {
    get ENABLED() {
      if (typeof window === "undefined") return true;
      return (
        localStorage.getItem("forceSmallestSTT") !== "false" &&
        process.env.NEXT_PUBLIC_USE_SMALLEST_STT !== "false"
      );
    },
    WS_URL: "wss://waves-api.smallest.ai/api/v1/pulse/get_text",
    SAMPLE_RATE: 16000,
    LANGUAGE: "en",
    ENCODING: "linear16",
  },

  // TTS: ElevenLabs (served through /api/tts)
  ELEVENLABS: {
    get ENABLED() {
      if (typeof window === "undefined") return true;
      return (
        localStorage.getItem("forceElevenTTS") !== "false" &&
        process.env.NEXT_PUBLIC_USE_ELEVENLABS_TTS !== "false"
      );
    },
  },

  // Timeouts
  TIMEOUTS: {
    SILENCE_WARNING: 5000,
    SILENCE_AUTO_END: 15000,
    LLM: 8000,
    LLM_STALL: 15000,
  },
};
