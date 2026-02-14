# VoicePitch v2 Implementation Guide

## Current Status: ✅ SCAFFOLDED (Dev Server Running)

**Build Status:** ✅ Compiles successfully  
**Dev Server:** ✅ Running at http://localhost:3000  
**Git Commits:** 1 initial commit

---

## What's Working Right Now

### ✅ Completed
- Next.js 14 + TypeScript strict mode app structure
- Mastra (@mastra/core) agent framework integrated
  - `investorAgent` ("Marcus Chen" — investor agent)
  - `evaluatorAgent` (post-call scorecard evaluator)
- API routes implemented
  - `POST /api/chat` — investor response + TTS streaming
  - `POST /api/scorecard` — scorecard generation
- React components (all typed, Tailwind styled)
  - `PitchRoom.tsx` — main orchestrator
  - `PhaseIndicator`, `Timer`, `AgentCard`, `TranscriptPanel`, `ScoreBar`, `Scorecard`
- Custom hooks
  - `useSpeechRecognition()` — Browser STT (2s silence detection)
  - `useAudioPlayback()` — Audio playback + fallback TTS
  - `useSession()` — Conversation state management
- TypeScript data schemas in `src/types/index.ts`
- Environment variables setup (`.env.example`, `.env.local`)
- Comprehensive README.md

### ⚠️ Not Yet Tested
- Groq API calls (needs valid `GROQ_API_KEY` in `.env.local`)
- ElevenLabs TTS streaming (needs valid `ELEVENLABS_API_KEY`)
- Browser SpeechRecognition (Chrome-only, requires mic permission)
- End-to-end voice flow
- Scorecard JSON parsing and rendering

---

## Next Steps (Priority Order)

### 1. Add API Keys & Test Connectivity
```bash
# Edit .env.local
GROQ_API_KEY=your_actual_groq_key
ELEVENLABS_API_KEY=your_actual_elevenlabs_key
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
```

Then test in browser console:
```javascript
// Open http://localhost:3000 in Chrome
// Open DevTools (F12) → Console
// Test mic permission
navigator.mediaDevices.getUserMedia({ audio: true });
```

### 2. Test Voice Loop (Manual Testing)
1. Open http://localhost:3000 in Chrome
2. Click "Start Your Pitch"
3. Accept mic permission
4. Speak: "We're building an AI-powered code reviewer"
5. Watch transcript panel fill with interim text
6. After 2s silence, should hear Marcus Chen respond
7. See agent text in transcript + hear audio playback
8. Repeat 3-4 exchanges

### 3. Verify Scorecard Generation
- After 4 exchanges or "End Call" click
- Should POST to `/api/scorecard` with full transcript
- evaluatorAgent generates 5-dimension scorecard JSON
- UI renders scores + improvements

### 4. Bug Fixes (If Needed)

**If Groq call fails:**
- Check `GROQ_API_KEY` in `.env.local` is valid
- Check network: `curl https://api.groq.com/health`
- Mastra logs will show error in terminal

**If ElevenLabs TTS fails:**
- Check `ELEVENLABS_API_KEY` is valid
- Check voice ID `pNInz6obpgDQGcFmaJgB` exists in your account
- Fallback to browser `speechSynthesis` (already implemented)

**If SpeechRecognition doesn't work:**
- Only works in Chrome/Chromium (not Firefox, Safari)
- Check mic permission in browser settings
- Look for "Still there?" prompt after 2s silence (error recovery)

---

## Mastra Deep Integration Checklist

Per hackathon sponsor requirements:

✅ **Agent Definition**
- `investorAgent` in `src/mastra/agents/investor-agent.ts`
  - Uses `Agent` class from `@mastra/core/agent`
  - Model: `groq("llama-3.3-70b-versatile")`
  - Persona: Direct, skeptical investor
  
✅ **Agent Registration**
- `src/mastra/index.ts` exports Mastra instance with both agents

✅ **LLM Routing**
- All calls use `mastra.getAgent("investorAgent").generate(messages)`
- Never raw Groq SDK calls
- Mastra handles model routing to Groq

