// Data schemas for VoicePitch app

export type Phase = "landing" | "pitch" | "qa" | "negotiation" | "scorecard";
export type Speaker = "user" | "investor";
export type Role = "user" | "assistant";

export interface TranscriptEntry {
  id: string;
  speaker: Speaker;
  text: string;
  timestamp: number;
  isInterim?: boolean;
}

export interface ConversationHistory {
  role: Role;
  content: string;
}

export interface DimensionScore {
  score: number;
  feedback: string;
}

export interface Scorecard {
  overall_score: number;
  dimensions: {
    clarity: DimensionScore;
    market: DimensionScore;
    traction: DimensionScore;
    unit_economics: DimensionScore;
    delivery: DimensionScore;
  };
  top_weakness: string;
  rewritten_opener: string;
  improved_answer: string;
}

export interface ChatRequest {
  userMessage: string;
  history: ConversationHistory[];
}

export interface ChatResponse {
  agentText: string;
  audioUrl?: string;
}

export interface ScorecardRequest {
  transcript: TranscriptEntry[];
}
