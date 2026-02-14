import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { ScorecardRequest, Scorecard } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: ScorecardRequest = await request.json();
    const { transcript } = body;

    // Format transcript as a readable string
    const formattedTranscript = transcript
      .map((entry) => `${entry.speaker}: ${entry.text}`)
      .join("\n");

    // Call evaluator agent through Mastra
    const agent = mastra.getAgent("evaluatorAgent");
    const result = await agent.generate([
      {
        role: "user",
        content: `Evaluate this pitch conversation:\n\n${formattedTranscript}`,
      },
    ] as any);

    let scorecard: Scorecard;

    try {
      // Parse JSON from agent response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      scorecard = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse scorecard JSON:", parseError);
      console.error("Raw response:", result.text);

      // Return error with raw response for debugging
      return NextResponse.json(
        {
          error: "Failed to parse scorecard",
          raw: result.text,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(scorecard);
  } catch (error) {
    console.error("Scorecard API error:", error);
    return NextResponse.json(
      { error: "Failed to generate scorecard" },
      { status: 500 }
    );
  }
}
