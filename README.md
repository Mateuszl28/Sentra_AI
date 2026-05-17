# Sentra AI — Phishing Sentinel

> An AI-powered email security workbench. Paste a suspicious message — get a verdict, the reasoning, the live conversation, and the lesson, in seconds.
>
> Built for [**Hack the Tech 2026**](https://hack-the-tech.devpost.com/) · Cybersecurity & Privacy track.

![status](https://img.shields.io/badge/status-hackathon%20v2-22c55e) ![stack](https://img.shields.io/badge/Next.js-16-black) ![ai](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4) ![ui](https://img.shields.io/badge/Tailwind-4-38bdf8)

---

## The problem

**90% of breaches start with a phishing email.** Users don't fall because they're careless — they fall because modern phishing is good enough to fool a careful reader. Brand-perfect HTML, lookalike domains, urgency, and trust-anchored links bypass instinct.

Spam filters catch the bulk. What lands in your inbox at 9:47 AM "URGENT: action required" is the one that got through.

## What Sentra is

Sentra is a **seven-mode workbench** around one core idea: deterministic security heuristics fused with an LLM analyst, in a UI that doesn't just give a verdict — it teaches you how to read the next one yourself.

| Mode | What it does |
|---|---|
| **Analyzer** | Paste raw email → full two-layer analysis with annotated source, red flags, recommended actions, and a streaming follow-up chat. |
| **URL** | Paste a single URL/domain → structural inspection (punycode, lookalike, IP host, suspicious TLD, @-trick, shortener) + LLM verdict, without ever fetching the URL. |
| **Compare** | Two emails side by side → parallel analysis with a diff panel (Only in A / In both / Only in B) and a score-delta banner. |
| **Train** | Quiz mode — ten real-pattern emails, three guesses each, score tracker. |
| **Inbox** | Gmail-like inbox of mixed real/fake mail. Triage every message (report / trash / keep) without clicking, get graded. |
| **Anatomy** | Step-driven walkthrough of one phishing email, eight stops, animated highlights, plain-English explanations + transferable takeaways. |
| **Insights** | Verdict donut, risk-score histogram, top risky senders/hosts, click-through timeline — all client-side from your local history. |

## How the verdict is produced

1. **Deterministic heuristics** (pure TypeScript, Node runtime):
   - SPF / DKIM / DMARC pulled from `Authentication-Results`
   - Reply-To / Return-Path mismatch
   - Display-name vs. From-domain spoofing
   - Lookalike domains (Levenshtein on the brand label)
   - Punycode (`xn--`) homoglyph attacks
   - Anchor-text vs. real `href` mismatch
   - `@`-trick credentials in URLs (`http://paypal.com@evil.tld`)
   - URL shorteners, raw-IP URLs, deep-subdomain stacks, suspicious TLDs
   - Urgency, threat, credential-request and money-bait language
   - Risky attachment extensions (`.exe`, `.docm`, `.iso`, `.hta`, …)
2. **Gemini 2.5 Flash as the analyst.** The model receives the raw email *plus* the heuristic findings, then returns strict JSON: verdict (SAFE / SUSPICIOUS / PHISHING), 0-100 risk score, ranked red flags with plain-English explanations, recommended actions, legitimate signals, and a one-line educational takeaway.
3. **Follow-up chat.** After the verdict, a streaming Gemini chat session takes over — grounded in the specific email and the analyzer's conclusions. Ask "why is this phishing?", "explain SPF like I'm five", or "what if I already clicked?" — answers come back live.

Same pipeline shape — heuristics first, LLM second — powers the URL Inspector with a separate structural-checks layer.

## Live-typing feedback

While you paste, a tiny regex-only client-side heuristic engine highlights findings as chips below the textarea — **no network call, no LLM** — so the user sees Punycode / @-trick / brand mismatches *before* they even click Analyze. The full pipeline still runs on submit and may upgrade or contradict the preview.

## Session history & share-by-URL

- Every analysis (email or URL) is saved to the **last 25** entries in browser `localStorage`. The header counter shows totals + a phishy badge. Click any entry to re-open it in the right mode.
- **Share Verdict** copies a deep link with the verdict payload base64-encoded into the URL hash. Opening the link rehydrates the result client-side — no API call required, no server-side storage.

Everything stays on-device. Sentra has no accounts, no database, no analytics tracker.

## Demo gallery

Ten baked-in examples cover the patterns judges actually want to see:

| Example | Verdict | Pattern |
|---|---|---|
| PayPal account suspended | PHISHING | Lookalike domain + urgency + anchor↔href mismatch |
| CEO gift-card request | PHISHING | Display-name spoof + webmail Reply-To |
| Microsoft 365 mailbox full | PHISHING | Punycode homoglyph + suspicious TLD |
| DHL re-delivery with `.docm` | PHISHING | Parcel lure + macro attachment + shortener |
| Apple ID locked | PHISHING | Brand spoof + urgency + lookalike Apple domain |
| Payroll direct-deposit change | PHISHING | Pure-text BEC, no links, bank-account redirect |
| Microsoft Authenticator approval | PHISHING | MFA-fatigue social engineering |
| Unpaid invoice (.iso) | PHISHING | Invoice lure + ISO malware container |
| LinkedIn "you appeared in searches" | SUSPICIOUS | Subtle off-brand domain, polished copy |
| GitHub SSH key added | SAFE | Verified transactional baseline |
| Stripe receipt | SAFE | Verified transactional baseline |

Plus six pre-loaded URLs in URL Inspector (lookalike, punycode, @-trick, suspicious TLD, shortener, legit github.com) and three Compare presets (PayPal vs Stripe, Microsoft vs GitHub, Apple vs LinkedIn).

## Run locally

```bash
npm install
echo "GEMINI_API_KEY=your_key_here" > .env.local   # get one at https://aistudio.google.com/apikey
npm run dev
```

Open <http://localhost:3000>.

## Deploy

1. Push to a public GitHub repo (Devpost requirement).
2. Import to [Vercel](https://vercel.com/new).
3. Add `GEMINI_API_KEY` in **Project Settings → Environment Variables** (scope: Production + Preview + Development).
4. Redeploy. The `/api/analyze`, `/api/inspect-url` and `/api/chat` routes all run on the Node runtime with a 30 s budget.

## Tech

- **Next.js 16** (App Router, Turbopack, Node runtime for API routes)
- **React 19** + TypeScript strict mode
- **Tailwind CSS 4** + a tiny custom dark theme
- **`@google/generative-ai`** for Gemini 2.5 Flash — structured output for analysis routes, streaming chat for follow-up Q&A
- **`postal-mime`** for cross-runtime MIME parsing
- **`lucide-react`** for icons

Zero database, zero auth, zero state on the server. History lives in `localStorage`, shared verdicts live in the URL hash.

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts       # POST raw email → JSON analysis
│   │   ├── inspect-url/route.ts   # POST URL → JSON inspection
│   │   └── chat/route.ts          # Streaming follow-up chat (text/plain)
│   ├── layout.tsx, page.tsx       # 7-mode shell, share-hash decode
│   └── globals.css
├── components/
│   ├── EmailInput.tsx             # Paste box, .eml upload, examples, live chips
│   ├── ResultView.tsx             # Verdict + gauge + red flags + actions + chat
│   ├── FollowUpChat.tsx           # Streaming Gemini chat grounded in the analysis
│   ├── UrlInspector.tsx           # URL mode — input + verdict + structural findings
│   ├── CompareMode.tsx            # Two-slot side-by-side + diff panel
│   ├── InboxSimulator.tsx         # Gmail-like triage game
│   ├── TrainMode.tsx              # Three-button quiz
│   ├── Anatomy.tsx                # Step-driven phishing walkthrough
│   ├── Insights.tsx               # Charts over localStorage history
│   ├── HistoryPanel.tsx           # Slide-out history drawer
│   ├── ShareButton.tsx            # Copies share URL with encoded verdict
│   ├── AnnotatedSource.tsx, RedFlagCard.tsx, RiskGauge.tsx,
│   │ VerdictBadge.tsx, Logo.tsx
└── lib/
    ├── heuristics/                # Email-side deterministic checks
    │   ├── parseEmail.ts          # MIME → ParsedEmail
    │   ├── headers.ts             # SPF/DKIM/DMARC + Reply-To
    │   ├── sender.ts              # Brand impersonation, lookalikes
    │   ├── links.ts               # Mismatch, IP URLs, shorteners
    │   ├── content.ts             # Urgency, threats, credential requests
    │   └── index.ts               # Orchestrator + scoring
    ├── url-inspector.ts           # Structural checks for single URLs
    ├── live-heuristics.ts         # Client-side regex-only chips
    ├── gemini.ts                  # Three Gemini clients: analyze, URL, chat
    ├── share.ts                   # URL-hash encode/decode for shared verdicts
    ├── report.ts                  # Markdown report builder
    ├── useHistory.ts              # localStorage hook for session history
    ├── examples.ts                # Curated demo emails
    └── types.ts
```

## What's *not* in this MVP (by design)

- No accounts, no server-side persistence — every artifact (history, shared verdict) lives in the user's browser or in the URL.
- No outbound link fetching — Sentra never opens, resolves DNS for, or screenshots the URLs in the email.
- No file upload beyond `.eml` text — no binary parsing on the server.

## Limitations

- Verdicts are probabilistic. A `SAFE` rating is not a guarantee — when in doubt, log into the service directly through a fresh browser tab.
- Heuristics only see what's in the email you paste. If headers were stripped before forwarding, half the analysis is gone.
- The Gemini free tier is rate-limited (15 RPM). Plenty for a demo, not enough for a fleet — and the chat endpoint streams, so each conversation counts as multiple billing units on paid tiers.
- Shared-verdict URLs base64-encode the email and analysis into the hash, so they grow with the size of the message. They're meant for individual demo links, not bulk sharing.

---

Built solo by [Mateusz](mailto:lagockimateusz6@gmail.com) for the [Hack the Tech 2026](https://hack-the-tech.devpost.com/) hackathon.
