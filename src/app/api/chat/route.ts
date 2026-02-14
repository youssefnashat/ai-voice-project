import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { ChatRequest, ConversationHistory } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { userMessage, history } = body;

    const messages: ConversationHistory[] = [
      ...history,
      { role: "user", content: userMessage },
    ];

    const agent = mastra.getAgent("investorAgent");
    const result = await agent.generate(messages as any);

    const agentText =
      result.text || "That's an interesting point. Let me think about that.";

    return NextResponse.json({ agentText });
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
