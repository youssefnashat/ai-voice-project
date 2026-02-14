"use client";

import { motion } from "framer-motion";
import { Award, Zap, Target } from "lucide-react";

export function InvestorProfile() {
  const traits = [
    { icon: Award, label: "20+ Years Experience", desc: "Invested in $2.3B in portfolio companies" },
    { icon: Zap, label: "Fast Decisions", desc: "Makes judgment calls in under 5 minutes" },
    { icon: Target, label: "Fair Assessment", desc: "Evaluates on potential, not pedigree" },
  ];

  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-4 bg-gradient-to-b from-background to-surface/50">
      <div className="max-w-4xl w-full">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Meet Your Investor</h2>
          <p className="text-gray-400 text-lg">Marcus Chen is an AI-powered investor simulation, trained on real VC patterns and decision-making insights.</p>
        </motion.div>

        {/* Marcus profile card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="glass-panel p-8 md:p-12 rounded-lg border border-cyan/20 mb-12"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Profile info */}
            <div>
              <h3 className="text-3xl font-bold mb-2">Marcus Chen</h3>
              <p className="text-cyan text-sm font-mono mb-4">Founding Partner @ Chen Ventures</p>
              <p className="text-gray-300 leading-relaxed mb-4">
                A veteran investor with a talent for spotting potential. Marcus asks tough questions but respects founders who know their market. He's seen 500+ pitches. Let him see yours.
              </p>
              <p className="text-gray-400 text-sm">
                <strong>Bias:</strong> AI/SaaS/Biotech. <strong>Check:</strong> Revenue traction or clear PMF signals.
              </p>
            </div>

            {/* Avatar placeholder */}
            <div className="flex items-center justify-center">
              <motion.div
                animate={{ boxShadow: ["0 0 20px rgba(0, 245, 255, 0.2)", "0 0 40px rgba(0, 245, 255, 0.4)", "0 0 20px rgba(0, 245, 255, 0.2)"] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-40 h-40 rounded-full bg-gradient-to-br from-cyan/30 to-purple/30 border-2 border-cyan/50 flex items-center justify-center text-cyan text-5xl font-bold"
              >
                MC
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Traits grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-6"
        >
          {traits.map((trait, i) => {
            const Icon = trait.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="glass-panel p-6 rounded-lg border border-emerald/20 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald/10 border border-emerald/30 mb-4">
                  <Icon className="w-6 h-6 text-emerald" />
                </div>
                <h4 className="font-semibold mb-2">{trait.label}</h4>
                <p className="text-sm text-gray-400">{trait.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
