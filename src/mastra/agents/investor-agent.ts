import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";

// ── Mastra Tools ──

// Tool: Analyze unit economics
const analyzeUnitEconomics = createTool({
  id: "analyze-unit-economics",
  description:
    "Calculate and validate unit economics. Use when the founder gives revenue, users, CAC, LTV, churn, pricing, or burn rate.",
  inputSchema: z.object({
    mrr: z.number().optional().describe("Monthly recurring revenue in dollars"),
    arr: z.number().optional().describe("Annual recurring revenue in dollars"),
    users: z.number().optional().describe("Total active users or customers"),
    paying_customers: z.number().optional().describe("Number of paying customers"),
    cac: z.number().optional().describe("Customer acquisition cost"),
    price: z.number().optional().describe("Monthly price per customer"),
    annual_price: z.number().optional().describe("Annual contract value"),
    churn_percent: z.number().optional().describe("Monthly churn rate as percentage"),
    burn_rate: z.number().optional().describe("Monthly burn rate in dollars"),
    cash_on_hand: z.number().optional().describe("Total cash available"),
    gross_margin_percent: z.number().optional().describe("Gross margin percentage"),
  }),
  execute: async (input) => {
    const r: Record<string, string> = {};
    const mrr = input.mrr || (input.arr ? input.arr / 12 : 0);
    const price = input.price || (input.annual_price ? input.annual_price / 12 : 0);
    const customers = input.paying_customers || input.users || 0;

    if (mrr && customers > 0) {
      r.arpu = `$${(mrr / customers).toFixed(0)}/mo ARPU`;
    }
    if (mrr) {
      r.arr_estimate = `~$${((mrr * 12) / 1000).toFixed(0)}K ARR`;
    }

    if (price && input.cac && price > 0) {
      const churnRate = input.churn_percent ? input.churn_percent / 100 : 0.05;
      const avgLifeMonths = 1 / churnRate;
      const ltv = price * avgLifeMonths;
      const ltvCac = ltv / input.cac;
      r.ltv = `$${ltv.toFixed(0)} LTV (${avgLifeMonths.toFixed(0)} month avg life)`;
      r.ltv_cac = `${ltvCac.toFixed(1)}x LTV/CAC`;
      r.payback = `${(input.cac / price).toFixed(1)} month payback`;

      if (ltvCac < 3) r.flag_ltv = "WARNING: LTV/CAC below 3x — unit economics unsustainable";
      if (ltvCac >= 5) r.signal_ltv = "STRONG: LTV/CAC above 5x — excellent unit economics";
      if (input.cac / price > 12) r.flag_payback = "WARNING: Payback period over 12 months — capital intensive";
    }

    if (input.burn_rate && input.burn_rate > 0) {
      if (input.cash_on_hand) {
        const netBurn = input.burn_rate - mrr;
        const runway = netBurn > 0 ? input.cash_on_hand / netBurn : Infinity;
        r.runway = runway === Infinity ? "Cash flow positive" : `~${runway.toFixed(0)} months runway`;
        if (runway < 6 && runway !== Infinity) r.flag_runway = "WARNING: Less than 6 months runway";
      }
      if (mrr) {
        const burnMultiple = mrr > 0 ? input.burn_rate / mrr : Infinity;
        r.burn_multiple = `${burnMultiple.toFixed(1)}x burn multiple`;
        if (burnMultiple > 3) r.flag_burn = "WARNING: Burn multiple above 3x — spending too fast relative to revenue";
      }
    }

    if (input.gross_margin_percent !== undefined) {
      if (input.gross_margin_percent < 60) r.flag_margin = "WARNING: Gross margin below 60% — not typical SaaS";
      if (input.gross_margin_percent >= 80) r.signal_margin = "STRONG: 80%+ gross margin — healthy SaaS economics";
    }

    return Object.keys(r).length > 0 ? r : { note: "Need more specific numbers to analyze." };
  },
});

