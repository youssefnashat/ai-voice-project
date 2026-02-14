"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface HeroSectionProps {
  onEnter: () => void;
}

export function HeroSection({ onEnter }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl text-center">
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="mb-6"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan/20 to-purple/20 border border-cyan/50">
            <Sparkles className="w-8 h-8 text-cyan" />
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan via-emerald to-purple bg-clip-text text-transparent"
        >
          Pitch to Marcus Chen
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-gray-400 mb-8 leading-relaxed"
        >
          An AI-powered investor simulation. Deliver your startup pitch, get real-time feedback, and see how you'd fare in a VC meeting.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEnter}
          className="px-8 py-4 bg-gradient-to-r from-cyan to-emerald text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan/50 transition-shadow duration-300"
        >
          Start Pitching
        </motion.button>

        {/* Floating accent */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="mt-12 text-cyan/50 text-sm font-mono"
        >
          ▼ Scroll to begin ▼
        </motion.div>
      </div>
    </section>
  );
}
