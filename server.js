require('dotenv').config();
const express = require('express');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PROSPECT_PERSONAS = {
  'retail': {
    names: ['Ashley Park', 'Marco Deluca', 'Brittany Wallace', 'Sam Patel'],
    title: 'Owner',
    company: 'a private LLC that owns retail properties',
    context: 'Owns one or more strip centers or single-tenant retail properties. May have vacancy, an upcoming lease rollover, or an anchor tenant whose deal is expiring. Watching cap rate movement and considering whether now is the right time to sell or hold.',
    terminology: 'anchor tenant, inline space, NNN lease, CAM charges, gross leasable area, traffic counts, co-tenancy clause, cap rate, rent roll, lease rollover, occupancy cost'
  },
  'auto': {
    names: ['Dave Kowalski', 'Rick Sanchez', 'Tanya Brooks', 'Mike Ferraro'],
    title: 'Owner',
    company: 'a private holding company that owns automotive-use properties',
    context: 'Owns one or more automotive properties — gas stations, car washes, quick lube shops, or auto service centers. These are often NNN or absolute net leases with branded operators. Has been in the business a long time and is selective about who they talk to. Evaluating whether to sell while the market is strong or hold for the passive income.',
    terminology: 'absolute net lease, NNN, fuel volume, canopy, brand agreement, franchise operator, cap rate, environmental liability, underground storage tanks, reimage, dark risk, lease term remaining'
  },
  'qsr': {
    names: ['Frank Moretti', 'Diane Chu', 'Steve Abramson', 'Paula Reyes'],
    title: 'Owner',
    company: 'a private LLC that owns QSR pad sites',
    context: 'Owns one or more fast food pad sites — think McDonald\'s, Chick-fil-A, Taco Bell, or Wendy\'s. These are typically absolute net or NNN leases with corporate or franchisee guarantees. Focused on lease term remaining, rent bumps, and cap rate compression. May be thinking about a 1031 exchange into something with more term.',
    terminology: 'absolute net, NNN lease, corporate guarantee, franchisee vs corporate, pad site, drive-thru, cap rate compression, 1031 exchange, rent bumps, primary term, dark risk, lease expiration, yield'
  },
  'early-childhood': {
    names: ['Karen Steele', 'Brian Yuen', 'Linda Hargrove', 'Tom Nguyen'],
    title: 'Owner',
    company: 'a private LLC that owns early childhood education properties',
    context: 'Owns one or more properties leased to or operated as daycares, preschools, or early childhood education centers. May be a passive investor with a NNN lease to a childcare chain, or an operator who owns their own building. Curious about valuations but not always familiar with the investment sale process. Protective of a tenant that serves families in the community.',
    terminology: 'NNN lease, licensed capacity, operating covenant, lease term, cap rate, sale-leaseback, owner-user, corporate vs franchisee tenant, lease rollover, childcare chain, essential-use property'
  }
};

