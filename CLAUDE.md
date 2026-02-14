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
- `NEXT_PUBLIC_SMALLEST_API_KEY` — Smallest AI API key (STT, client-side WebSocket)
- `ELEVENLABS_API_KEY` — ElevenLabs API key (TTS, server-side via `/api/tts`)
- `ELEVENLABS_VOICE_ID` — ElevenLabs voice ID (default: `pNInz6obpgDQGcFmaJgB`)
- `ELEVENLABS_MODEL_ID` — ElevenLabs model (default: `eleven_turbo_v2_5`)
- `NEXT_PUBLIC_USE_SMALLEST_STT` — Enable Smallest AI STT (default: `true`)
- `NEXT_PUBLIC_USE_ELEVENLABS_TTS` — Enable ElevenLabs TTS (default: `true`)

## Architecture

**VoicePitch** is a voice-first AI startup pitch simulator. Hybrid voice architecture: Smallest AI for STT, ElevenLabs for TTS. Next.js 16 (App Router) + React 19 + TypeScript strict mode.

### Data Flow

```
Smallest AI Pulse WebSocket STT (client-side, 16kHz PCM, ~64ms)
  → useSmallestSTT hook (transcript + interim, silence detection)
  → useSession hook (merged orchestrator: STT + TTS + LLM timeout + state)
  → POST /api/chat { userMessage, history } → JSON { agentText }
  → Mastra investorAgent (Groq Llama 3.3 70B)
  → POST /api/tts { text } → ElevenLabs streaming audio
  → useElevenLabsTTS hook (audio playback, browser TTS fallback)
  → Repeat 3-4 exchanges
  → POST /api/scorecard → evaluatorAgent → JSON scorecard
```

### Key Layers

- **`src/mastra/`** — Mastra agent definitions. Two agents share `groq("llama-3.3-70b-versatile")`. The investor agent responds in <3 sentences with no markdown. The evaluator agent returns strict JSON with 5 scored dimensions.
- **`src/app/api/`** — Three POST routes: `/api/chat` (LLM only, returns JSON), `/api/tts` (ElevenLabs TTS, returns audio/mpeg), `/api/scorecard` (evaluator JSON).
- **`src/hooks/useSession.ts`** — Merged orchestrator hook. Contains STT (`useSmallestSTT`), TTS (`useElevenLabsTTS`), LLM timeout tracking, silence event handling, phase machine, transcript, and history. PitchRoom delegates all logic here.
- **`src/hooks/useSmallestSTT.ts`** — Smallest AI Pulse WebSocket STT with browser SpeechRecognition fallback. Dispatches `stt:silence-warning` and `stt:silence-timeout` custom events.
- **`src/hooks/useElevenLabsTTS.ts`** — Calls `/api/tts` server route for ElevenLabs audio. Falls back to browser speechSynthesis.
- **`src/lib/voice-config.ts`** — Runtime config for STT/TTS providers, timeouts, with localStorage override support.
- **`src/components/PitchRoom.tsx`** — Main UI component. Thin orchestrator that delegates to `useSession`. Renders avatar, transcript, controls, silence warning, LLM timeout status, fallback indicators.

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