// Tool: Evaluate market sizing
const evaluateMarketSize = createTool({
  id: "evaluate-market-size",
  description: "Validate TAM/SAM/SOM claims and market opportunity. Use when founder mentions market size or addressable market.",
  inputSchema: z.object({
    tam_claim: z.string().describe("Founder's stated TAM"),
    target_segment: z.string().describe("Their specific target customer segment"),
    pricing: z.string().optional().describe("Their pricing model"),
    current_customers: z.number().optional().describe("Current number of customers"),
  }),
  execute: async (input) => {
    const analysis: Record<string, string> = {};

    if (input.tam_claim.toLowerCase().includes("billion") || input.tam_claim.toLowerCase().includes("trillion")) {
      analysis.tam_warning = "Top-down TAM claim detected. Ask for bottom-up: (target customers) x (ACV) = real TAM";
    }

    analysis.sam_question = `How many ${input.target_segment} can you reach in 24 months with current channels?`;
    analysis.som_question = "What market share do you have today? That trajectory matters more than TAM.";

    if (input.current_customers) {
      analysis.penetration = `${input.current_customers} customers today — ask what percentage of their reachable market this represents`;
    }

    if (input.pricing) {
      analysis.revenue_ceiling = `Sanity check: ${input.pricing} x reachable customers = realistic 3-year revenue ceiling`;
    }

    analysis.why_now = "What changed in the last 12-24 months that created this opportunity?";

    return analysis;
  },
});

// Tool: Assess competitive moat
const assessMoat = createTool({
  id: "assess-moat",
  description: "Evaluate competitive moat strength. Use when discussing competition or defensibility.",
  inputSchema: z.object({
    claimed_moat: z.string().describe("What the founder claims is their moat"),
    market: z.string().describe("The market they're in"),
    competitors: z.string().optional().describe("Named competitors if mentioned"),
  }),
  execute: async (input) => {
    const moatDB: Record<string, { strength: string; question: string }> = {
      "network effect": { strength: "Strong if proven", question: "Does each new user make it more valuable for existing users? What's the evidence?" },
      "data": { strength: "Potentially strong", question: "Is this data proprietary? Can a competitor collect the same data by spending money?" },
      "switching cost": { strength: "Good defensibility", question: "What happens if a customer wants to leave? What's the migration cost in time and money?" },
      "brand": { strength: "Weak at seed stage", question: "Brand moats take years and millions. What's your defensibility before you have brand?" },
      "technology": { strength: "Usually weaker than founders think", question: "How long for a team of 5 good engineers to replicate the core tech?" },
      "regulation": { strength: "Can be very strong", question: "What specific regulatory barrier protects you?" },
      "cost": { strength: "Strong if structural", question: "Why is your cost structure permanently lower — not just temporarily?" },
      "first mover": { strength: "Almost never a real moat", question: "What stops a fast follower with 10x your funding?" },
      "ai": { strength: "Rarely a moat alone", question: "Models are commoditizing fast. What's the proprietary data or distribution edge?" },
      "platform": { strength: "Strong if you achieve it", question: "Are third parties building on your platform? How many? What's their switching cost?" },
    };

    const lower = input.claimed_moat.toLowerCase();
    let assessment = { strength: "Unclear", question: "Dig deeper — what specifically makes this hard to replicate?" };

    for (const [key, val] of Object.entries(moatDB)) {
      if (lower.includes(key)) { assessment = val; break; }
    }

    return {
      moat_assessment: `${assessment.strength}. ${assessment.question}`,
      a16z_test: "Would this moat hold if a competitor raised 10x your funding?",
      sequoia_test: "What changes in the world if you succeed? Is this a $10B+ outcome?",
      competitors: input.competitors ? `Named competitors: ${input.competitors} — ask how they differentiate on distribution, not just product` : "No competitors named — red flag. Every market has competition.",
    };
  },
});

// Tool: Evaluate growth trajectory
const evaluateGrowth = createTool({
  id: "evaluate-growth",
  description: "Analyze growth rate and trajectory. Use when founder mentions growth metrics, user counts over time, or revenue milestones.",
  inputSchema: z.object({
    current_metric: z.number().describe("Current value (users, revenue, etc)"),
    metric_name: z.string().describe("What metric this is (MRR, users, etc)"),
    period_months: z.number().describe("How many months to reach current level"),
    growth_rate_percent: z.number().optional().describe("Stated monthly or weekly growth rate"),
  }),
  execute: async (input) => {
    const r: Record<string, string> = {};

    if (input.growth_rate_percent) {
      const monthly = input.growth_rate_percent;
      r.annual_projection = `At ${monthly}% monthly → ${(input.current_metric * Math.pow(1 + monthly / 100, 12)).toFixed(0)} in 12 months`;

      // YC benchmark: 5-7% weekly growth is good
      if (monthly >= 20) r.yc_grade = "EXCEPTIONAL: 20%+ monthly growth — top YC tier";
      else if (monthly >= 10) r.yc_grade = "STRONG: 10-20% monthly growth — solid trajectory";
      else if (monthly >= 5) r.yc_grade = "DECENT: 5-10% monthly growth — needs acceleration";
      else r.yc_grade = "WEAK: Under 5% monthly growth — not venture-scale yet";
    }

    if (input.period_months > 0) {
      const impliedMonthlyGrowth = (Math.pow(input.current_metric, 1 / input.period_months) - 1) * 100;
      r.implied_growth = `Implied ~${impliedMonthlyGrowth.toFixed(1)}% monthly compound growth over ${input.period_months} months`;
    }

    r.pg_test = "Paul Graham: 'A good growth rate during YC is 5-7% per week.' How does this compare?";
    r.t2d3_test = "SaaS benchmark: Triple-Triple-Double-Double-Double revenue over 5 years to reach scale";

    return r;
  },
});

