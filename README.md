# Sentra AI — Phishing Sentinel

> An AI-powered email security analyst. Paste a suspicious message and get a verdict — and the reasoning — in seconds.
>
> Built for [**Hack the Tech 2026**](https://hack-the-tech.devpost.com/) · Cybersecurity & Privacy track.

![status](https://img.shields.io/badge/status-hackathon%20MVP-22c55e) ![stack](https://img.shields.io/badge/Next.js-16-black) ![ai](https://img.shields.io/badge/Gemini-2.0%20Flash-4285F4)

---

## The problem

**90% of breaches start with a phishing email.** Users don't fall because they're careless — they fall because modern phishing is good enough to fool a careful reader. Brand-perfect HTML, lookalike domains, urgency, and trust-anchored links bypass instinct.

Spam filters catch the bulk. What lands in your inbox at 9:47 AM "URGENT: action required" is the one that got through.

## What Sentra does

Sentra is the second opinion. Paste an email — Sentra performs a **two-layer analysis**:

1. **Deterministic heuristics** (pure TypeScript, runs on Node):
   - SPF / DKIM / DMARC pulled from `Authentication-Results`
   - Reply-To / Return-Path mismatch
   - Display-name vs. From-domain spoofing
   - Lookalike domains (Levenshtein on the brand label)
   - Punycode (`xn--`) homoglyph attacks
   - Anchor-text vs. real `href` mismatch
   - `@`-trick credentials in URLs (`http://paypal.com@evil.tld`)
   - URL shorteners, raw-IP URLs, suspicious TLDs
   - Urgency, threat, credential-request and money-bait language
   - Risky attachment extensions (`.exe`, `.docm`, `.iso`, …)
2. **Gemini 2.0 Flash as the analyst.** The model receives the raw email *and* the heuristic findings, then returns strict JSON: verdict (SAFE / SUSPICIOUS / PHISHING), 0-100 risk score, ranked red flags with plain-English explanations, recommended actions, and a one-line **educational takeaway** so the user learns the pattern.

## Why two layers

Heuristics are reliable but blind to context. LLMs read context but hallucinate. The combination = ground truth + readable narrative. The user sees both the deterministic checks and the LLM's reasoning, side by side.

## Try it

Five baked-in examples cover the most common phishing patterns:

| Example | Pattern |
|---|---|
| PayPal account suspended | Lookalike domain + urgency + fake login URL |
| CEO gift-card request | Business Email Compromise (display-name spoof) |
| Microsoft 365 mailbox full | Brand + .top TLD + punycode link |
| DHL re-delivery | Parcel lure + `.docm` macro attachment |
| Stripe receipt | **Legit** baseline so Sentra doesn't cry wolf |

Click one, hit **Analyze email**. Verdict in ~3-5 seconds.

## Run locally

```bash
pnpm install
echo "GEMINI_API_KEY=your_key_here" > .env.local   # get one at https://aistudio.google.com/apikey
pnpm dev
```

Open <http://localhost:3000>.

## Deploy

1. Push to a public GitHub repo (Devpost requirement).
2. Import to [Vercel](https://vercel.com/new).
3. Add `GEMINI_API_KEY` in **Project Settings → Environment Variables**.
4. Deploy. The `/api/analyze` route runs on the Node runtime with a 30 s budget.

## Tech

- **Next.js 16** (App Router, Turbopack, Node runtime for the API route)
- **TypeScript** with strict mode
- **Tailwind CSS 4** + a tiny custom dark theme
- **`@google/generative-ai`** for Gemini 2.0 Flash with **strict response schema** (no JSON-parsing roulette)
- **`postal-mime`** for cross-runtime MIME parsing
- **`lucide-react`** for icons

## Project structure

```
src/
├── app/
│   ├── api/analyze/route.ts     # POST raw email → JSON analysis
│   ├── layout.tsx, page.tsx
│   └── globals.css
├── components/
│   ├── EmailInput.tsx           # Paste box, .eml upload, example chips
│   ├── ResultView.tsx           # Verdict + gauge + red flags + actions
│   ├── RedFlagCard.tsx
│   ├── RiskGauge.tsx
│   ├── VerdictBadge.tsx
│   └── Logo.tsx
└── lib/
    ├── heuristics/
    │   ├── parseEmail.ts        # MIME → ParsedEmail
    │   ├── headers.ts           # SPF/DKIM/DMARC + Reply-To
    │   ├── sender.ts            # Brand impersonation, lookalikes
    │   ├── links.ts             # Mismatch, IP URLs, shorteners
    │   ├── content.ts           # Urgency, threats, credential requests
    │   └── index.ts             # Orchestrator + scoring
    ├── gemini.ts                # Gemini client + schema + prompt
    ├── examples.ts              # Curated demo emails
    └── types.ts
```

## What's *not* in this MVP (by design)

- No accounts, no persistence — paste, get a verdict, move on. Educational, not a SaaS.
- No outbound link fetching — Sentra never opens the URLs in the email.
- No file upload beyond `.eml` text — no binary parsing on the server.

## Limitations

- Verdicts are probabilistic. A `SAFE` rating is not a guarantee — when in doubt, verify by logging into the service through a fresh browser tab.
- Heuristics only see what's in the email you paste. If headers are stripped, half the analysis is gone.
- The Gemini free tier is rate-limited (15 RPM). Plenty for a demo, not enough for a fleet.

---

Built solo by [Mateusz](mailto:lagockimateusz6@gmail.com) for the [Hack the Tech 2026](https://hack-the-tech.devpost.com/) hackathon.
