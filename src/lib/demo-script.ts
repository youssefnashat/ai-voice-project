/**
 * Demo helpers — run in browser console.
 *
 * Toggle STT/TTS providers at runtime:
 *   toggleSTT("smallest") or toggleSTT("browser")
 *   toggleTTS("smallest") or toggleTTS("elevenlabs") or toggleTTS("browser")
 *
 * Changes take effect on next pitch session start.
 */

export function toggleSTT(provider: "browser" | "smallest") {
  localStorage.setItem("ff_stt_provider", provider);
  console.log(`[VoicePitch] STT provider set to: ${provider} (restart pitch to apply)`);
}

export function toggleTTS(provider: "elevenlabs" | "smallest" | "browser") {
  localStorage.setItem("ff_tts_provider", provider);
  console.log(`[VoicePitch] TTS provider set to: ${provider} (restart pitch to apply)`);
}

export const TEST_PITCH =
  "We're building an AI-powered code review platform that catches bugs before they ship. " +
  "We've grown to 500 paying teams in 6 months with zero ad spend — all organic and word of mouth. " +
  "Our ARR is 1.2 million and we're asking for 5 million at a 40 million valuation to expand into enterprise.";

// Attach to window for console access
if (typeof window !== "undefined") {
  (window as any).__voicepitch = { toggleSTT, toggleTTS, TEST_PITCH };
}
