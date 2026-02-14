"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

interface FooterCTAProps {
  onEnter: () => void;
}

export function FooterCTA({ onEnter }: FooterCTAProps) {
  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-4 bg-gradient-to-b from-surface/50 to-background">
      <div className="max-w-2xl w-full text-center">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan rounded-full blur-3xl"
          />
        </div>

        {/* Main message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-8"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan/30 to-purple/30 border border-cyan/50 mb-6"
          >
            <Sparkles className="w-8 h-8 text-cyan" />
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to{" "}
            <span className="bg-gradient-to-r from-cyan via-emerald to-purple bg-clip-text text-transparent">
              Pitch to Marcus?
            </span>
          </h2>
          <p className="text-lg text-gray-400 mb-8 leading-relaxed">
            Join founders worldwide who are refining their pitches, getting real feedback, and preparing for the big stage.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-3 gap-4 mb-12"
        >
          <div className="glass-panel p-4 rounded-lg border border-cyan/20">
            <div className="text-2xl font-bold text-cyan">500+</div>
            <p className="text-xs text-gray-400">Pitches Simulated</p>
          </div>
          <div className="glass-panel p-4 rounded-lg border border-emerald/20">
            <div className="text-2xl font-bold text-emerald">4.8/5</div>
            <p className="text-xs text-gray-400">Average Feedback Score</p>
          </div>
          <div className="glass-panel p-4 rounded-lg border border-purple/20">
            <div className="text-2xl font-bold text-purple">10 min</div>
            <p className="text-xs text-gray-400">Average Session</p>
          </div>
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onEnter}
            className="px-8 py-4 bg-gradient-to-r from-cyan to-emerald text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan/50 transition-shadow duration-300 flex items-center justify-center gap-2"
          >
            Start Your Pitch Now
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 border-2 border-cyan/50 text-cyan font-semibold rounded-lg hover:bg-cyan/10 transition-colors duration-300"
          >
            Learn More
          </motion.button>
        </motion.div>

        {/* Final message */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-gray-500 text-sm font-mono"
        >
          No account needed. No credit card. Just you and Marcus.
        </motion.p>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 pt-12 border-t border-gray-800 text-center"
        >
          <p className="text-xs text-gray-500 mb-4">
            VoicePitch v2 — An AI-powered investor simulation for founders
          </p>
          <div className="flex justify-center gap-6 text-xs text-gray-600">
            <a href="#" className="hover:text-cyan transition-colors">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="#" className="hover:text-cyan transition-colors">
              Terms of Service
            </a>
            <span>•</span>
            <a href="#" className="hover:text-cyan transition-colors">
              GitHub
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