✅ **API Routes Use Mastra**
- `POST /api/chat` → calls `mastra.getAgent("investorAgent")`
- `POST /api/scorecard` → calls `mastra.getAgent("evaluatorAgent")`

✅ **Documentation**
- README.md has "Mastra Deep Integration" section
- Explains both agents + registration pattern

**For Demo:**
- Narration: *"...powered by Mastra for intelligent agent orchestration..."*
- Show scorecard evaluator running post-call
- Mention Mastra's model routing to Groq for speed

---

## Architecture Diagram

```
Landing (Browser)
    ↓
[Start Your Pitch Button]
    ↓
PitchRoom Component
    ├─ useSpeechRecognition Hook
    │   └─ Browser SpeechRecognition API (client-side STT)
    │       ↓ 2s silence → onSilence callback
    ├─ useSession Hook (React state)
    │   └─ Tracks: phase, transcript, history, exchangeCount
    ├─ useAudioPlayback Hook
    │   └─ Blob → Audio() or Web Speech Synthesis
    │
    ├─ User speaks → interim + final results
    │       ↓
    ├─ [Stop & Send Button] triggers handleEndTurn()
    │       ↓
    ├─ POST /api/chat { userMessage, history }
    │       ↓
    ├─ API Route
    │   ├─ Mastra.getAgent("investorAgent").generate(messages)
    │   ├─ Groq LLM inference → agentText
    │   ├─ ElevenLabs TTS: POST .../text-to-speech/{voiceId}/stream
    │   └─ Response: audio stream + X-Agent-Text header
    │       ↓
    ├─ Client receives audio + agentText
    ├─ playAudio(blob) + playFallbackTTS fallback
    ├─ Add to transcript + history
    └─ repeat 3-4 exchanges
        ↓
    [End Call Button] → POST /api/scorecard
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
| `src/app/api/chat/route.ts` | Chat endpoint + Groq + ElevenLabs |
| `src/app/api/scorecard/route.ts` | Scorecard endpoint |
| `src/components/PitchRoom.tsx` | Main UI orchestrator |
| `src/hooks/useSpeechRecognition.ts` | Browser STT wrapper |
| `src/hooks/useAudioPlayback.ts` | Audio playback + fallback TTS |
| `src/hooks/useSession.ts` | Conversation state |
| `src/types/index.ts` | TypeScript interfaces |
| `.env.local` | API keys (not committed) |
| `README.md` | User-facing documentation |

---

## Common Issues & Solutions

### Issue: "Agent doesn't exist in target module"
**Solution:** Import from `@mastra/core/agent`, not `@mastra/core`
```typescript
// ✅ Correct
import { Agent } from "@mastra/core/agent";

