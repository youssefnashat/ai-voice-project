import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { ChatRequest, ConversationHistory } from "@/types";

// Injected after each user message to get structured confidence + decision signals
const CONFIDENCE_INSTRUCTION = `

CRITICAL — After your spoken response, on a NEW LINE output EXACTLY this format:
[CONFIDENCE:XX][DECISION:YYY]

CONFIDENCE (XX) is 0-100, how confident you are this founder can succeed:
- 0-20: Unprepared, dodging, no data, buzzwords. You're done—pass immediately.
- 21-40: Weak answers, vague metrics. Very skeptical.
- 41-60: Decent but missing proof. On the fence.
- 61-80: Solid answers, real data, clear thinker. Leaning in.
- 81-100: Exceptional. You want to invest now.

DECISION (YYY) is one of: LISTENING, LEANING_IN, INVEST, PASS
- LISTENING: Still gathering information (exchanges 1-4)
- LEANING_IN: They're doing well, you're getting excited (confidence 65+)
- INVEST: You've decided to invest (confidence 80+, you've seen enough evidence)
- PASS: You've decided to pass (confidence drops below 20, or repeated red flags)

RULES:
- Confidence MUST move at least 5 points per exchange. No stalling at the same number.
- Specific data (real revenue, real users, real growth rate) → UP 10-20 points
- Buzzwords, dodges, vague answers → DOWN 10-20 points
- Contradictions or made-up numbers → DOWN 25 points immediately
- Real user quotes or organic growth evidence → UP 15-25 points
- If confidence hits 80+ after at least 3 exchanges → set DECISION:INVEST
- If confidence drops below 20 → set DECISION:PASS immediately

These tags are stripped before TTS. The founder won't see them.`;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { userMessage, history } = body;

    const messages: ConversationHistory[] = [
      ...history,
      { role: "user", content: userMessage },
    ];

    const agent = mastra.getAgent("investorAgent");

    // Append confidence instruction to the last user message
    const messagesWithConfidence = messages.map((m, i) => {
      if (i === messages.length - 1 && m.role === "user") {
        return { ...m, content: m.content + CONFIDENCE_INSTRUCTION };
      }
      return m;
    });

    const result = await agent.generate(messagesWithConfidence as any);

    let agentText = result.text || "Hmm... give me a sec on that.";
    let confidence = 50;
    let decision = "LISTENING";

    // Extract [CONFIDENCE:XX]
    const confidenceMatch = agentText.match(/\[CONFIDENCE:(\d+)\]/);
    if (confidenceMatch) {
      confidence = Math.max(0, Math.min(100, parseInt(confidenceMatch[1], 10)));
    }

    // Extract [DECISION:XXX]
    const decisionMatch = agentText.match(/\[DECISION:(LISTENING|LEANING_IN|INVEST|PASS)\]/);
    if (decisionMatch) {
      decision = decisionMatch[1];
    }

    // Strip all tags from spoken text
    agentText = agentText
      .replace(/\s*\[CONFIDENCE:\d+\]\s*/g, "")
      .replace(/\s*\[DECISION:\w+\]\s*/g, "")
      .trim();

    // Ensure decision is consistent with confidence
    if (confidence >= 80 && decision === "LISTENING") decision = "LEANING_IN";
    if (confidence <= 20 && decision !== "PASS") decision = "PASS";

    return NextResponse.json({ agentText, confidence, decision });
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      { agentText: "Hold on... give me a sec.", confidence: 50, decision: "LISTENING", error: "Failed to process request" },
      { status: 500 }
    );
  }
}
