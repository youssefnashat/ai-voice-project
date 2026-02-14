# VoicePitch v2 Implementation Guide

## Current Status: Hybrid Voice Architecture (Smallest AI STT + ElevenLabs TTS)

**Build Status:** Compiles successfully
**Dev Server:** http://localhost:3000

---

## What's Working

### Completed
- Next.js 16 + React 19 + TypeScript strict mode app structure
- Mastra (@mastra/core) agent framework integrated
  - `investorAgent` ("Marcus Chen" — investor agent)
  - `evaluatorAgent` (post-call scorecard evaluator)
- **STT:** Smallest AI Pulse WebSocket (16kHz PCM, ~64ms) with browser SpeechRecognition fallback
- **TTS:** ElevenLabs streaming via `/api/tts` server route with browser speechSynthesis fallback
- API routes:
  - `POST /api/chat` — investor response (JSON `{ agentText }`)
  - `POST /api/tts` — ElevenLabs TTS (returns audio/mpeg)
  - `POST /api/scorecard` — scorecard generation (JSON)
- React components (all typed, Tailwind styled)
  - `PitchRoom.tsx` — main orchestrator
  - `MarcusAvatar`, `StatusHUD`, `LiveDeckFeed`, `TranscriptPanel`, `Scorecard`
- `voice-config.ts` — runtime config for STT/TTS providers + timeouts with localStorage override
- Silence detection (5s warning, 15s auto-end) + LLM timeout tracking
- TypeScript data schemas in `src/types/index.ts`

### Not Yet Tested (Needs API Keys)
- Groq API calls (needs valid `GROQ_API_KEY`)
- Smallest AI STT WebSocket (needs valid `NEXT_PUBLIC_SMALLEST_API_KEY`)
- ElevenLabs TTS streaming (needs valid `ELEVENLABS_API_KEY`)
- Auto-fallback from Smallest AI STT to browser SpeechRecognition
- Auto-fallback from ElevenLabs TTS to browser speechSynthesis
- End-to-end voice flow
- Scorecard JSON parsing and rendering

---

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

```env
# .env.local (DO NOT COMMIT)
GROQ_API_KEY=gsk_xxxxx
NEXT_PUBLIC_SMALLEST_API_KEY=your_smallest_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
ELEVENLABS_MODEL_ID=eleven_turbo_v2_5
NEXT_PUBLIC_USE_SMALLEST_STT=true
NEXT_PUBLIC_USE_ELEVENLABS_TTS=true
```

### Get Keys
- **Groq:** [groq.com](https://groq.com) — sign up — API keys
- **Smallest AI:** [smallest.ai](https://smallest.ai) — sign up — API keys (STT only)
- **ElevenLabs:** [elevenlabs.io](https://elevenlabs.io) — sign up — API keys (TTS only)

### 3. Run Dev Server
```bash
npm run dev
```

Open http://localhost:3000

---

## Architecture Diagram

```
Landing (Browser)
    |
[Enter the Pitch Room Button]
    |
PitchRoom Component
    +-- useSession Hook (merged orchestrator)
    |   +-- useSmallestSTT (Smallest AI Pulse WebSocket STT, 16kHz PCM)
    |   |   +-- Fallback: Browser SpeechRecognition (Chrome only)
    |   |   +-- 5s silence -> warning, 15s -> auto-end
    |   +-- useElevenLabsTTS (calls /api/tts -> ElevenLabs streaming)
    |   |   +-- Fallback: Browser speechSynthesis
    |   +-- LLM timeout tracking (8s "thinking...", 15s stall message)
    |   +-- Phase machine: landing -> pitch -> qa -> negotiation -> scorecard
    |
    +-- User speaks -> interim + final transcript results
    |       |
    +-- Silence auto-end or manual submit triggers turn
    |       |
    +-- POST /api/chat { userMessage, history }
    |       |
    +-- Mastra investorAgent (Groq Llama 3.3 70B) -> { agentText }
    |       |
    +-- POST /api/tts { text } -> ElevenLabs audio/mpeg
    |       |
    +-- Audio playback (or browser TTS fallback)
    +-- Repeat 3-4 exchanges
            |
    [End Pitch] -> POST /api/scorecard
            |
    evaluatorAgent -> Scorecard JSON (5 dimensions)
            |
    Scorecard Component renders scores + improvements
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/mastra/index.ts` | Mastra instance, agent registration |
| `src/mastra/agents/investor-agent.ts` | Marcus Chen persona + instructions |
| `src/mastra/agents/evaluator-agent.ts` | Scorecard evaluator agent |
| `src/app/api/chat/route.ts` | Chat endpoint (LLM only, returns JSON) |
| `src/app/api/tts/route.ts` | ElevenLabs TTS endpoint (returns audio/mpeg) |
| `src/app/api/scorecard/route.ts` | Scorecard endpoint |
| `src/components/PitchRoom.tsx` | Main UI orchestrator |
| `src/hooks/useSession.ts` | Merged orchestrator: STT + TTS + LLM timeout + state |
| `src/hooks/useSmallestSTT.ts` | Smallest AI Pulse WebSocket STT + browser fallback |
| `src/hooks/useElevenLabsTTS.ts` | ElevenLabs TTS via /api/tts + browser fallback |
| `src/lib/voice-config.ts` | Runtime config + feature flags + timeouts |
| `src/types/index.ts` | TypeScript interfaces |
| `.env.example` | Template for environment variables |

---

## Testing

### Manual Testing
1. Open http://localhost:3000
2. Click "Enter the Pitch Room"
3. Grant mic permission
4. Speak: "We're building an AI-powered code reviewer"
5. See interim text in gray, final text in white
6. After silence, hear Marcus respond via ElevenLabs TTS
7. See agent response in transcript
8. Repeat 3-4 exchanges
9. Click "End Pitch"
10. See scorecard with 5 dimensions

### Error Recovery Testing
- Pause >5 seconds -> "Still listening..." warning banner
- Wait >15 seconds -> auto-end turn
- Invalid Smallest AI key -> auto-fallback to browser SpeechRecognition
- Invalid ElevenLabs key -> auto-fallback to browser speechSynthesis
- Slow LLM (>8s) -> "Marcus is thinking..." UI
- LLM stall (>15s) -> stall message fallback

### Runtime Feature Flags

Toggle via `localStorage` in browser console:

```js
localStorage.setItem('forceSmallestSTT', 'false')  // disable Smallest AI STT
localStorage.setItem('forceElevenTTS', 'false')     // disable ElevenLabs TTS
```

---

## Resources

- **Smallest AI:** https://smallest.ai/docs
- **ElevenLabs:** https://elevenlabs.io/docs
- **Groq:** https://groq.com/docs
- **Mastra:** https://mastra.ai/docs
- **Next.js:** https://nextjs.org/docs

---

**Built during AI Agents Voice Hackathon, Kitchener, Feb 13-15, 2026**
