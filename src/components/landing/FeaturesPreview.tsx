"use client";

import { motion } from "framer-motion";
import { Headphones, Text, Brain, Zap, Clock, Lock } from "lucide-react";

export function FeaturesPreview() {
  const features = [
    {
      icon: Headphones,
      title: "Voice-First Interface",
      desc: "Pitch naturally. Your speech is converted to text in real-time with 2-second silence detection.",
    },
    {
      icon: Text,
      title: "Live Transcript",
      desc: "Follow along with a real-time transcript of your speech and Marcus's responses.",
    },
    {
      icon: Brain,
      title: "AI Investor Agent",
      desc: "Powered by Groq Llama 3.3, Marcus asks 500+ hours of VC wisdom in real-time.",
    },
    {
      icon: Zap,
      title: "Fast Response",
      desc: "Get Marcus's next question in under 3 seconds. No waiting, no awkward pauses.",
    },
    {
      icon: Clock,
      title: "Timed Feedback",
      desc: "Complete a full pitch + Q&A + scorecard in under 10 minutes.",
    },
    {
      icon: Lock,
      title: "Privacy First",
      desc: "Your pitch data is not shared. No recordings are saved beyond your session.",
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
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
          <p className="text-gray-400 text-lg">Everything you need for a realistic VC pitch simulation.</p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                viewport={{ once: true, margin: "-100px" }}
                className="glass-panel p-6 rounded-lg border border-emerald/20 hover:border-emerald/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-emerald/10 border border-emerald/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-emerald" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Why use this section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true, margin: "-100px" }}
          className="glass-panel p-8 md:p-12 rounded-lg border border-purple/30 bg-gradient-to-r from-purple/5 to-cyan/5"
        >
          <h3 className="text-2xl font-bold mb-4">Why Practice Here?</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="text-emerald font-bold">✓</span>
              <span>Get honest, data-driven feedback from an AI trained on real investment criteria.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald font-bold">✓</span>
              <span>Practice under pressure. Marcus asks tough follow-up questions like a real VC.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald font-bold">✓</span>
              <span>Iterate quickly. Pitch multiple times in one session and improve based on feedback.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald font-bold">✓</span>
              <span>No stakes. This is practice. Real investors aren't judging... yet.</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