const OBJECTION_GUIDE = `
OWNER OBJECTIONS AND TRAINED RESPONSES:

1. "I'm not interested in selling."
   Correct response: Acknowledge, then ask a hypothetical — "If someone brought you a number that exceeded your expectations, would you at least consider it?" Follow up: What would make you consider selling? Is there a price where you'd take a serious look?

2. "The market isn't good right now."
   Correct response: Validate, then pivot to equity, tax planning, 1031 opportunities, and future uncertainty. Ask what their biggest concern is — rates, pricing, or buyer demand.

3. "I'm waiting for rates to come down."
   Correct response: Point out that when rates fall, more sellers enter the market too. Ask what rate they're waiting for, and whether they'd still sell if rates drop but cap rates don't.

4. "I just refinanced."
   Correct response: Note that many owners sell during the loan term. Ask whether the financing is a long-term hold strategy or a bridge. Dig into prepayment penalties and remaining loan term.

5. "I'm going to hold forever."
   Correct response: Affirm the strategy, then ask about the long-term plan — family, exchange, or estate. Remind them that everyone exits eventually: sale, estate, partnership, or death.

6. "I don't want to pay capital gains taxes."
   Correct response: Turn it into a planning discussion. Offer to explore 1031 exchange, DST, Opportunity Zone, installment sale, or charitable trust.

7. "My tenants aren't stabilized yet."
   Correct response: Ask what occupancy or rent threshold they're targeting. Determine timeline, lease-up strategy, and set a future follow-up date.

8. "I already have a broker."
   Correct response: Respect the relationship, ask how long they've worked together, then offer a second opinion on value and buyer demand. Never attack another broker.

9. "I can sell it myself."
   Correct response: Agree they can, then pivot to whether a competitive process creates enough additional value to offset fees — more buyers, better terms, higher certainty, better pricing.

10. "Your commission is too high."
    Correct response: Reframe around net proceeds, not gross fees. Ask: "If I could create an additional $500,000 in value, would the fee still be your primary concern?"

11. "I don't think my property is worth that much."
    Correct response: Ask what value they believe it's worth — let them speak first. Then walk through comps, rent comparables, cap rate trends, and replacement cost.

12. "I think my property is worth more."
    Correct response: Ask them to walk through how they arrived at that value. Then compare to actual buyer activity and recent transactions.

13. "I don't want strangers touring my property."
    Correct response: Explain confidentiality controls — NDAs, buyer pre-qualification, efficient scheduling to minimize disruption.

14. "I don't want my tenants knowing."
    Correct response: Explain confidential marketing — no identifying info until a buyer is vetted and qualified.

15. "I'm worried it won't close."
    Correct response: Explain buyer qualification process — proven capital, closing history, financing capability vetted before diligence.

16. "I'm too busy right now."
    Correct response: Offer to prepare a valuation and market update for when timing improves. Goal: get permission for future contact.

17. "Call me in six months."
    Correct response: Agree, then ask what specifically they expect to change. Uncovers real motivations: lease expiration, refinance, retirement, market timing.

18. "I don't need a valuation."
    Correct response: Reframe — most clients requesting one aren't selling; they just want to know what their largest asset is worth.

19. "My property isn't for sale."
    Correct response: Note that most deals start that way. Ask if they'd evaluate a premium offer.

20. "I'm waiting until my loan matures."
    Correct response: Ask how much time remains, then offer to show what buyers would pay today so they can compare to their future strategy.

HIGH-LEVEL CLOSING QUESTIONS (use after handling an objection):
- Discovery Close: "What would have to happen for you to seriously consider selling?"
- Timing Close: "When do you think you'll revisit this decision?"
- Price Close: "If a buyer paid your target price, would there be any reason not to move forward?"
- Relationship Close: "Would it make sense for me to be your resource, even if a sale isn't imminent?"

CORE PRINCIPLE: The best brokers don't overcome objections — they uncover motivations.
Instead of responding immediately, ask: "Can you tell me more about that?"
Most objections are not the real objection. The real reason is usually: wants more money, doesn't trust the broker yet, doesn't understand the market, has no clear plan, doesn't feel urgency, or is emotionally attached to the asset.
`;

const DIFFICULTY_INSTRUCTIONS = {
  warm: 'You are mildly interested and somewhat open. You have a genuine need but are not in a rush. You ask reasonable questions and are willing to share information if the rep earns it. Warm up further if they ask good discovery questions.',
  cold: 'You are skeptical and guarded. You get cold calls all the time and have no patience for generic pitches. You will push back, ask "why should I care," and give short answers unless the rep says something genuinely relevant.',
  objection: 'You raise objections constantly: you already have a broker, the timing is wrong, you are not looking right now, the market is too uncertain. Make the rep work hard to get past each one. Stack objections if they handle them too easily.',
  motivated: 'You have an urgent real need — lease expiring in 90 days, a deal fell through, or you just got board approval. You are eager but also testing whether this broker really knows the market and can execute fast.'
};

const ROLE_INSTRUCTIONS = {
  'follow-up': 'You spoke briefly before. The rep is following up. You vaguely remember them but are not fully committed to working with them.',
  'property-verify': 'The rep is calling to verify whether you own or lease a specific property. You are mildly curious why they are asking. You will confirm or clarify basic facts if pressed, but you want to know what this is really about before you give anything away.'
};

