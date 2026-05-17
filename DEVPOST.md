# Sentra AI — Devpost submission cheat-sheet

Copy-paste content for the **Hack the Tech 2026** submission form. Cybersecurity & Privacy track.

---

## Project name
**Sentra AI**

## Tagline (60 chars max)
**AI phishing sentinel — paste an email, get a verdict in seconds.**

## Thumbnail / cover image
Two options:
- Screenshot of the landing page with the **PayPal phishing** example analyzed (red gauge, red flags expanded). 1280×640.
- Or use the auto-generated OG image at `/opengraph-image` (already at 1200×630, branded, includes all seven mode pills) — open it in the browser, screenshot it.

---

## Description (long form)

### Inspiration
Spam filters catch the bulk, but the phishing emails that *get through* are the ones that look perfectly legitimate at 9:47 AM on a Monday: brand-perfect HTML, lookalike domains, urgent tone, trust-anchored links. Studies attribute **90% of breaches** to phishing as the initial vector — not because users are careless, but because modern attacks are good enough to fool a careful reader.

I wanted a **second opinion** I could trust — something that does what a security analyst would do, but in seconds, free, and which also *teaches* the user how to spot the next one without help.

### What it does
**Sentra AI** is a seven-mode web workbench for email security, built around one core pipeline: deterministic heuristics fused with an LLM analyst.

| Mode | What it does |
|---|---|
| **Analyzer** | Paste raw email → two-layer verdict + risk score + ranked red flags + annotated source + **Received-chain forensics** + streaming **follow-up chat** grounded in this email. |
| **URL Inspector** | Paste a single URL → structural analysis (Punycode, lookalike, IP host, suspicious TLD, @-trick, shortener, deep-subdomain) without ever fetching the URL. |
| **Compare** | Two emails side by side → parallel analysis with a 3-column diff (Only in A / In both / Only in B) and a score-delta banner. |
| **Train** | Three-button quiz over ten real-pattern emails. |
| **Inbox** | Gmail-like inbox of mixed real/fake mail — triage *before* opening, get graded. |
| **Anatomy** | Step-driven walkthrough of one PayPal phish, eight stops, animated highlights of header / sender / link / content tricks. |
| **Insights** | Charts over the session's local history + an **AI Defense Brief** — Gemini reads your analysis log and writes a personalized 1-page security training. |

Plus across the app:
- **Live heuristic chips** while you type — regex-only client-side checks, no LLM call, instant feedback before you even click Analyze.
- **⌘K command palette** — fuzzy-match every mode and every entry in history.
- **Session history** in `localStorage` — last 25 analyses, click to re-open, no account.
- **Share verdict via URL hash** — verdict + raw email base64-encoded into a deep link, no server-side storage.
- **Markdown report export** for every analysis.

### How I built it

**Layer 1 — deterministic heuristics** (pure TypeScript, runs on Node):
- MIME parsing via `postal-mime` → headers, body, links, attachments.
- SPF / DKIM / DMARC pulled from `Authentication-Results`.
- Reply-To / Return-Path mismatch.
- **Received-chain forensics**: parses every `Received:` header, reconstructs the SMTP path, flags single-hop messages, private-IP injection, time-travel timestamps, and abnormal hop gaps.
- Brand impersonation: free-mail-from-brand, Levenshtein distance on the brand label, Punycode (`xn--`) detection.
- Link analysis: anchor-text vs. real `href` mismatch, `@`-trick credentials, raw-IP URLs, URL shorteners, high-abuse TLDs (`.zip`, `.top`, `.click`, …).
- Content patterns: urgency, threats, credential requests, money bait, MFA-fatigue cues.
- Risky attachment extensions (`.exe`, `.docm`, `.iso`, `.scr`, `.hta`, …).

**Layer 2 — Gemini 2.5 Flash as the analyst.** Three distinct Gemini prompts in this app:
- **Analyze** (structured JSON via `responseSchema`) — verdict, score, red flags, actions, takeaway.
- **URL inspect** (structured JSON) — SAFE / SUSPICIOUS / MALICIOUS verdict from structural findings alone.
- **Follow-up chat** (streaming) — conversational coach grounded in the specific email + the analyzer's prior verdict, refusing dual-use ("help me write a phishing email") asks.
- **Defense brief** (streaming) — meta-LLM call that reads the user's analysis history and writes personalized training.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind CSS 4 with a custom design-token layer · `@google/generative-ai` · `postal-mime` · `lucide-react` · Vercel for hosting.

Zero database. Zero auth. Zero server-side state. History lives in `localStorage`, shared verdicts live in the URL hash.

### Challenges I ran into
- **Strict JSON from LLMs.** Gemini's `responseSchema` saved hours of regex tolerance. Every analysis route is guaranteed-parseable JSON.
- **Heuristic false positives.** First pass flagged every email containing "urgent". Tuned by adding severity weights and requiring 2+ urgency hits before raising a high-severity flag. Built two pure-SAFE baselines (legit Stripe, legit GitHub) to ensure Sentra doesn't cry wolf.
- **Brand-impersonation logic.** Detecting `paypa1.com` and `xn--ppal-2nb.com` without flagging legitimate `paypalobjects.com` took a Levenshtein-plus-allowlist approach.
- **Streaming chat in Next.js 16.** Wiring `ReadableStream` from the Gemini SDK through a Node-runtime route, then progressively re-rendering React state with proper React-19 immutability rules.
- **PRO-grade UI in a hackathon.** Built a unified design-token layer (`surface`, `surface-elev`, `hairline`, `btn-primary`, `kicker`) plus animated radial-mesh background, per-mode gradient accents, ⌘K command palette, and a sidebar / sticky topbar layout so it doesn't look like Tailwind starter.

