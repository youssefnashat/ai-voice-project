"use client";

interface AgentCardProps {
  name: string;
  isSpeaking: boolean;
  isListening: boolean;
}

export function AgentCard({ name, isSpeaking, isListening }: AgentCardProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl transition-all ${
          isSpeaking
            ? "bg-green-400 scale-110 shadow-lg"
            : isListening
              ? "bg-blue-400 shadow-md"
              : "bg-slate-300"
        }`}
      >
        👤
      </div>
      <div className="text-center">
        <h3 className="font-bold text-lg">{name}</h3>
        <p className="text-xs text-slate-600 h-5">
          {isSpeaking && "Speaking..."}
          {isListening && !isSpeaking && "Listening..."}
        </p>
      </div>
    </div>
  );
}
