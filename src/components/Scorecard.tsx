"use client";

import { Scorecard as ScorecardType } from "@/types";
import { ScoreBar } from "./ScoreBar";

interface ScorecardProps {
  scorecard: ScorecardType;
  onPracticeAgain: () => void;
}

export function Scorecard({ scorecard, onPracticeAgain }: ScorecardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Overall Score */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Your Pitch Score</h2>
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-green-400 text-white">
          <span className="text-5xl font-bold">{scorecard.overall_score}</span>
          <span className="text-2xl ml-2">/10</span>
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800">Dimension Breakdown</h3>
        <div className="grid gap-6">
          <ScoreBar
            label="Clarity"
            score={scorecard.dimensions.clarity.score}
            feedback={scorecard.dimensions.clarity.feedback}
          />
          <ScoreBar
            label="Market"
            score={scorecard.dimensions.market.score}
            feedback={scorecard.dimensions.market.feedback}
          />
          <ScoreBar
            label="Traction"
            score={scorecard.dimensions.traction.score}
            feedback={scorecard.dimensions.traction.feedback}
          />
          <ScoreBar
            label="Unit Economics"
            score={scorecard.dimensions.unit_economics.score}
            feedback={scorecard.dimensions.unit_economics.feedback}
          />
          <ScoreBar
            label="Delivery"
            score={scorecard.dimensions.delivery.score}
            feedback={scorecard.dimensions.delivery.feedback}
          />
        </div>
      </div>

      {/* Top Weakness */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-bold text-red-900 mb-2">Biggest Weakness</h4>
        <p className="text-sm text-red-800">{scorecard.top_weakness}</p>
      </div>

      {/* Improved Opener */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-900 mb-2">Rewritten Pitch Opener</h4>
        <p className="text-sm text-blue-800">{scorecard.rewritten_opener}</p>
      </div>

      {/* Improved Answer */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-bold text-green-900 mb-2">
          Better Answer to Toughest Question
        </h4>
        <p className="text-sm text-green-800">{scorecard.improved_answer}</p>
      </div>

      {/* Practice Again Button */}
      <div className="text-center">
        <button
          onClick={onPracticeAgain}
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Practice Again
        </button>
      </div>
    </div>
  );
}
