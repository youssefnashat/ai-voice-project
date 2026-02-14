"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { Scorecard as ScorecardType } from "@/types";
import { MarcusAvatar } from "./MarcusAvatar";
import { StatusHUD } from "./StatusHUD";
import { LiveDeckFeed } from "./LiveDeckFeed";
import { TranscriptPanel } from "./TranscriptPanel";
import { Scorecard } from "./Scorecard";

// Animation timing constants (snappy & responsive)
const ANIMATION = {
  pageTransition: 0.4,
  staggerDelay: 0.06,
  microInteraction: 0.15,
};

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: ANIMATION.staggerDelay,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: ANIMATION.pageTransition },
  },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: ANIMATION.pageTransition },
  },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: ANIMATION.pageTransition },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.3 },
  },
};

// Button tap feedback
const buttonTap = {
  scale: [1, 0.98, 1],
  transition: { duration: ANIMATION.microInteraction },
};

export function PitchRoom() {
  const session = useSession();
  const { playAudio, playFallbackTTS, stop: stopAudio } = useAudioPlayback();
  const [scorecard, setScorecard] = useState<ScorecardType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [silenceCount, setSilenceCount] = useState(0);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [showRoom, setShowRoom] = useState(false);
  const interimRef = useRef("");
  const finalTextRef = useRef("");

  const { start: startListening, stop: stopListening, isListening, isSilent } =
    useSpeechRecognition({
      onResult: (transcript: string, isFinal: boolean) => {
        if (!isFinal) {
          interimRef.current = transcript;
          session.addTranscriptEntry("user", transcript, true);
        } else {
          finalTextRef.current += transcript + " ";
          session.addTranscriptEntry("user", transcript.trim(), false);
          setSilenceCount(0);
        }
      },
      onError: (error: string) => {
        console.error("STT Error:", error);
      },
    });

  // Silence detection
  useEffect(() => {
    if (!isSilent || !isListening) return;

    setSilenceCount((prev) => prev + 1);
    const silenceTimer = setTimeout(() => {
      if (silenceCount > 4) {
        handleEndTurn();
      }
    }, 1000);

    return () => clearTimeout(silenceTimer);
  }, [isSilent, isListening, silenceCount]);

  const handleEndTurn = useCallback(async () => {
    if (!finalTextRef.current.trim() || isProcessing) return;

    stopListening();
    setIsProcessing(true);

    const userMessage = finalTextRef.current.trim();
    finalTextRef.current = "";
    interimRef.current = "";
    setLastUserMessage(userMessage);
    session.addHistoryEntry("user", userMessage);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          history: session.history,
        }),
      });

      if (!response.ok) throw new Error("Chat API failed");

      const agentText = response.headers.get("X-Agent-Text");
      if (!agentText) throw new Error("No agent text in response");

      const decodedAgentText = decodeURIComponent(agentText);
      session.addHistoryEntry("assistant", decodedAgentText);
      session.addTranscriptEntry("investor", decodedAgentText, false);
      session.recordExchange();

      setAgentSpeaking(true);
      try {
        const audioBlob = await response.blob();
        if (audioBlob.size > 0) {
          await playAudio(audioBlob);
        } else {
          await playFallbackTTS(decodedAgentText);
        }
      } catch (audioError) {
        console.error("Audio playback failed:", audioError);
        await playFallbackTTS(decodedAgentText);
      } finally {
        setAgentSpeaking(false);
      }

      if (session.phase !== "scorecard") {
        setTimeout(() => startListening(), 500);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setAgentSpeaking(false);
      const fallback = "That's interesting. Please try again.";
      session.addTranscriptEntry("investor", fallback, false);
      session.addHistoryEntry("assistant", fallback);
      if (session.phase !== "scorecard") {
        setTimeout(() => startListening(), 1000);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, session, stopListening, startListening, playAudio, playFallbackTTS]);

  const handleStartPitch = () => {
    setScorecard(null);
    setSilenceCount(0);
    session.startPitch();
    setShowRoom(true);
    setTimeout(() => startListening(), 1200);
  };

  const handleEndCall = () => {
    stopListening();
    stopAudio();
    session.endPitch();
    generateScorecard();
  };

  const generateScorecard = async () => {
    try {
      const response = await fetch("/api/scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: session.transcript }),
      });

      if (!response.ok) {
        console.error("Scorecard generation failed:", await response.json());
        return;
      }

      const data = await response.json();
      setScorecard(data);
    } catch (error) {
      console.error("Scorecard error:", error);
    }
  };

  const handlePracticeAgain = () => {
    setScorecard(null);
    setSilenceCount(0);
    setShowRoom(false);
    session.reset();
  };

  // ── Scorecard View ──
  if (scorecard) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Scorecard scorecard={scorecard} onPracticeAgain={handlePracticeAgain} />
      </div>
    );
  }

  // ── Landing View ──
  if (session.phase === "landing" && !showRoom) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0, 245, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Radial glow behind content */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(0, 245, 255, 0.04) 0%, rgba(123, 97, 255, 0.02) 40%, transparent 70%)",
          }}
        />

        <motion.div
          className="relative z-10 text-center space-y-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo mark */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="w-16 h-16 rounded-full border border-border-bright flex items-center justify-center glow-cyan">
              <div className="w-3 h-3 rounded-full bg-cyan animate-pulse-glow" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div variants={itemVariants}>
            <h1
              className="text-7xl font-bold tracking-tight text-glow-cyan"
              style={{ fontFamily: "var(--font-clash-display), serif" }}
            >
              <span className="text-cyan">Voice</span>
              <span className="text-foreground">Pitch</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg text-text-muted max-w-md mx-auto leading-relaxed"
          >
            Face Marcus Chen, AI Venture Capitalist.
            <br />
            <span className="text-foreground/60">Defend your startup. Secure the term sheet.</span>
          </motion.p>

          {/* Investor card preview */}
          <motion.div
            variants={scaleIn}
            className="glass-panel-bright rounded-xl p-6 max-w-sm mx-auto glow-purple"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-purple/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-purple animate-pulse-glow" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Marcus Chen</p>
                <p className="text-[11px] text-text-muted font-mono">
                  Managing Partner, Apex Ventures
                </p>
                <p className="text-[10px] text-purple/60 font-mono mt-0.5">
                  $2.4B AUM &middot; 47 exits &middot; Skeptical by default
                </p>
              </div>
            </div>
          </motion.div>

          {/* Start button */}
          <motion.div variants={itemVariants}>
            <button
              onClick={handleStartPitch}
              className="grain-hover group relative px-10 py-4 rounded-lg font-mono text-sm tracking-[0.15em] uppercase font-bold transition-all duration-300 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(0, 245, 255, 0.05))",
                border: "1px solid rgba(0, 245, 255, 0.3)",
                color: "#00F5FF",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 245, 255, 0.2), 0 0 60px rgba(0, 245, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(0, 245, 255, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "rgba(0, 245, 255, 0.3)";
              }}
            >
              Enter the Pitch Room
            </button>
          </motion.div>

          {/* Footer */}
          <motion.p
            variants={itemVariants}
            className="font-mono text-[10px] text-text-muted/40 tracking-[0.3em] uppercase"
          >
            Mastra &middot; Groq &middot; ElevenLabs
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // ── Pitch Room View ──
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 245, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0, 245, 255, 0.03) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(123, 97, 255, 0.03) 0%, transparent 60%)",
        }}
      />

      <motion.div
        className="relative z-10 flex flex-col min-h-screen"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Top Bar: Logo + HUD ── */}
        <motion.header variants={itemVariants} className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-border-bright flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan" />
            </div>
            <span
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: "var(--font-clash-display), serif" }}
            >
              <span className="text-cyan">V</span>
              <span className="text-foreground/80">P</span>
            </span>
          </div>

          <StatusHUD
            phase={session.phase}
            elapsedSeconds={session.elapsedSeconds}
            exchangeCount={session.exchangeCount}
          />

          {/* End call button */}
          <button
            onClick={handleEndCall}
            disabled={isProcessing || agentSpeaking}
            className="grain-hover px-5 py-2 rounded-md font-mono text-[10px] tracking-[0.15em] uppercase font-bold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            style={{
              background: "rgba(255, 59, 92, 0.08)",
              border: "1px solid rgba(255, 59, 92, 0.25)",
              color: "#FF3B5C",
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 59, 92, 0.15)";
                e.currentTarget.style.borderColor = "rgba(255, 59, 92, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "rgba(255, 59, 92, 0.25)";
            }}
          >
            End Pitch
          </button>
        </motion.header>

        {/* ── Main Content: Asymmetric Grid ── */}
        <div className="flex-1 px-6 pb-6 grid grid-cols-[1fr_320px] gap-5 min-h-0">
          {/* Left: Visualizer + Transcript + Controls */}
          <motion.div variants={slideInLeft} className="flex flex-col gap-5 min-h-0">
            {/* Marcus Avatar - Central Visualizer */}
            <motion.div
              variants={scaleIn}
              className="glass-panel rounded-xl flex items-center justify-center py-8 relative scanline"
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-8 h-px bg-gradient-to-r from-cyan/40 to-transparent" />
              <div className="absolute top-0 left-0 w-px h-8 bg-gradient-to-b from-cyan/40 to-transparent" />
              <div className="absolute top-0 right-0 w-8 h-px bg-gradient-to-l from-cyan/40 to-transparent" />
              <div className="absolute top-0 right-0 w-px h-8 bg-gradient-to-b from-cyan/40 to-transparent" />
              <div className="absolute bottom-0 left-0 w-8 h-px bg-gradient-to-r from-purple/30 to-transparent" />
              <div className="absolute bottom-0 left-0 w-px h-8 bg-gradient-to-t from-purple/30 to-transparent" />
              <div className="absolute bottom-0 right-0 w-8 h-px bg-gradient-to-l from-purple/30 to-transparent" />
              <div className="absolute bottom-0 right-0 w-px h-8 bg-gradient-to-t from-purple/30 to-transparent" />

              {/* Name label */}
              <div className="absolute top-4 left-5 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-cyan" />
                <span className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">
                  Marcus Chen &middot; AI Core
                </span>
              </div>

              <MarcusAvatar
                isSpeaking={agentSpeaking}
                isListening={isListening && !agentSpeaking}
                isProcessing={isProcessing}
              />
            </motion.div>

            {/* Transcript */}
            <motion.div variants={itemVariants} className="flex-1 min-h-0">
              <div className="glass-panel rounded-lg h-full flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald animate-pulse-glow" />
                  <span className="font-mono text-[10px] tracking-[0.25em] text-emerald uppercase font-bold">
                    Transcript
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <TranscriptPanel
                    transcript={session.transcript}
                    isListening={isListening}
                    isSilent={isSilent}
                  />
                </div>
              </div>
            </motion.div>

            {/* Controls */}
            <motion.div variants={itemVariants} className="flex items-center gap-4">
              <button
                onClick={
                  isListening
                    ? () => {
                        stopListening();
                        handleEndTurn();
                      }
                    : () => startListening()
                }
                disabled={isProcessing || agentSpeaking}
                className="grain-hover flex-1 py-3.5 rounded-lg font-mono text-xs tracking-[0.15em] uppercase font-bold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: isListening
                    ? "rgba(0, 255, 178, 0.1)"
                    : "rgba(0, 245, 255, 0.08)",
                  border: `1px solid ${
                    isListening ? "rgba(0, 255, 178, 0.3)" : "rgba(0, 245, 255, 0.2)"
                  }`,
                  color: isListening ? "#00FFB2" : "#00F5FF",
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.boxShadow = isListening
                      ? "0 0 25px rgba(0, 255, 178, 0.15)"
                      : "0 0 25px rgba(0, 245, 255, 0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {isProcessing
                  ? "Processing..."
                  : isListening
                  ? "Stop & Send"
                  : "Start Speaking"}
              </button>

              {/* Recording indicator */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full bg-red-flag"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <span className="font-mono text-[10px] text-red-flag tracking-wider uppercase">
                      Rec
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Right: Live Deck Feed */}
          <motion.div variants={slideInRight} className="min-h-0">
            <LiveDeckFeed transcript={session.transcript} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