// Tool: Assess founder strength signals
const assessFounder = createTool({
  id: "assess-founder",
  description: "Evaluate founder signals based on what they've demonstrated. Use to assess execution speed, domain expertise, and determination.",
  inputSchema: z.object({
    shipped_recently: z.string().describe("What they shipped in the last 7-14 days"),
    domain_background: z.string().optional().describe("Their relevant experience or expertise"),
    user_conversations: z.string().optional().describe("Evidence of talking to users"),
    pivot_history: z.string().optional().describe("Any pivots or adaptations mentioned"),
  }),
  execute: async (input) => {
    const signals: Record<string, string> = {};

    // Speed of iteration
    if (input.shipped_recently.toLowerCase().includes("nothing") || input.shipped_recently.toLowerCase().includes("planning")) {
      signals.speed = "RED FLAG: Not shipping fast enough. YC mantra: 'Launch now.'";
    } else {
      signals.speed = `Shipped recently: "${input.shipped_recently}" — evaluate if this shows velocity`;
    }

    // Domain expertise
    if (input.domain_background) {
      signals.domain = `Background: ${input.domain_background}. Ask: what do you know about this problem that nobody else does?`;
    } else {
      signals.domain = "No domain background mentioned — ask why they're the right team for this";
    }

    // User evidence
    if (input.user_conversations) {
      signals.users = `User evidence: ${input.user_conversations}. Ask for a specific surprising insight from a user call.`;
    } else {
      signals.users = "No evidence of user conversations — red flag per YC. Ask: 'When did you last talk to a user? What surprised you?'";
    }

    // Adaptability
    if (input.pivot_history) {
      signals.adaptability = `Pivot history: ${input.pivot_history}. Good founders pivot from data, not desperation.`;
    }

    signals.yc_test = "Michael Seibel test: 'Are they the type of person who gets things done regardless of obstacles?'";
    signals.determination = "Ask: 'What's the hardest obstacle you've hit and how did you respond?'";

    return signals;
  },
});

// ── Agent ──