// ❌ Wrong
import { Agent } from "@mastra/core";
```

### Issue: No audio output after agent response
**Solution:** Check in browser DevTools:
1. Network tab → /api/chat response has `X-Agent-Text` header
2. Response body is audio blob (audio/mpeg)
3. Check ElevenLabs API key in `.env.local`
4. If ElevenLabs fails, fallback to `speechSynthesis` should trigger

### Issue: SpeechRecognition not working
**Solution:** 
- Only works in Chrome/Chromium
- Check browser console for permission errors
- Grant mic permission when prompted
- Check `useSpeechRecognition` hook logs in console

### Issue: "Still there?" prompt shows but then statement times out
**Solution:** 10+ seconds of silence auto-ends call
- This is intentional (error recovery)
- Shows "Still there? Take your time." at 2-5 seconds
- Auto-ends at 10 seconds
- User can also click "End Call" manually

---

## Testing Checklist

### Manual Testing
- [ ] Open http://localhost:3000 in Chrome
- [ ] Click "Start Your Pitch"
- [ ] Grant mic permission
- [ ] Speak test phrase: "We make AI reviewers for code"
- [ ] See interim text in gray, final text in white
- [ ] After 2s silence, hear Marcus respond
- [ ] See agent response in transcript
- [ ] Repeat 3-4 times
- [ ] Click "End Call"
- [ ] See scorecard with 5 dimensions

### Network Testing
- [ ] DevTools → Network tab
- [ ] Verify POST /api/chat requests succeed
- [ ] Check response has audio blob + X-Agent-Text header
- [ ] Verify POST /api/scorecard returns JSON

### Error Recovery Testing
- [ ] Deliberately pause >4 seconds → see "Still there?" prompt
- [ ] Deliberately wait >10 seconds → auto-end + scorecard
- [ ] Disable mic → see fallback text input prompt (if implemented)
- [ ] Kill ElevenLabs API → hear browser TTS fallback
- [ ] Kill Groq API → see error handling

---

## Code Standards (Already Following)

✅ TypeScript strict mode (`"strict": true`)  
✅ All props typed with interfaces  
✅ No `any` types  
✅ Mastra for all LLM calls  
✅ Agent responses <3 sentences  
✅ Tailwind CSS only  
✅ Client-side STT (Browser SpeechRecognition)  
✅ HTTP request/response (no WebSockets)  
✅ In-memory state (no database)  

---

## Commit History

```
2ae565c feat: scaffold VoicePitch v2 full-stack app with Mastra, Groq, ElevenLabs
```

**Next commits (suggested):**
```
agent: implement investor counteroffer logic
voice: test ElevenLabs TTS streaming end-to-end
ui: add demo styling for scorecard animations
fix: handle Groq API timeout with fallback
voice: test SpeechRecognition silence detection
docs: add architecture diagrams to README
feat: demo script for judges
```

---

## Environment Variables

### Required for Local Dev

```env
# .env.local (DO NOT COMMIT)
GROQ_API_KEY=gsk_xxxxx
ELEVENLABS_API_KEY=sk_xxxxx
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
```

### Get Keys

- **Groq:** groq.com → sign up → API keys
- **ElevenLabs:** elevenlabs.io → sign up → API key
- **Voice ID:** https://api.elevenlabs.io/v1/voices (requires auth)

---

## Demo Strategy

**Duration:** ~2 minutes

1. **Opening (15s):**
   - *"This is VoicePitch, an AI voice pitch simulator powered by Mastra agent orchestration."*
   - Show landing page

2. **Voice Interaction (90s):**
   - Click "Start Your Pitch"
   - Deliver sample pitch: *"We built SaaS that uses AI to review code. We have 50 early users, 10% MoM growth."*
   - Marcus responds: *"Walk me through unit economics. What's your LTV?"*
   - You respond: *"Each customer pays $500/mo, lifetime is 18 months, so LTV is $9,000."*
   - Marcus: *"That's interesting. Here's my concern though — CAC is $8,000 based on what you said. That leaves only a grand margin. I'd value this at 3x revenue, which puts you at... 1.5 million. I'll offer 1 million at your current traction."*
   - Deliberately pause 4+ seconds → show "Still there?" error recovery prompt (judges love to see error handling)
   - Click "End Call"

3. **Scorecard (15s):**
   - Show scorecard: 5 dimension scores, rewritten pitch opener, improved answer
   - *"And that's how VoicePitch teaches founder communication skills through live Mastra agent orchestration."*

**Key points for judges:**
- Mastra agent orchestration (emphasize)
- Real-time voice interaction (Groq speed)
- Structured feedback (evaluator agent)
- Error recovery ("Still there?" prompt)
- Open source, <50MB repo size

---

## Files NOT to Commit

```
.env
.env.local
.DS_Store
node_modules/
.next/
out/
*.mp3
*.wav
*.m4a
```

These are in `.gitignore` ✅

---

## Next Hacker Session Prep

Before next dev session:
1. Copy API keys to `.env.local` (safe, gitignored)
2. Run `npm run dev`
3. Open browser, test voice loop
4. Check console for errors
5. Iterate on agent personas if needed
6. Add error recovery if missing
7. Polish scorecard styling
8. Record demo video (<2min)

---

## Resources

- **Mastra Docs:** https://mastra.ai/docs
- **Groq API:** https://groq.com/docs/api
- **ElevenLabs API:** https://elevenlabs.io/docs/api
- **Web Speech API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **Next.js:** https://nextjs.org/docs

---

**Built during AI Agents Voice Hackathon, Kitchener, Feb 13–15, 2026**
