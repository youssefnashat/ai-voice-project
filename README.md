# VoicePitch v2 — AI Voice Pitch Simulator

A voice-first startup pitch simulator powered by **Mastra** (agent orchestration), **Groq Llama 3.3 70B** (fast LLM inference), and **ElevenLabs** (natural TTS). Users deliver a live pitch to an AI investor agent (Marcus Chen) who challenges and questions in real-time voice. After 3-4 exchanges, users get a structured scorecard with scores, evidence, and pitch improvements.

**Hackathon:** AI Agents Voice Hackathon (Kitchener, Feb 13–15, 2026)  
**Sponsor:** Mastra (deep integration tier)

---

## Key Features

✅ **Voice-First UX** — Browser SpeechRecognition API (free, client-side, Chrome)  
✅ **Real-Time Agent** — Marcus Chen investor challenges your pitch via voice  
✅ **Mastra Deep Integration** — All LLM calls routed through Mastra agents  
✅ **Fast Inference** — Groq Llama 3.3 70B (~280 tok/s)  
✅ **Natural TTS** — ElevenLabs streaming audio (eleven_turbo_v2_5)  
✅ **Structured Feedback** — Post-call scorecard (clarity, market, traction, unit economics, delivery)  
✅ **No Database** — In-memory state, HTTP request/response only

---

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Agent Framework:** Mastra (@mastra/core)
- **LLM:** Groq Llama 3.3 70B (@ai-sdk/groq)
- **TTS:** ElevenLabs streaming API
- **STT:** Browser SpeechRecognition API
- **Styling:** Tailwind CSS

---

## Setup

### Prerequisites
- Node.js 18+ and npm
- Groq API key
- ElevenLabs API key
- Chrome browser

### Installation

```bash
npm install
```

### Environment Variables

Create `.env.local`:

```
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in Chrome.

---

## Architecture

Simple HTTP request/response cycle:

1. User speaks → Browser SpeechRecognition (client-side STT) → transcript text
2. POST /api/chat { userMessage, history }
3. API route calls Mastra investorAgent.generate()
4. Mastra routes to Groq Llama 3.3 70B
5. Agent response text sent to ElevenLabs streaming TTS
6. Audio stream + agent text header returned to client
7. Client plays audio, displays text
8. Repeat 3-4 exchanges
9. POST /api/scorecard { transcript }
10. evaluatorAgent generates JSON scorecard
11. Render scorecard UI

---

## Mastra Deep Integration

### Two Agents

1. **investorAgent** ("Marcus Chen")
   - Asks probing questions, makes counteroffers 30-50% below founder's ask
   - Uses natural phrases: "Look,", "Here's my concern,", "Walk me through..."

2. **evaluatorAgent**
   - Post-call scorecard generation
   - Scores 5 dimensions (clarity, market, traction, unit_economics, delivery)
   - Returns rewritten pitch opener + improved answer

Both agents registered in `src/mastra/index.ts` and accessed via `mastra.getAgent("name").generate(messages)`.

---

## API Routes

### POST /api/chat

Request:
```json
{ "userMessage": "...", "history": [...] }
```

Response: Audio stream + `X-Agent-Text` header with agent response

### POST /api/scorecard

Request:
```json
{ "transcript": [...] }
```

Response: Scorecard JSON (5 dimension scores, overall score, improvements)

---

## Conversation Flow

- Exchange 0: User pitch → Phase: qa
- Exchanges 1-2: Agent asks questions → Phase: negotiation
- Exchange 3: Agent makes counteroffer → End call or continue
- End: Generate scorecard

**Silence Handling:** 10+ seconds auto-ends conversation

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
│   ├── PhaseIndicator.tsx
│   ├── Timer.tsx
│   ├── AgentCard.tsx
│   ├── TranscriptPanel.tsx
│   ├── ScoreBar.tsx
│   └── Scorecard.tsx
├── hooks/
│   ├── useSpeechRecognition.ts
│   ├── useAudioPlayback.ts
│   └── useSession.ts
└── types/
    └── index.ts
```

---

## Usage

1. Click "Start Your Pitch"
2. Grant mic permission
3. Deliver pitch (30-60 seconds)
4. Hear agent response (with fallback text)
5. Repeat 3-4 exchanges
6. Click "End Call"
7. View scorecard with improvements

---

## Error Recovery

- **SpeechRecognition not supported:** Show message, try text input
- **Mic failure:** Auto-restart with max 3 retries, then text fallback
- **ElevenLabs TTS fails:** Fall back to browser speechSynthesis
- **Long silence (10s):** Auto-end and generate scorecard

---

## Coding Standards

- TypeScript strict mode
- All props typed (no `any`)
- Mastra for all LLM calls (never raw Groq SDK)
- Agent responses <3 sentences, natural speech
- Tailwind CSS only
- Commit every 30-60 min with prefixes: `feat:`, `fix:`, `ui:`, `agent:`, `voice:`, `docs:`, `chore:`

---

## Building for Production

```bash
npm run build
npm start
```

Deploy to Vercel. Use platform secrets for environment variables.

---

## Demo Tips

- Deliberately pause 4+ seconds during pitch to show "Still there?" error recovery prompt
- Cycles through 3-4 agent exchanges to show Q&A → Negotiation flow
- Show final scorecard with all 5 dimensions and improvement recommendations

---

## Support

- Groq: groq.com/docs
- ElevenLabs: elevenlabs.io/docs
- Mastra: mastra.ai/docs
- Next.js: nextjs.org/docs

---

## License

MIT. Built during AI Agents Voice Hackathon, Feb 13–15, 2026.
