# VoicePitch v2 Implementation Guide

## Current Status: ✅ SCAFFOLDED (Dev Server Running)

**Build Status:** ✅ Compiles successfully
**Dev Server:** ✅ Running at http://localhost:3000

---

## What's Working Right Now

### ✅ Completed
- Next.js 16 + React 19 + TypeScript strict mode app structure
- Mastra (@mastra/core) agent framework integrated
  - `investorAgent` ("Marcus Chen" — investor agent)
  - `evaluatorAgent` (post-call scorecard evaluator)
- Smallest AI voice integration
  - `useSmallestSTT` — Pulse WebSocket STT (16kHz PCM)
  - `useSmallestTTS` — Lightning v2 WebSocket TTS
  - `useUnifiedSTT` — Unified STT with browser fallback
  - `useUnifiedTTS` — Unified TTS with browser fallback
- API routes implemented
  - `POST /api/chat` — investor response (JSON with X-Skip-TTS)
  - `POST /api/scorecard` — scorecard generation
- React components (all typed, Tailwind styled)
  - `PitchRoom.tsx` — main orchestrator
  - `MarcusAvatar`, `StatusHUD`, `LiveDeckFeed`, `TranscriptPanel`, `Scorecard`
- Feature flags with runtime localStorage override (`src/lib/feature-flags.ts`)
- LLM timeout tracking with status UI (`src/lib/llm-timeout.ts`)
- TypeScript data schemas in `src/types/index.ts`
- Environment variables setup (`.env.example`, `.env.local`)

### ⚠️ Not Yet Tested
- Groq API calls (needs valid `GROQ_API_KEY` in `.env.local`)
- Smallest AI STT WebSocket (needs valid `NEXT_PUBLIC_SMALLEST_API_KEY`)
- Smallest AI TTS WebSocket (needs valid `NEXT_PUBLIC_SMALLEST_API_KEY`)
- Auto-fallback from Smallest AI to browser STT/TTS
- End-to-end voice flow
- Scorecard JSON parsing and rendering

---

## Next Steps (Priority Order)

### 1. Add API Keys & Test Connectivity
```bash
# Edit .env.local
GROQ_API_KEY=your_actual_groq_key
NEXT_PUBLIC_SMALLEST_API_KEY=your_actual_smallest_key
NEXT_PUBLIC_STT_PROVIDER=smallest
NEXT_PUBLIC_TTS_PROVIDER=smallest
```

Then test in browser console:
```javascript
// Open http://localhost:3000
// Open DevTools (F12) → Console
// Test mic permission
navigator.mediaDevices.getUserMedia({ audio: true });
```

### 2. Test Voice Loop (Manual Testing)
1. Open http://localhost:3000
2. Click "Enter the Pitch Room"
3. Accept mic permission
4. Speak: "We're building an AI-powered code reviewer"
5. Watch transcript panel fill with interim text
6. After silence, should hear Marcus Chen respond via Smallest AI TTS
7. See agent text in transcript + hear audio playback
8. Repeat 3-4 exchanges

### 3. Verify Scorecard Generation
- After 4 exchanges or "End Pitch" click
- Should POST to `/api/scorecard` with full transcript
- evaluatorAgent generates 5-dimension scorecard JSON
- UI renders scores + improvements

### 4. Bug Fixes (If Needed)

**If Groq call fails:**
- Check `GROQ_API_KEY` in `.env.local` is valid
- Check network: `curl https://api.groq.com/health`

**If Smallest AI STT/TTS fails:**
- Check `NEXT_PUBLIC_SMALLEST_API_KEY` is valid in `.env.local`
- Check browser console for WebSocket errors
- App auto-falls back to browser SpeechRecognition (STT) and browser speechSynthesis (TTS)
- Runtime toggle: `localStorage.setItem('ff_stt_provider', 'browser')` to switch

**If browser SpeechRecognition doesn't work (fallback mode):**
- Only works in Chrome/Chromium (not Firefox, Safari)
- Check mic permission in browser settings

---

## Architecture Diagram

