import { NextRequest, NextResponse } from "next/server";

// Preprocess text so TTS engines produce natural human prosody
function preprocessForTTS(text: string): string {
  let t = text;

  // Make numbers sound human:
  // "$15000" → "$15K", "15000" → "15,000", etc.
  // But keep short numbers natural
  t = t.replace(/\$(\d{1,3}),?(\d{3})\b/g, (_, a, b) => {
    const num = parseInt(a + b, 10);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num}`;
  });

  // Ensure ellipses have breathing room for the pause
  t = t.replace(/\.{3}/g, "... ");

  // Em dashes get a micro-pause
  t = t.replace(/—/g, " — ");

  // Clean up double spaces
  t = t.replace(/ {2,}/g, " ");

  // Ensure final punctuation for cadence
  t = t.trim();
  if (t && !/[.!?]$/.test(t)) {
    t += ".";
  }

  return t;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
    const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5";
    const processedText = preprocessForTTS(text);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128&optimize_streaming_latency=3`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: processedText,
          model_id: modelId,
          voice_settings: {
            // ── Ultra-human preset (tuned for stock voices in quiet room) ──
            //
            // Stability: 0.45 — expressive pitch variation without wobble
            // Lower = more expressive but can get chaotic
            // Higher = more consistent but monotone
            stability: 0.45,
            //
            // Similarity: 0.80 — faithful to voice character with room for expression
            // For stock voices: 0.60-0.80 is the sweet spot
            similarity_boost: 0.80,
            //
            // Style: 0.55 — natural performance/intonation without over-acting
            // Higher if monotone, lower if over-acting
            style: 0.55,
            //
            // Speaker Boost: ON — adds clarity and vocal presence
            // Turn OFF only if it introduces harshness
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error("ElevenLabs TTS failed:", response.status, errorText);
      return NextResponse.json(
        { error: "TTS synthesis failed" },
        { status: 502 }
      );
    }

    // Stream audio back — client starts playing before full response arrives
    if (response.body) {
      return new NextResponse(response.body, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Fallback: buffer entire response
    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json(
      { error: "TTS request failed" },
      { status: 500 }
    );
  }
}
