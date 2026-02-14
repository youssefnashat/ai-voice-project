import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { ChatRequest, ConversationHistory } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { userMessage, history } = body;

    // Build messages array: [...history, user's new message]
    const messages: ConversationHistory[] = [
      ...history,
      { role: "user", content: userMessage },
    ];

    // Call investor agent through Mastra
    const agent = mastra.getAgent("investorAgent");
    const result = await agent.generate(messages as any);

    const agentText = result.text || "That's an interesting point. Let me think about that.";

    // Send to ElevenLabs for TTS
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: agentText,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      console.error("ElevenLabs TTS failed:", elevenLabsResponse.statusText);
      // Return text-only fallback
      return NextResponse.json(
        { agentText },
        {
          headers: {
            "X-Agent-Text": encodeURIComponent(agentText),
          },
        }
      );
    }

    // Stream audio with agent text in header
    const audioBuffer = await elevenLabsResponse.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Agent-Text": encodeURIComponent(agentText),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);

    const fallbackText =
      "That's an interesting point. Give me a moment to think about that.";
    return NextResponse.json(
      { agentText: fallbackText, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
