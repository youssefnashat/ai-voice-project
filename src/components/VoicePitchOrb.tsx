'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VoicePitchOrbProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export default function VoicePitchOrb({ size = 120, animate = true, className }: VoicePitchOrbProps) {
  const innerSize = size / 3;

  return (
    <div 
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Outer Glow / Pulse Orb */}
      <motion.div
        animate={animate ? {
          scale: [1, 1.2, 1],
          boxShadow: [
            '0 0 20px rgba(0, 245, 255, 0.3)',
            '0 0 60px rgba(0, 245, 255, 0.6)',
            '0 0 20px rgba(0, 245, 255, 0.3)',
          ],
        } : {}}
        transition={animate ? {
          scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        } : {}}
        className="rounded-full bg-[#00F5FF]"
        style={{ width: size, height: size }}
      />
      
      {/* Separate rotation layer to avoid conflicts with pulse scale/shadow */}
      <motion.div
        animate={animate ? { rotate: 360 } : {}}
        transition={animate ? { duration: 8, repeat: Infinity, ease: 'linear' } : {}}
        className="absolute rounded-full border border-cyan-400/20 pointer-events-none"
        style={{ width: size, height: size }}
      />

      {/* Inner Orb */}
      <motion.div
        className="absolute rounded-full bg-[#00FFB2] shadow-[0_0_15px_rgba(0,255,178,0.8)]"
        style={{ width: innerSize, height: innerSize }}
      />
    </div>
  );
}