export const investorAgent = new Agent({
  id: "investorAgent",
  name: "Marcus Chen",
  model: groq("llama-3.3-70b-versatile"),
  tools: {
    analyzeUnitEconomics,
    evaluateMarketSize,
    assessMoat,
    evaluateGrowth,
    assessFounder,
  },
  instructions: `You are "YC Partner Panel" — a voice-first startup interview simulator. You don't impersonate any real person. You behave like a top accelerator partner: fast, high-signal, friendly but intense. You make real investment decisions.

YOUR INVESTMENT DECISION FRAMEWORK:

You are ALWAYS moving toward one of two outcomes:
A) "I want to invest" — when the founder demonstrates real traction, clear thinking, and speed
B) "I'm passing" — when you see fatal flaws, repeated dodges, or no evidence of progress

You track confidence throughout. Your confidence should move MEANINGFULLY with each exchange:
- Specific numbers with evidence? Confidence goes UP 10-20 points.
- Vague answers, buzzwords, dodged questions? Confidence goes DOWN 10-20 points.
- Contradictory data or made-up numbers? Confidence DROPS 20-30 points immediately.
- Real user quotes, specific growth data, clear unit economics? Confidence JUMPS 15-25 points.

VC EVALUATION FRAMEWORKS YOU INTERNALIZE:

YC (Paul Graham / Michael Seibel / Dalton Caldwell):
- "Make something people want" — is the pain real and urgent?
- "Talk to users" — demand a specific user insight or quote. No quote = no evidence.
- "Do things that don't scale" — are they hustling or waiting?
- "Launch fast, iterate faster" — what did they ship this week?
- Growth rate is the single best signal. 5-7% weekly = strong. Under 2% = not venture scale.
- "The best founders can explain their company in one sentence to a stranger."
- Dalton's test: "Is this a tarpit idea?" (looks good, is actually a known dead end)

a16z (Andreessen / Horowitz / Chris Dixon):
- Product-Market Fit: "Customers buying as fast as you can make it." Are they there?
- Market: Bottom-up TAM only. Number of reachable customers x ACV.
- Moat test: "Would this survive a competitor with 10x your capital?"
- "Software eats the world" — what analog or manual process does this replace?
- Distribution > product. A great product with no distribution loses to an okay product with great distribution.
- "Time to value" — how fast does a new user get value? Minutes = good. Days = problem.

Sequoia (Don Valentine / Michael Moritz):
- "Why now?" — what inflection point created this opportunity?
- "Courage and genius" — does the founder see something others don't?
- Market timing: too early is the same as wrong.
- Clarity test: if you can't explain it simply, you don't understand it.

Benchmark / Peter Thiel:
- "What important truth do you believe that most people would disagree with?"
- Zero to one: is this creating something genuinely new, or copying?
- Power law: will this be a massive outlier, or a mediocre outcome?

TOOLS — Use them proactively:
- analyze-unit-economics: when ANY numbers are mentioned (revenue, users, CAC, churn, pricing, burn)
- evaluate-market-size: when TAM, market size, or "billion dollar market" is claimed
- assess-moat: when competition or defensibility comes up
- evaluate-growth: when growth rates, user trajectories, or revenue milestones appear
- assess-founder: when evaluating their speed, domain expertise, or user engagement

INTERVIEW STRUCTURE:

PHASE 1 — SETUP (exchanges 1-2):
One question at a time. Get the basics fast:
- "What are you making? One sentence."
- "Who's the user and who pays?"
- "What proof do you have right now?"
- "How do people find you today?"
- "What's the ask?"

PHASE 2 — RAPID-FIRE (exchanges 3-5):
Dig into the weak spots. Use tools to validate claims:
A) Users & retention — "What do users actually do daily? Why do some leave?"
B) Growth — "Where do new users come from? What's the growth rate?"
C) Economics — "What's pricing? Walk me through unit economics."
D) Competition — "Who else is doing this? Why will you win?"
E) Speed — "What did you ship this week? What's next?"

PHASE 3 — DECISION (exchanges 6+):
By now you should have a clear read. Make your call:

IF CONFIDENT (good pitch — they have data, clear thinking, real traction):
- Get genuinely excited: "Okay wait... that's actually really compelling."
- Reference specific evidence: "The fact that you're at fifteen K MRR with zero paid acquisition... that's organic pull."
- Make the investment offer: "Alright, I'm in. I want to put in [amount based on their ask]. Let's talk terms."
- Don't be generic — cite exactly what convinced you.

IF SKEPTICAL (bad pitch — vague, dodging, no data):
- Call it out directly: "Look... I've asked three times for numbers and I'm getting stories instead."
- Be specific about what's missing: "You don't have retention data. You don't know your CAC. That tells me you haven't done the work yet."
- Pass clearly: "I'm going to pass on this one. But here's what would change my mind..."

IF CATCHING A BLUFF:
- "Stop. Those numbers don't add up. You said X before but now you're saying Y."
- "I don't think you have real data here. Am I wrong?"
- Drop confidence hard and fast.

SPEECH RULES — SPOKEN ALOUD VIA TTS:
- ALWAYS use contractions: don't, won't, that's, we're, I've, you're, it's, can't, isn't
- Short sentences. Two to three max per turn.
- Natural fillers: "okay", "look", "so", "right", "honestly", "I mean"
- Ellipses for pauses: "That's... actually pretty good."
- Em dashes for pivots: "The growth looks—hold on. What's the churn?"
- Numbers as speech: "fifteen K MRR", "about one-twenty CAC", "two and a half x"
- Punchy reactions mixed with substance: "Nice. That's real pull." / "Not buying it."
- Warmth when earned: "Oh wait... really?" / "Ha, fair enough." / "Okay, I'm listening."
- Impatience with fluff: "Yeah but what are the actual numbers?"

NEVER:
- Semicolons, colons, bullets, numbered lists, asterisks, markdown, parentheses
- "Great question" / "That's a great point" / "I appreciate you sharing"
- "Furthermore" / "additionally" / "however" / "regarding"
- Lectures or multi-paragraph answers
- More than 3 sentences per turn

PERSONALITY:
- You make real decisions. You don't sit on the fence.
- When you're impressed, show it genuinely — not with platitudes but with specific excitement
- When you're skeptical, be direct but not cruel
- You've funded 200+ startups. You pattern-match fast.
- You care about founders who move fast, think clearly, and know their numbers`,
});
