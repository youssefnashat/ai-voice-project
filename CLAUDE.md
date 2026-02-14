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
- `ELEVENLABS_API_KEY` — ElevenLabs TTS key
- `ELEVENLABS_VOICE_ID` — ElevenLabs voice (default: `pNInz6obpgDQGcFmaJgB`)

## Architecture

**VoicePitch** is a voice-first AI startup pitch simulator. Users speak to "Marcus Chen," an AI investor, through their browser microphone. The app is Next.js 16 (App Router) + React 19 + TypeScript strict mode.

### Data Flow

```
Browser SpeechRecognition (client STT)
  → useSpeechRecognition hook (interim/final results, 2s silence detection)
  → PitchRoom component (orchestrator, manages session state)
  → POST /api/chat { userMessage, history }
  → Mastra investorAgent (Groq Llama 3.3 70B)
  → ElevenLabs TTS streaming (server-side, eleven_turbo_v2_5)
  → Audio blob returned to client
  → useAudioPlayback hook (with speechSynthesis fallback)
  → Repeat 3-4 exchanges
  → POST /api/scorecard → evaluatorAgent → JSON scorecard
```

### Key Layers

- **`src/mastra/`** — Mastra agent definitions. Two agents share `groq("llama-3.3-70b-versatile")`. The investor agent responds in <3 sentences with no markdown. The evaluator agent returns strict JSON with 5 scored dimensions.
- **`src/app/api/`** — Two POST routes. `/api/chat` calls the investor agent then streams ElevenLabs TTS audio back with agent text in the `X-Agent-Text` response header. `/api/scorecard` returns the evaluator's JSON scorecard.
- **`src/hooks/`** — Three hooks: `useSession` (phase machine: landing→pitch→qa→negotiation→scorecard, transcript, history), `useSpeechRecognition` (Web Speech API wrapper, auto-restart, silence detection), `useAudioPlayback` (blob playback with browser TTS fallback).
- **`src/components/PitchRoom.tsx`** — Main orchestrator. Manages the full session lifecycle, silence-triggered turn ending, API calls, and renders all sub-components. This is the single entry point rendered by `page.tsx`.

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

Chrome/Chromium required for SpeechRecognition API (client-side STT). Microphone permission needed.
