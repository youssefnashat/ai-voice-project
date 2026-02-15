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

// YC-style 10-dimension scorecard
export interface ScorecardScores {
  clarity: number;
  customer_pain: number;
  solution_fit: number;
  proof: number;
  growth_wedge: number;
  retention: number;
  pricing_unit_econ: number;
  competition_moat: number;
  founder_strength: number;
  speed_of_iteration: number;
}

export interface ScorecardRisk {
  risk: string;
  evidence_quote: string;
  fix: string;
}

export interface YCFeedback {
  what_i_believe_you_are_building: string;
  what_i_need_to_believe_next: string[];
  next_7_days: string[];
}

export interface Scorecard {
  one_sentence: string;
  scores: ScorecardScores;
  top_strengths: string[];
  top_risks: ScorecardRisk[];
  yc_style_feedback: YCFeedback;
}

export interface ChatRequest {
  userMessage: string;
  history: ConversationHistory[];
}

export interface ChatResponse {
  agentText: string;
  confidence: number;
  audioUrl?: string;
}

export interface ScorecardRequest {
  transcript: TranscriptEntry[];
}
