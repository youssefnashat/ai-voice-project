"use client";

import { motion } from "framer-motion";
import { Scorecard as ScorecardType } from "@/types";
import { ScoreBar } from "./ScoreBar";

interface ScorecardProps {
  scorecard: ScorecardType;
  onPracticeAgain: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const SCORE_LABELS: Record<string, string> = {
  clarity: "Clarity",
  customer_pain: "Customer Pain",
  solution_fit: "Solution Fit",
  proof: "Proof / Traction",
  growth_wedge: "Growth Wedge",
  retention: "Retention",
  pricing_unit_econ: "Unit Economics",
  competition_moat: "Competition / Moat",
  founder_strength: "Founder Strength",
  speed_of_iteration: "Speed of Iteration",
};

export function Scorecard({ scorecard, onPracticeAgain }: ScorecardProps) {
  const scores = scorecard.scores;
  const scoreValues = Object.values(scores);
  const overallScore = scoreValues.length > 0
    ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length * 10) / 10
    : 0;
  const overallColor = overallScore >= 7 ? "#00FFB2" : overallScore >= 4 ? "#00F5FF" : "#FF3B5C";

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto space-y-6 py-4 overflow-y-auto max-h-screen px-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header + Overall Score */}
      <motion.div variants={itemVariants} className="text-center space-y-3">
        <h2
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-clash-display), serif" }}
        >
          <span className="text-cyan">YC</span>{" "}
          <span className="text-foreground">Scorecard</span>
        </h2>
        <p className="text-sm text-text-muted max-w-md mx-auto">{scorecard.one_sentence}</p>
        <div className="inline-flex items-baseline justify-center gap-1" style={{ color: overallColor }}>
          <span className="text-6xl font-bold font-mono">{overallScore}</span>
          <span className="text-xl text-text-muted font-mono">/10</span>
        </div>
      </motion.div>

      {/* 10 Dimension Scores */}
      <motion.div variants={itemVariants} className="glass-panel rounded-xl p-5 space-y-4">
        <h3 className="font-mono text-[10px] tracking-[0.25em] text-cyan uppercase font-bold">
          Dimension Breakdown
        </h3>
        <div className="grid gap-4">
          {Object.entries(scores).map(([key, value]) => (
            <ScoreBar
              key={key}
              label={SCORE_LABELS[key] || key}
              score={value}
              feedback=""
            />
          ))}
        </div>
      </motion.div>

      {/* Top Strengths */}
      {scorecard.top_strengths && scorecard.top_strengths.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-xl p-5"
          style={{
            background: "rgba(0, 255, 178, 0.04)",
            border: "1px solid rgba(0, 255, 178, 0.12)",
          }}
        >
          <h4 className="font-mono text-[10px] tracking-[0.2em] text-emerald uppercase font-bold mb-3">
            Top Strengths
          </h4>
          <ul className="space-y-2">
            {scorecard.top_strengths.map((s, i) => (
              <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                <span className="text-emerald mt-0.5 shrink-0">+</span>
                {s}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Top Risks with Evidence */}
      {scorecard.top_risks && scorecard.top_risks.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-xl p-5"
          style={{
            background: "rgba(255, 59, 92, 0.04)",
            border: "1px solid rgba(255, 59, 92, 0.12)",
          }}
        >
          <h4 className="font-mono text-[10px] tracking-[0.2em] text-red-flag uppercase font-bold mb-3">
            Top Risks
          </h4>
          <div className="space-y-4">
            {scorecard.top_risks.map((r, i) => (
              <div key={i} className="space-y-1.5">
                <p className="text-sm text-foreground/80 font-medium flex items-start gap-2">
                  <span className="text-red-flag mt-0.5 shrink-0">!</span>
                  {r.risk}
                </p>
                {r.evidence_quote && (
                  <p className="text-[11px] text-text-muted italic ml-5 border-l border-red-flag/20 pl-3">
                    &ldquo;{r.evidence_quote}&rdquo;
                  </p>
                )}
                {r.fix && (
                  <p className="text-[11px] text-cyan/70 ml-5">
                    Fix: {r.fix}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* YC-Style Feedback */}
      {scorecard.yc_style_feedback && (
        <>
          {/* What I Believe You're Building */}
          <motion.div
            variants={itemVariants}
            className="rounded-xl p-5"
            style={{
              background: "rgba(123, 97, 255, 0.04)",
              border: "1px solid rgba(123, 97, 255, 0.12)",
            }}
          >
            <h4 className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase font-bold mb-2">
              What I Believe You&apos;re Building
            </h4>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {scorecard.yc_style_feedback.what_i_believe_you_are_building}
            </p>
          </motion.div>

          {/* What I Need to Believe Next */}
          {scorecard.yc_style_feedback.what_i_need_to_believe_next?.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="rounded-xl p-5"
              style={{
                background: "rgba(0, 245, 255, 0.04)",
                border: "1px solid rgba(0, 245, 255, 0.12)",
              }}
            >
              <h4 className="font-mono text-[10px] tracking-[0.2em] text-cyan uppercase font-bold mb-3">
                What I Need to Believe Next
              </h4>
              <ul className="space-y-2">
                {scorecard.yc_style_feedback.what_i_need_to_believe_next.map((item, i) => (
                  <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                    <span className="text-cyan mt-0.5 shrink-0">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Next 7 Days */}
          {scorecard.yc_style_feedback.next_7_days?.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="rounded-xl p-5"
              style={{
                background: "rgba(0, 245, 255, 0.06)",
                border: "1px solid rgba(0, 245, 255, 0.2)",
              }}
            >
              <h4 className="font-mono text-[10px] tracking-[0.2em] text-cyan uppercase font-bold mb-3">
                Your Next 7 Days
              </h4>
              <ul className="space-y-2">
                {scorecard.yc_style_feedback.next_7_days.map((action, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2 font-medium">
                    <span className="text-emerald mt-0.5 shrink-0">&rarr;</span>
                    {action}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </>
      )}

      {/* Practice Again */}
      <motion.div variants={itemVariants} className="text-center pb-8">
        <button
          onClick={onPracticeAgain}
          className="grain-hover px-10 py-4 rounded-lg font-mono text-sm tracking-[0.15em] uppercase font-bold transition-all duration-300 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(0, 245, 255, 0.05))",
            border: "1px solid rgba(0, 245, 255, 0.3)",
            color: "#00F5FF",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 245, 255, 0.2)";
            e.currentTarget.style.borderColor = "rgba(0, 245, 255, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.borderColor = "rgba(0, 245, 255, 0.3)";
          }}
        >
          Practice Again
        </button>
      </motion.div>
    </motion.div>
  );
}
