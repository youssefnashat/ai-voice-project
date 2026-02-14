# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (hot reload)
npm run build      # Production build (includes TypeScript checking)
npm run lint       # ESLint (flat config, v9)
npm start          # Serve production build
```

No test runner is configured. TypeScript errors are caught during `npm run build`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:
- `GROQ_API_KEY` — Groq API key (powers both Mastra agents)
- `NEXT_PUBLIC_SMALLEST_API_KEY` — Smallest AI API key (STT + TTS)
- `NEXT_PUBLIC_STT_PROVIDER` — STT provider: `smallest` (default) or `browser`
- `NEXT_PUBLIC_TTS_PROVIDER` — TTS provider: `smallest` (default) or `browser`

## Architecture

**VoicePitch** is a voice-first AI startup pitch simulator. Users speak to "Marcus Chen," an AI investor, through their browser microphone. The app is Next.js 16 (App Router) + React 19 + TypeScript strict mode.

### Data Flow

```
Smallest AI Pulse WebSocket STT (client-side, 16kHz PCM)
  → useUnifiedSTT hook (wraps useSmallestSTT, auto-fallback to browser STT)
  → PitchRoom component (orchestrator, manages session state)
  → POST /api/chat { userMessage, history } with X-Skip-TTS header
  → Mastra investorAgent (Groq Llama 3.3 70B)
  → Returns JSON { agentText } (no server-side TTS)
  → Client plays via Smallest AI Lightning v2 WebSocket TTS
  → useUnifiedTTS hook (wraps useSmallestTTS, auto-fallback to browser TTS)
  → Repeat 3-4 exchanges
  → POST /api/scorecard → evaluatorAgent → JSON scorecard
```

### Key Layers

- **`src/mastra/`** — Mastra agent definitions. Two agents share `groq("llama-3.3-70b-versatile")`. The investor agent responds in <3 sentences with no markdown. The evaluator agent returns strict JSON with 5 scored dimensions.
- **`src/app/api/`** — Two POST routes. `/api/chat` calls the investor agent; returns JSON `{ agentText }` when `X-Skip-TTS: true` header present (default). `/api/scorecard` returns the evaluator's JSON scorecard.
- **`src/hooks/`** — Seven hooks: `useSession` (phase machine), `useSmallestSTT` (Pulse WebSocket STT), `useSmallestTTS` (Lightning v2 WebSocket TTS), `useUnifiedSTT` (STT with auto-fallback), `useUnifiedTTS` (TTS with fallback chain), `useSpeechRecognition` (browser STT fallback), `useAudioPlayback` (browser TTS fallback).
- **`src/lib/`** — `feature-flags.ts` (runtime STT/TTS provider selection with localStorage override), `llm-timeout.ts` (LLM response timeout tracking), `demo-script.ts` (console helpers for toggling providers).
- **`src/components/PitchRoom.tsx`** — Main orchestrator. Uses unified STT/TTS hooks, time-based silence detection (5s warning, 15s auto-end), LLM timeout status UI. Single entry point rendered by `page.tsx`.

### Phase Progression

Exchange count drives phase transitions in `useSession.recordExchange()`:
- Exchange 0 → `qa` (agent asks probing questions)
- Exchange 2 → `negotiation` (agent makes counteroffer)
- Exchange 3+ → `scorecard` (session ends)

### Styling

Tailwind CSS v4 with a custom dark theme defined in `globals.css` via CSS variables. Key design tokens: `--cyan` (#00F5FF), `--emerald` (#00FFB2), `--purple` (#7B61FF), `--red-flag` (#FF3B5C) on `--background` (#050505). Custom utility classes: `.glass-panel`, `.glow-cyan`, `.grain-hover`, `.scanline`, `.noise-overlay`. Fonts: Calistoga (display), Geist Sans (UI), Geist Mono (data). Animations use Framer Motion.

### Path Alias

`@/*` maps to `./src/*` (tsconfig.json).

## Browser Requirements

Microphone permission required. Smallest AI STT works in any modern browser. Browser SpeechRecognition fallback requires Chrome/Chromium.