### Accomplishments I'm proud of
- **Seven working modes**, end-to-end, solo, in the hackathon window.
- **Four distinct Gemini surfaces** — structured JSON for verdicts, streaming for chat, streaming for the defense brief. Each with its own purpose-built system prompt.
- **An educational layer in every artifact** — verdicts ship with takeaways, the brief generates personalized training, the Anatomy mode breaks one phish into eight teachable tricks.
- **Real cyber depth** — Received-chain forensics, Punycode/homoglyph detection, brand-lookalike Levenshtein — not just LLM smoke and mirrors.
- **PRO UI** — sidebar, sticky topbar, ⌘K palette, animated mesh background, branded OG image for shares, custom 404. Doesn't read as a hackathon prototype.

### What I learned
- Structured LLM output (`responseSchema`) is the single biggest unlock for agentic features — it eliminates a whole class of brittle parsing code.
- The hardest part of an email-security tool isn't catching the obvious phishing. It's *not* crying wolf on the legitimate Stripe receipt.
- Tight scope wins hackathons — the temptation to add OAuth, Gmail integration, a Chrome extension was real. Rejecting all of it is why the demo works in under 60 seconds.
- A two-layer architecture (heuristics + LLM) plays much better on stage than either layer alone — judges immediately understand the trust model.

### What's next
- **Browser bookmarklet / Chrome extension** that submits the open thread to Sentra.
- **Self-hosted variant** for security teams that can't send mail content to a third-party LLM (swap Gemini → local Llama / Qwen behind the same JSON contract).
- **Outbound link safety** via passive DNS / VirusTotal lookup with explicit user consent.
- **Multilingual content heuristics** (current language patterns are English-only).
- **Confidence calibration** on real corpora (Nazario, PhishTank) to tune thresholds.

---

## Built with
`next-js`, `typescript`, `tailwind-css`, `google-gemini`, `gemini-2.5-flash`, `vercel`, `postal-mime`, `lucide-react`, `node-js`, `next-og`, `localstorage`

## Try it out links
- **Live demo:** *[paste your Vercel URL here]*
- **Source:** <https://github.com/Mateuszl28/Sentra_AI>

---

## Demo video script (60-90 sec)

> Phishing emails cause 90% of breaches. Spam filters catch most. The ones that get through are the dangerous ones — they look perfectly real.
>
> *[show landing page — sidebar visible on left, sticky topbar]*
>
> This is Sentra AI. Seven modes for email security. I'll start with the analyzer.
>
> *[paste a phishing email — or click PayPal sample chip — notice the live red-flag chips appear under the textarea before clicking Analyze. Then hit Analyze.]*
>
> Before I even click Analyze, Sentra is already flagging SPF fail, the lookalike domain, and credential-request language — running client-side, no network call.
>
> *[Analyze runs in ~4 seconds]*
>
> Verdict: **PHISHING**. Risk score 87. Six red flags — each with a plain-English explanation. Annotated source view shows exactly *where* in the raw email each red flag came from.
>
> *[scroll to Header forensics]*
>
> Sentra also reconstructs the SMTP path — Received-chain forensics. Origin host, IP, every hop, every relay's timestamp. It flags single-hop messages and private-IP injection.
>
> *[scroll to follow-up chat]*
>
> And every verdict ships with a follow-up chat. *[type: "explain SPF like I'm five"]* — Gemini answers, grounded in this specific email.
>
> *[switch to URL mode via ⌘K]*
>
> ⌘K to switch modes. Drop a single URL — Sentra decomposes it without fetching it. Punycode, lookalike, IP, suspicious TLD, all detected.
>
> *[switch to Inbox simulator]*
>
> Inbox simulator — a real-feeling Gmail-style inbox with mixed real and fake mail. Triage before opening. Sentra grades you.
>
> *[switch to Insights → click "Generate" on Defense brief]*
>
> Finally, the AI Defense Brief. Gemini reads your session and writes a personalized 1-page security training. Specific to *what you saw*.
>
> Sentra AI. Two layers, seven modes, zero accounts. Built solo for Hack the Tech 2026.

---

## Pre-submission checklist
- [ ] Live demo URL works (Gemini API key set in Vercel, scope: Production)
- [ ] Try every example email once — verify verdicts make sense
- [ ] Try every mode once — Analyzer, URL, Compare, Train, Inbox, Anatomy, Insights
- [ ] Generate one Defense Brief from a non-empty history
- [ ] Send a Share URL to yourself in another browser/incognito and confirm it rehydrates
- [ ] Screenshot the result view for thumbnail (PayPal phish, gauge filled red)
- [ ] Record screen demo (Loom / OBS, ~80 sec) following the script above
- [ ] Upload video (YouTube unlisted is fine)
- [ ] Submit at <https://hack-the-tech.devpost.com/> before **May 18 5:00am EDT (= 11:00 CEST)**
