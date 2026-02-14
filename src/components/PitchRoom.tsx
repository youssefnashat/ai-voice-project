"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "@/hooks/useSession";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { Scorecard as ScorecardType } from "@/types";
import { PhaseIndicator } from "./PhaseIndicator";
import { Timer } from "./Timer";
import { AgentCard } from "./AgentCard";
import { TranscriptPanel } from "./TranscriptPanel";
import { Scorecard } from "./Scorecard";

export function PitchRoom() {
  const session = useSession();
  const { playAudio, playFallbackTTS, stop: stopAudio } = useAudioPlayback();
  const [scorecard, setScorecard] = useState<ScorecardType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [silenceCount, setSilenceCount] = useState(0);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const interimRef = useRef("");
  const finalTextRef = useRef("");

  const { start: startListening, stop: stopListening, isListening, isSilent } =
    useSpeechRecognition({
      onResult: (transcript: string, isFinal: boolean) => {
        if (!isFinal) {
          // Interim results
          interimRef.current = transcript;
          session.addTranscriptEntry("user", transcript, true);
        } else {
          // Final result
          finalTextRef.current += transcript + " ";
          session.addTranscriptEntry("user", transcript.trim(), false);
          setSilenceCount(0);
        }
      },
      onError: (error: string) => {
        console.error("STT Error:", error);
        // Fallback: show text input prompt
      },
    });

  // Handle silence detection
  useEffect(() => {
    if (!isSilent || !isListening) return;

    setSilenceCount((prev) => prev + 1);
    const silenceTimer = setTimeout(() => {
      if (silenceCount > 4) {
        // 5+ seconds of silence
        handleEndTurn();
      }
    }, 1000);

    return () => clearTimeout(silenceTimer);
  }, [isSilent, isListening, silenceCount]);

  const handleEndTurn = async () => {
    if (!finalTextRef.current.trim() || isProcessing) return;

    stopListening();
    setIsProcessing(true);

    const userMessage = finalTextRef.current.trim();
    finalTextRef.current = "";
    interimRef.current = "";
    setLastUserMessage(userMessage);

    // Add to conversation history
    session.addHistoryEntry("user", userMessage);

    try {
      // Call /api/chat
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          history: session.history,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat API failed");
      }

      // Get agent text from header
      const agentText = response.headers.get("X-Agent-Text");
      if (!agentText) {
        throw new Error("No agent text in response");
      }

      const decodedAgentText = decodeURIComponent(agentText);
      session.addHistoryEntry("assistant", decodedAgentText);
      session.addTranscriptEntry("investor", decodedAgentText, false);
      session.recordExchange();

      // Play audio
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

      // Auto-restart listening
      if (session.phase !== "scorecard") {
        setTimeout(() => {
          startListening();
        }, 500);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setAgentSpeaking(false);
      // Type text fallback
      const fallback = "That's interesting. Please try again.";
      session.addTranscriptEntry("investor", fallback, false);
      session.addHistoryEntry("assistant", fallback);
      if (session.phase !== "scorecard") {
        setTimeout(() => {
          startListening();
        }, 1000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartPitch = () => {
    setScorecard(null);
    setSilenceCount(0);
    session.startPitch();
    startListening();
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
        body: JSON.stringify({
          transcript: session.transcript,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Scorecard generation failed:", error);
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
    session.reset();
  };

  // Render scorecard view
  if (scorecard) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
        <Scorecard
          scorecard={scorecard}
          onPracticeAgain={handlePracticeAgain}
        />
      </div>
    );
  }

  // Render landing page
  if (session.phase === "landing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-center space-y-6">
          <h1 className="text-6xl font-bold text-white">VoicePitch</h1>
          <p className="text-xl text-blue-100 max-w-xl">
            Practice your startup pitch with an AI investor. Voice-first, real-time feedback.
          </p>
          <button
            onClick={handleStartPitch}
            className="px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            Start Your Pitch
          </button>
          <p className="text-sm text-blue-100 mt-8">
            Powered by Mastra + Groq + ElevenLabs
          </p>
        </div>
      </div>
    );
  }

  // Render pitch room
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800">VoicePitch</h1>
          <div className="flex gap-4 items-center">
            <Timer active={isListening || agentSpeaking} onTick={session.setElapsedSeconds} />
            <PhaseIndicator phase={session.phase} />
          </div>
        </div>

        {/* Agent Card */}
        <div className="flex justify-center">
          <AgentCard
            name="Marcus Chen"
            isSpeaking={agentSpeaking}
            isListening={isListening && !agentSpeaking}
          />
        </div>

        {/* Transcript Panel */}
        <TranscriptPanel
          transcript={session.transcript}
          isListening={isListening}
          isSilent={isSilent}
        />

        {/* Controls */}
        <div className="flex justify-center gap-4">
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
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : isListening ? "Stop & Send" : "Start Speaking"}
          </button>

          <button
            onClick={handleEndCall}
            disabled={isProcessing || agentSpeaking}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-slate-400 transition-colors disabled:cursor-not-allowed"
          >
            End Call
          </button>
        </div>

        {/* Status Messages */}
        {isProcessing && (
          <p className="text-center text-slate-600 font-semibold">
            {agentSpeaking ? "Agent speaking..." : "Processing..."}
          </p>
        )}
      </div>
    </div>
  );
}
