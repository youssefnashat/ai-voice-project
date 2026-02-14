"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface MarcusAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  isProcessing: boolean;
}

const BAR_COUNT = 48;
const RING_SEGMENTS = 60;

export function MarcusAvatar({ isSpeaking, isListening, isProcessing }: MarcusAvatarProps) {
  const bars = useMemo(() =>
    Array.from({ length: BAR_COUNT }, (_, i) => ({
      id: i,
      angle: (i / BAR_COUNT) * 360,
      baseHeight: 12 + Math.sin(i * 0.5) * 6,
      delay: i * 0.02,
    })),
    []
  );

  const ringDots = useMemo(() =>
    Array.from({ length: RING_SEGMENTS }, (_, i) => ({
      id: i,
      angle: (i / RING_SEGMENTS) * 360,
      delay: i * 0.015,
    })),
    []
  );

  const state = isSpeaking ? "speaking" : isListening ? "listening" : isProcessing ? "processing" : "idle";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>
      {/* Ambient background glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 280,
          height: 280,
          background: `radial-gradient(circle, ${
            state === "speaking"
              ? "rgba(0, 245, 255, 0.12)"
              : state === "listening"
              ? "rgba(0, 255, 178, 0.08)"
              : "rgba(123, 97, 255, 0.06)"
          } 0%, transparent 70%)`,
        }}
        animate={{
          scale: state === "idle" ? [1, 1.08, 1] : state === "speaking" ? [1, 1.15, 1] : [1, 1.05, 1],
          opacity: state === "speaking" ? [0.6, 1, 0.6] : [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: state === "speaking" ? 1.2 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Outer orbital ring */}
      <div className="absolute animate-orbit" style={{ width: 300, height: 300 }}>
        <svg viewBox="0 0 300 300" className="w-full h-full">
          <circle
            cx="150"
            cy="150"
            r="145"
            fill="none"
            stroke="rgba(0, 245, 255, 0.06)"
            strokeWidth="0.5"
          />
          {ringDots.map((dot) => {
            const rad = (dot.angle * Math.PI) / 180;
            const x = 150 + Math.cos(rad) * 145;
            const y = 150 + Math.sin(rad) * 145;
            return (
              <motion.circle
                key={dot.id}
                cx={x}
                cy={y}
                r={dot.id % 6 === 0 ? 1.5 : 0.5}
                fill={dot.id % 6 === 0 ? "rgba(0, 245, 255, 0.4)" : "rgba(0, 245, 255, 0.15)"}
                animate={
                  state === "speaking"
                    ? {
                        r: dot.id % 6 === 0 ? [1.5, 3, 1.5] : [0.5, 1.2, 0.5],
                        opacity: [0.4, 1, 0.4],
                      }
                    : {}
                }
                transition={{
                  duration: 0.8,
                  delay: dot.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Inner orbital ring - counter-rotate */}
      <motion.div
        className="absolute"
        style={{ width: 240, height: 240 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 240 240" className="w-full h-full">
          <circle
            cx="120"
            cy="120"
            r="115"
            fill="none"
            stroke="rgba(123, 97, 255, 0.05)"
            strokeWidth="0.5"
            strokeDasharray="4 8"
          />
        </svg>
      </motion.div>

      {/* Core visualizer - frequency bars arranged radially */}
      <div className="absolute" style={{ width: 200, height: 200 }}>
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {bars.map((bar) => {
            const rad = (bar.angle * Math.PI) / 180;
            const innerR = 40;
            const x1 = 100 + Math.cos(rad) * innerR;
            const y1 = 100 + Math.sin(rad) * innerR;
            const outerR = innerR + bar.baseHeight;
            const x2 = 100 + Math.cos(rad) * outerR;
            const y2 = 100 + Math.sin(rad) * outerR;

            return (
              <motion.line
                key={bar.id}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={
                  state === "speaking"
                    ? "rgba(0, 245, 255, 0.8)"
                    : state === "listening"
                    ? "rgba(0, 255, 178, 0.5)"
                    : "rgba(123, 97, 255, 0.3)"
                }
                strokeWidth={state === "speaking" ? 2.5 : 1.5}
                strokeLinecap="round"
                animate={
                  state === "speaking"
                    ? {
                        x2: [
                          100 + Math.cos(rad) * (innerR + bar.baseHeight),
                          100 + Math.cos(rad) * (innerR + bar.baseHeight * (1.5 + Math.random() * 2)),
                          100 + Math.cos(rad) * (innerR + bar.baseHeight * (0.5 + Math.random())),
                          100 + Math.cos(rad) * (innerR + bar.baseHeight),
                        ],
                        y2: [
                          100 + Math.sin(rad) * (innerR + bar.baseHeight),
                          100 + Math.sin(rad) * (innerR + bar.baseHeight * (1.5 + Math.random() * 2)),
                          100 + Math.sin(rad) * (innerR + bar.baseHeight * (0.5 + Math.random())),
                          100 + Math.sin(rad) * (innerR + bar.baseHeight),
                        ],
                        opacity: [0.6, 1, 0.8, 0.6],
                      }
                    : state === "listening"
                    ? {
                        x2: [
                          100 + Math.cos(rad) * (innerR + bar.baseHeight * 0.6),
                          100 + Math.cos(rad) * (innerR + bar.baseHeight * 1.1),
                          100 + Math.cos(rad) * (innerR + bar.baseHeight * 0.6),
                        ],
                        y2: [
                          100 + Math.sin(rad) * (innerR + bar.baseHeight * 0.6),
                          100 + Math.sin(rad) * (innerR + bar.baseHeight * 1.1),
                          100 + Math.sin(rad) * (innerR + bar.baseHeight * 0.6),
                        ],
                        opacity: [0.3, 0.6, 0.3],
                      }
                    : {
                        x2: [
                          100 + Math.cos(rad) * (innerR + bar.baseHeight * 0.7),
                          100 + Math.cos(rad) * (innerR + bar.baseHeight),
                          100 + Math.cos(rad) * (innerR + bar.baseHeight * 0.7),
                        ],
                        y2: [
                          100 + Math.sin(rad) * (innerR + bar.baseHeight * 0.7),
                          100 + Math.sin(rad) * (innerR + bar.baseHeight),
                          100 + Math.sin(rad) * (innerR + bar.baseHeight * 0.7),
                        ],
                        opacity: [0.15, 0.3, 0.15],
                      }
                }
                transition={{
                  duration: state === "speaking" ? 0.3 + Math.random() * 0.4 : state === "listening" ? 2 : 3,
                  delay: bar.delay,
                  repeat: Infinity,
                  ease: state === "speaking" ? "easeOut" : "easeInOut",
                }}
              />
            );
          })}

          {/* Central core circle */}
          <motion.circle
            cx="100"
            cy="100"
            r="20"
            fill="none"
            stroke={
              state === "speaking"
                ? "rgba(0, 245, 255, 0.5)"
                : state === "listening"
                ? "rgba(0, 255, 178, 0.3)"
                : "rgba(123, 97, 255, 0.2)"
            }
            strokeWidth="1"
            animate={{
              r: state === "speaking" ? [18, 22, 18] : [19, 21, 19],
              opacity: state === "speaking" ? [0.4, 0.8, 0.4] : [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: state === "speaking" ? 0.6 : 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Inner glow dot */}
          <motion.circle
            cx="100"
            cy="100"
            r="4"
            fill={
              state === "speaking"
                ? "rgba(0, 245, 255, 0.9)"
                : state === "listening"
                ? "rgba(0, 255, 178, 0.6)"
                : "rgba(123, 97, 255, 0.4)"
            }
            animate={{
              r: state === "speaking" ? [3, 6, 3] : [3, 5, 3],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: state === "speaking" ? 0.8 : 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </div>

      {/* Status label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          className="absolute -bottom-2 text-center"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
        >
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{
            color: state === "speaking" ? "#00F5FF" : state === "listening" ? "#00FFB2" : "#7B61FF",
          }}>
            {state === "speaking"
              ? "Marcus is speaking"
              : state === "listening"
              ? "Listening to you"
              : state === "processing"
              ? "Processing"
              : "Awaiting signal"}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