```
Landing (Browser)
    ↓
[Enter the Pitch Room Button]
    ↓
PitchRoom Component
    ├─ useUnifiedSTT Hook
    │   ├─ Primary: Smallest AI Pulse (WebSocket STT, 16kHz PCM)
    │   └─ Fallback: Browser SpeechRecognition (Chrome only)
    │       ↓ 5s silence → warning, 15s → auto-end
    ├─ useSession Hook (React state)
    │   └─ Tracks: phase, transcript, history, exchangeCount
    ├─ useUnifiedTTS Hook
    │   ├─ Primary: Smallest AI Lightning v2 (WebSocket TTS)
    │   └─ Fallback: Browser speechSynthesis
    ├─ useLLMTimeout Hook
    │   └─ Tracks: idle → thinking (8s) → stalling (15s)
    │
    ├─ User speaks → interim + final results
    │       ↓
    ├─ [Stop & Send Button] triggers handleEndTurn()
    │       ↓
    ├─ POST /api/chat { userMessage, history } + X-Skip-TTS header
    │       ↓
    ├─ API Route
    │   ├─ Mastra.getAgent("investorAgent").generate(messages)
    │   ├─ Groq LLM inference → agentText
    │   └─ Return { agentText } JSON
    │       ↓
    ├─ Client receives agentText
    ├─ Smallest AI TTS: speak(text) via WebSocket
    ├─ Add to transcript + history
    └─ repeat 3-4 exchanges
        ↓
    [End Pitch Button] → POST /api/scorecard
        ↓
    evaluatorAgent.generate() → Scorecard JSON
        ↓
    Scorecard Component displays 5 dimensions + improvements
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/mastra/index.ts` | Mastra instance, agent registration |
| `src/mastra/agents/investor-agent.ts` | Marcus Chen persona + instructions |
| `src/mastra/agents/evaluator-agent.ts` | Scorecard evaluator agent |
| `src/app/api/chat/route.ts` | Chat endpoint + Groq (X-Skip-TTS support) |
| `src/app/api/scorecard/route.ts` | Scorecard endpoint |
| `src/components/PitchRoom.tsx` | Main UI orchestrator |
| `src/hooks/useUnifiedSTT.ts` | Unified STT (Smallest AI + browser fallback) |
| `src/hooks/useUnifiedTTS.ts` | Unified TTS (Smallest AI + browser fallback) |
| `src/hooks/useSmallestSTT.ts` | Smallest AI Pulse WebSocket STT |
| `src/hooks/useSmallestTTS.ts` | Smallest AI Lightning v2 WebSocket TTS |
| `src/hooks/useSpeechRecognition.ts` | Browser STT fallback |
| `src/hooks/useAudioPlayback.ts` | Browser TTS fallback |
| `src/hooks/useSession.ts` | Conversation state |
| `src/lib/feature-flags.ts` | Runtime STT/TTS provider selection |
| `src/lib/llm-timeout.ts` | LLM response timeout tracking |
| `src/lib/demo-script.ts` | Console helpers for toggling providers |
| `src/types/index.ts` | TypeScript interfaces |
| `.env.local` | API keys (not committed) |

---

## Testing Checklist

### Manual Testing
- [ ] Open http://localhost:3000
- [ ] Click "Enter the Pitch Room"
- [ ] Grant mic permission
- [ ] Speak test phrase: "We make AI reviewers for code"
- [ ] See interim text in gray, final text in white
- [ ] After silence, hear Marcus respond via Smallest AI TTS
- [ ] See agent response in transcript
- [ ] Repeat 3-4 times
- [ ] Click "End Pitch"
- [ ] See scorecard with 5 dimensions

### Network Testing
- [ ] DevTools → Network tab
- [ ] Verify POST /api/chat requests succeed
- [ ] Check response is JSON with agentText
- [ ] Verify WebSocket connections to waves-api.smallest.ai
- [ ] Verify POST /api/scorecard returns JSON

### Error Recovery Testing
- [ ] Deliberately pause >5 seconds → see "Still listening..." warning
- [ ] Deliberately wait >15 seconds → auto-end turn
- [ ] Use invalid Smallest AI key → verify auto-fallback to browser STT/TTS
- [ ] Runtime toggle: `localStorage.setItem('ff_tts_provider', 'browser')` → verify switch
- [ ] Kill Groq API → see LLM timeout UI ("Marcus is thinking..." at 8s, "still thinking" at 15s)

---

## Code Standards

- TypeScript strict mode (`"strict": true`)
- All props typed with interfaces
- Smallest AI for all voice (STT + TTS)
- Mastra for all LLM calls
- Agent responses <3 sentences
- Tailwind CSS only
- WebSocket streaming for STT + TTS
- In-memory state (no database)

---

## Environment Variables

### Required for Local Dev

```env
# .env.local (DO NOT COMMIT)
GROQ_API_KEY=gsk_xxxxx
NEXT_PUBLIC_SMALLEST_API_KEY=your_smallest_key
NEXT_PUBLIC_STT_PROVIDER=smallest
NEXT_PUBLIC_TTS_PROVIDER=smallest
```

### Get Keys

- **Groq:** groq.com → sign up → API keys
- **Smallest AI:** smallest.ai → sign up → API keys (used for STT + TTS)

---

## Demo Strategy

**Duration:** ~2 minutes

1. **Opening (15s):**
   - *"This is VoicePitch, an AI voice pitch simulator powered by Smallest AI for real-time voice."*
   - Show landing page

2. **Voice Interaction (90s):**
   - Click "Enter the Pitch Room"
   - Deliver sample pitch: *"We built SaaS that uses AI to review code. We have 50 early users, 10% MoM growth."*
   - Marcus responds via Smallest AI TTS
   - Continue Q&A exchanges
   - Deliberately pause 5+ seconds → show "Still listening..." warning
   - Click "End Pitch"

3. **Scorecard (15s):**
   - Show scorecard: 5 dimension scores, rewritten pitch opener, improved answer

**Key points for judges:**
- Smallest AI for real-time WebSocket STT + TTS
- Mastra agent orchestration
- Real-time voice interaction (Groq speed)
- Structured feedback (evaluator agent)
- Error recovery with auto-fallback

---

## Resources

- **Smallest AI:** https://smallest.ai/docs
- **Groq API:** https://groq.com/docs/api
- **Mastra Docs:** https://mastra.ai/docs
- **Next.js:** https://nextjs.org/docs

---

**Built during AI Agents Voice Hackathon, Kitchener, Feb 13-15, 2026**
