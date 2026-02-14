"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, Zap, BarChart3, Target, Shield } from "lucide-react";

export function JudgingCriteria() {
  const criteria = [
    {
      icon: TrendingUp,
      title: "Market Opportunity",
      desc: "Is the market big enough? Is it growing? Have you validated real demand?",
      weight: 25,
    },
    {
      icon: Users,
      title: "Team Quality",
      desc: "Can you execute? Do you have the skills and experience to win?",
      weight: 20,
    },
    {
      icon: Zap,
      title: "Product/Solution",
      desc: "Is your solution elegant? Does it solve the real problem?",
      weight: 20,
    },
    {
      icon: BarChart3,
      title: "Traction",
      desc: "Do you have users, revenue, or proven engagement metrics?",
      weight: 20,
    },
    {
      icon: Target,
      title: "Business Model",
      desc: "How do you make money? Is it defensible and scalable?",
      weight: 10,
    },
    {
      icon: Shield,
      title: "Pitch Quality",
      desc: "Can you communicate clearly? Do you inspire confidence?",
      weight: 5,
    },
  ];

  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-4 bg-gradient-to-b from-background to-surface/50">
      <div className="max-w-5xl w-full">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How Marcus Scores</h2>
          <p className="text-gray-400 text-lg">Your startup is evaluated across six dimensions. Here's the breakdown.</p>
        </motion.div>

        {/* Criteria grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-6 mb-12"
        >
          {criteria.map((crit, i) => {
            const Icon = crit.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                viewport={{ once: true, margin: "-100px" }}
                className="glass-panel p-6 rounded-lg border border-cyan/20 hover:border-cyan/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan/10 border border-cyan/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-cyan" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{crit.title}</h3>
                      <span className="text-xs font-mono text-emerald">{crit.weight}%</span>
                    </div>
                    <p className="text-sm text-gray-400">{crit.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Score scale */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true, margin: "-100px" }}
          className="glass-panel p-8 rounded-lg border border-purple/20"
        >
          <h3 className="font-semibold mb-6">Score Scale (1-10)</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400 mb-2">1-3</div>
              <p className="text-sm text-gray-400">Not investable. Significant red flags.</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">4-6</div>
              <p className="text-sm text-gray-400">Potential but needs work. Come back next quarter.</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald mb-2">7-10</div>
              <p className="text-sm text-gray-400">Fundable. Let's talk about next steps.</p>
            </div>
          </div>
        </motion.div>

        {/* Pro tip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mt-8 p-4 bg-emerald/5 border border-emerald/20 rounded-lg"
        >
          <p className="text-sm text-gray-300">
            <strong>💡 Pro tip:</strong> Marcus cares most about market opportunity and team quality. If you can show both, you're likely to score well.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
