# VoicePitch v2 — AI Voice Pitch Simulator

A voice-first startup pitch simulator powered by **Smallest AI** (real-time WebSocket STT + TTS), **Groq Llama 3.3 70B** (fast LLM inference), and **Mastra** (agent orchestration). Users deliver a live pitch to an AI investor agent (Marcus Chen) who challenges and questions in real-time voice. After 3-4 exchanges, users get a structured scorecard with scores, evidence, and pitch improvements.

**Hackathon:** AI Agents Voice Hackathon (Kitchener, Feb 13-15, 2026)

---

## Key Features

- **Voice-First UX** — Smallest AI Pulse WebSocket for real-time speech-to-text
- **Natural TTS** — Smallest AI Lightning v2 WebSocket for text-to-speech streaming
- **Real-Time Agent** — Marcus Chen AI investor challenges your pitch via voice
- **Fast Inference** — Groq Llama 3.3 70B (~280 tok/s)
- **Structured Feedback** — Post-call scorecard (clarity, market, traction, unit economics, delivery)
- **Auto-Fallback** — Graceful degradation to browser STT/TTS if Smallest AI is unavailable
- **No Database** — In-memory state, WebSocket + HTTP only

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript strict mode
- **Voice STT:** Smallest AI Pulse (WebSocket)
- **Voice TTS:** Smallest AI Lightning v2 (WebSocket)
- **LLM:** Groq Llama 3.3 70B via Mastra agents
- **Styling:** Tailwind CSS v4 + Framer Motion

---

## Setup

### Prerequisites
- Node.js 18+ and npm
- Groq API key ([groq.com](https://groq.com))
- Smallest AI API key ([smallest.ai](https://smallest.ai))
- Any modern browser with microphone access

### Installation

```bash
npm install
```

### Environment Variables

Create `.env.local`:

```
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_SMALLEST_API_KEY=your_smallest_api_key
NEXT_PUBLIC_STT_PROVIDER=smallest
NEXT_PUBLIC_TTS_PROVIDER=smallest
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Architecture

1. User speaks -> Smallest AI Pulse WebSocket STT -> transcript text
2. POST /api/chat { userMessage, history } with `X-Skip-TTS` header
3. Mastra investorAgent generates response via Groq Llama 3.3 70B
4. Agent text returned as JSON to client
5. Client plays response via Smallest AI Lightning v2 WebSocket TTS
6. Displays text in transcript
7. Repeat 3-4 exchanges
8. POST /api/scorecard { transcript }
9. Mastra evaluatorAgent generates JSON scorecard
10. Render scorecard UI

---

## API Routes

### POST /api/chat

Request:
```json
{ "userMessage": "...", "history": [...] }
```

Response: JSON `{ agentText }` when `X-Skip-TTS: true` header sent (default with Smallest AI)

### POST /api/scorecard

Request:
```json
{ "transcript": [...] }
```

Response: Scorecard JSON (5 dimension scores, overall score, improvements)

---

## Conversation Flow

- Exchange 0: User pitch -> Phase: qa
- Exchanges 1-2: Agent asks questions -> Phase: negotiation
- Exchange 3: Agent makes counteroffer -> End call or continue
- End: Generate scorecard

**Silence Handling:** 5s -> "Still listening..." warning, 15s -> auto-ends turn

---

## File Structure

```
src/
├── mastra/
│   ├── index.ts
│   └── agents/
│       ├── investor-agent.ts
│       └── evaluator-agent.ts
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       ├── chat/route.ts
│       └── scorecard/route.ts
├── components/
│   ├── PitchRoom.tsx
│   ├── MarcusAvatar.tsx
│   ├── StatusHUD.tsx
│   ├── LiveDeckFeed.tsx
│   ├── TranscriptPanel.tsx
│   └── Scorecard.tsx
├── hooks/
│   ├── useUnifiedSTT.ts        <- unified STT (Smallest AI + browser fallback)
│   ├── useUnifiedTTS.ts        <- unified TTS (Smallest AI + browser fallback)
│   ├── useSmallestSTT.ts       <- Smallest AI Pulse WebSocket STT
│   ├── useSmallestTTS.ts       <- Smallest AI Lightning v2 WebSocket TTS
│   ├── useSpeechRecognition.ts <- browser STT fallback
│   ├── useAudioPlayback.ts     <- browser TTS fallback
│   └── useSession.ts
├── lib/
│   ├── feature-flags.ts        <- runtime provider selection
│   ├── llm-timeout.ts          <- LLM response timeout tracking
│   └── demo-script.ts          <- console helpers for demos
└── types/
    └── index.ts
```

---

## Usage

1. Click "Enter the Pitch Room"
2. Grant mic permission
3. Deliver pitch (30-60 seconds)
4. Hear Marcus respond via Smallest AI TTS
5. Repeat 3-4 exchanges
6. Click "End Pitch"
7. View scorecard with improvements

---

## Error Recovery

- **Smallest AI STT fails:** Auto-fallback to browser SpeechRecognition
- **Smallest AI TTS fails:** Auto-fallback to browser speechSynthesis
- **Mic failure:** Auto-restart with max 3 retries
- **LLM slow response:** "Marcus is thinking..." (8s) -> "Marcus is still thinking..." (15s)
- **5s silence:** "Still listening..." warning
- **15s silence:** Auto-end turn and send to agent

---

## Demo Tips

- Deliberately pause 5+ seconds during pitch to show "Still listening..." warning
- Cycles through 3-4 agent exchanges to show Q&A -> Negotiation flow
- Show final scorecard with all 5 dimensions and improvement recommendations
- Toggle providers live in console: `__voicepitch.toggleSTT('browser')` / `__voicepitch.toggleTTS('smallest')`

---

## Building for Production

```bash
npm run build
npm start
```

---

## Resources

- **Smallest AI:** https://smallest.ai/docs
- **Groq:** https://groq.com/docs
- **Mastra:** https://mastra.ai/docs
- **Next.js:** https://nextjs.org/docs

---

## License

MIT. Built during AI Agents Voice Hackathon, Feb 13-15, 2026.
