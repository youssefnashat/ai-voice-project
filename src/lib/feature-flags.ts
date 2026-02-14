import { STTProvider, TTSProvider } from "@/types";

const ENV_STT: STTProvider =
  (process.env.NEXT_PUBLIC_STT_PROVIDER as STTProvider) || "browser";
const ENV_TTS: TTSProvider =
  (process.env.NEXT_PUBLIC_TTS_PROVIDER as TTSProvider) || "elevenlabs";

function readLocalStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getSTTProvider(): STTProvider {
  const override = readLocalStorage("ff_stt_provider");
  if (override === "browser" || override === "smallest") return override;
  return ENV_STT;
}

export function getTTSProvider(): TTSProvider {
  const override = readLocalStorage("ff_tts_provider");
  if (override === "elevenlabs" || override === "smallest" || override === "browser")
    return override;
  return ENV_TTS;
}

export function getSmallestAPIKey(): string {
  return process.env.NEXT_PUBLIC_SMALLEST_API_KEY || "";
}
