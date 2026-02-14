"use client";

import { motion } from "framer-motion";
import { Mic2, MessageCircle, FileText, CheckCircle2 } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: Mic2,
      title: "Speak Your Pitch",
      desc: "Click the mic and speak naturally. We convert your voice to text in real-time.",
      color: "cyan",
    },
    {
      icon: MessageCircle,
      title: "Marcus Responds",
      desc: "He asks tough questions, challenges your assumptions, and listens carefully.",
      color: "emerald",
    },
    {
      icon: FileText,
      title: "Live Feedback",
      desc: "See a live transcript and watch Marcus's investment thesis form.",
      color: "purple",
    },
    {
      icon: CheckCircle2,
      title: "Get Scored",
      desc: "Receive a detailed scorecard on market, team, execution, and more.",
      color: "cyan",
    },
  ];

  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-4">
      <div className="max-w-5xl w-full">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-400 text-lg">Four simple steps to pitch like a pro and get Marcus's honest feedback.</p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
              cyan: { bg: "bg-cyan/10", text: "text-cyan", border: "border-cyan/30" },
              emerald: { bg: "bg-emerald/10", text: "text-emerald", border: "border-emerald/30" },
              purple: { bg: "bg-purple/10", text: "text-purple", border: "border-purple/30" },
            };
            const color = colorClasses[step.color];

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="flex gap-6 items-start"
              >
                {/* Step number */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full ${color.bg} border ${color.border} flex items-center justify-center`}>
                  <span className={`${color.text} font-bold text-lg`}>{i + 1}</span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className={`inline-flex items-center gap-2 mb-2`}>
                    <Icon className={`w-5 h-5 ${color.text}`} />
                    <h3 className="text-xl md:text-2xl font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-gray-400">{step.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Timeline visualization */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 p-6 glass-panel rounded-lg border border-cyan/20"
        >
          <h3 className="font-semibold mb-3">Expected Timeline</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan" />
              <span>Intro: 10 seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald" />
              <span>Your pitch: 2-3 min</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple" />
              <span>Q&A: 2-3 min</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>Scorecard: 5 seconds</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