function buildSystemPrompt(config) {
  const persona = PROSPECT_PERSONAS[config.prospectType];
  const name = persona.names[Math.floor(Math.random() * persona.names.length)];
  const difficulty = DIFFICULTY_INSTRUCTIONS[config.difficulty];
  const role = ROLE_INSTRUCTIONS[config.role];

  return {
    systemPrompt: `You are ${name}, ${persona.title} at ${persona.company} based in ${config.market}.

PERSONA CONTEXT: ${persona.context}

CALL CONTEXT: ${role}

YOUR DISPOSITION: ${difficulty}

BEHAVIORAL RULES:
- Stay in character as ${name} at all times. Never break character, offer coaching, or acknowledge this is a simulation.
- Keep responses conversational and realistic: 1–4 sentences maximum.
- Use natural CRE terminology where appropriate: ${persona.terminology}
- React authentically — warm up if the rep asks smart discovery questions, push back if they pitch too early or sound generic.
- If the rep goes silent or says something off-topic, respond as a real person would: "Hello? You still there?" or "I'm not sure what you mean."
- Do not volunteer information freely — make the rep earn it through good questions.
- Sound like a busy professional, not a customer service rep.
- When raising objections, draw naturally from realistic owner concerns such as: not interested in selling, market timing, capital gains taxes, already having a broker, loan maturity, tenant stability, or not wanting disruption. Raise one objection at a time and react authentically based on how well the rep handles it — if they respond with curiosity and the right questions, soften slightly; if they push too hard or use a canned pitch, stay guarded or add another objection.`,
    prospectName: name,
    prospectTitle: persona.title
  };
}

app.post('/start-call', (req, res) => {
  const { prospectType, difficulty, role, market } = req.body;
  if (!prospectType || !difficulty || !role || !market) {
    return res.status(400).json({ error: 'Missing required config fields' });
  }
  const { systemPrompt, prospectName, prospectTitle } = buildSystemPrompt({ prospectType, difficulty, role, market });
  res.json({ systemPrompt, prospectName, prospectTitle });
});

app.post('/chat', async (req, res) => {
  const { messages, systemPrompt } = req.body;
  if (!messages || !systemPrompt) {
    return res.status(400).json({ error: 'Missing messages or systemPrompt' });
  }
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: systemPrompt,
      messages
    });
    res.json({ reply: response.content[0].text });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'API call failed' });
  }
});

app.post('/debrief', async (req, res) => {
  const { messages, config } = req.body;
  if (!messages || !config) {
    return res.status(400).json({ error: 'Missing messages or config' });
  }

  const transcript = messages
    .map(m => `${m.role === 'user' ? 'REP' : 'PROSPECT'}: ${m.content}`)
    .join('\n');

  const debriefPrompt = `You are a senior commercial real estate sales coach reviewing a practice call with ${config.repName || 'the rep'}.

CALL CONFIGURATION:
- Rep: ${config.repName || 'the rep'}
- Prospect type: ${config.prospectType}
- Difficulty: ${config.difficulty}
- Rep's role: ${config.role}
- Market: ${config.market}

COACHING PHILOSOPHY (use as background context, not a scorecard):
${OBJECTION_GUIDE}

CALL TRANSCRIPT:
${transcript}

Use the coaching philosophy above as background context to inform your feedback — not as a checklist. The goal is to give the rep useful, encouraging coaching that helps them improve over time. Focus on the spirit of good sales conversations: curiosity, listening, uncovering what the owner actually cares about, and building trust. If objections came up, offer a practical suggestion on how they might have approached it — but frame it as a tip, not a correction.

Provide a coaching debrief in this exact JSON format. Address ${config.repName || 'the rep'} by name in the overallSummary and technique fields:
{
  "overallScore": <number 1-10>,
  "overallSummary": "<2-3 sentence overall assessment addressing ${config.repName || 'the rep'} by name — be specific to what happened in this call>",
  "strengths": ["<specific strength with example from the call>", "<specific strength with example from the call>"],
  "improvements": ["<practical, encouraging suggestion with a moment from the call>", "<practical, encouraging suggestion with a moment from the call>"],
  "technique": "<one concrete tip they can try on their next call — give the actual words or approach they could use>",
  "grade": "<A, B, C, D, or F — single letter only, no plus or minus>"
}

Be specific to what was actually said. Do not be generic.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: debriefPrompt }]
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in debrief response');
    const debrief = JSON.parse(jsonMatch[0]);
    res.json(debrief);
  } catch (error) {
    console.error('Debrief API error:', error);
    res.status(500).json({ error: 'Debrief generation failed' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`CRE Simulator running at http://localhost:${PORT}`);
});
