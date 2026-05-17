# Sentra AI — Devpost submission cheat-sheet

Copy-paste content for the **Hack the Tech 2026** submission form. Cybersecurity & Privacy track.

---

## 🪪 Project name
**Sentra AI**

## 💬 Tagline (60 chars max)
**AI phishing sentinel — paste an email, get a verdict in seconds.**

## 🖼 Thumbnail / cover image
Take a screenshot of the landing page with one of the example emails analyzed (PayPal phish — the gauge filled red looks great). 1280×640.

---

## 📝 Description (long form)

### Inspiration
Spam filters catch the bulk, but the phishing emails that *get through* are the ones that look perfectly legitimate at 9:47 AM on a Monday: brand-perfect HTML, lookalike domains, urgent tone, trust-anchored links. Studies attribute **90% of breaches** to phishing as the initial vector — not because users are careless, but because modern attacks are good enough to fool a careful reader.

I wanted a **second opinion** I could trust — something that does what a security analyst would do, but in 5 seconds and free.

### What it does
**Sentra AI** is a web app where you paste any suspicious email (raw RFC-822, headers and all — Gmail's "Show original" is one click). It runs a **two-layer analysis** and returns:

- A **verdict** (SAFE / SUSPICIOUS / PHISHING) with a 0-100 risk score.
- A ranked list of **red flags**, each with a plain-English explanation of *why* the attacker uses that trick.
- Concrete **recommended actions** ("Do not click the link. Verify status by signing in at paypal.com directly.").
- A one-line **educational takeaway** so the user spots the same pattern next time on their own.

It also shows the underlying deterministic findings, so a power user can audit the reasoning.

### How I built it

**Layer 1 — deterministic heuristics** (pure TypeScript, runs on Node):
- MIME parsing with `postal-mime` → headers, body, links, attachments.
- SPF / DKIM / DMARC pulled from `Authentication-Results`.
- Reply-To / Return-Path mismatch check.
- Brand-impersonation detection: free-mail-from-brand, Levenshtein distance against legit brand domain labels, punycode (`xn--`) homoglyph detection.
- Link analysis: anchor-text vs. real `href` mismatch, `@`-trick credentials (`http://paypal.com@evil.tld`), raw-IP URLs, URL shorteners, high-abuse TLDs (`.zip`, `.top`, `.click`, …).
- Content patterns: urgency language, threats (account suspension), credential requests, money bait.
- Risky attachment extensions (`.exe`, `.docm`, `.iso`, `.scr`, …).

**Layer 2 — Gemini 2.0 Flash as the analyst.** The model receives the raw email *and* the heuristic findings, then returns strict JSON via Gemini's `responseSchema` (no JSON-parsing roulette). This is the key design choice: heuristics are reliable but blind to *context*; LLMs read context but hallucinate. The combination gives ground truth + readable narrative.

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS 4 · `@google/generative-ai` · `postal-mime` · `lucide-react` · Vercel for hosting.

### Challenges I ran into
- **Windows dev environment was a fight.** `npx` lock-compromised errors, a slow secondary drive bottlenecking npm install, port-3000 collisions with a leftover dev server. Real "you build the thing, then the laptop builds character" hackathon experience.
- **Strict JSON from LLMs.** Gemini's response-schema parameter saved me hours of regex tolerance — every analysis is now guaranteed-parseable JSON.
- **Heuristic false positives.** First pass flagged every email with the word "urgent". Tuned by adding severity weights and requiring 2+ urgency hits for the high-severity flag. Still room to grow.
- **Brand-impersonation logic.** Detecting `paypa1.com` and `xn--ppal-2nb.com` without flagging legitimate `paypalobjects.com` took a Levenshtein-plus-allowlist approach.

### Accomplishments I'm proud of
- End-to-end working product in ~36 hours **solo**: parser, heuristics, LLM layer, full UI, demo emails, deployed.
- Clean two-layer architecture that's easy to explain in a 60-second pitch.
- A real **educational takeaway** in every verdict — Sentra teaches the user, instead of just telling them what to do.

### What I learned
- Gemini's structured output is a game-changer for "agentic" features — it eliminates a whole class of brittle parsing code.
- The hardest part of an email-security tool isn't catching the obvious phishing. It's *not* crying wolf on the legitimate Stripe receipt. A SAFE verdict has to be just as confident.
- Tight scope wins hackathons. The temptation to add OAuth, Gmail integration, a Chrome extension was real — and rejecting all of it is why the demo works.

### What's next
- **Chrome / Gmail extension** that one-click submits the open thread to Sentra.
- **Self-hosted variant** for security teams that can't send mail content to a third-party LLM (swap Gemini → a local Llama / Qwen model behind the same API).
- **Outbound link safety check** — passive DNS / VirusTotal lookup with explicit user consent.
- **Multilingual phishing patterns** — current content heuristics are English-only.
- **Confidence calibration** — log heuristic-vs-LLM verdicts on real corpora (Nazario, PhishTank) to tune thresholds.

---

## 🛠 Built with
`next-js`, `typescript`, `tailwind-css`, `google-gemini`, `gemini-2.0-flash`, `vercel`, `postal-mime`, `lucide-react`, `node-js`

## 🔗 Try it out links
- **Live demo:** *[paste your Vercel URL here]*
- **Source:** <https://github.com/Mateuszl28/Sentra_AI>

---

## 🎥 Demo video script (60-90 sec)

> Phishing emails cause 90% of breaches. Spam filters catch most. The ones that get through are the dangerous ones — they look perfectly real.
>
> *[show landing page]*
>
> This is Sentra AI. I'll paste a phishing email — one that pretends to be from PayPal.
>
> *[click PayPal example chip, hit Analyze]*
>
> In about 4 seconds, Sentra returns a verdict: **PHISHING**, risk score 87 out of 100.
>
> *[scroll to red flags]*
>
> It found six red flags. The sender domain `paypal-secure-help.com` isn't a real PayPal domain. The link text says paypal.com but the real URL is an IP address. The SPF check failed. The email demands action within 24 hours — classic urgency manipulation.
>
> *[scroll to actions + takeaway]*
>
> Each red flag has a plain-English explanation. There's a concrete action list — "don't click, sign in at paypal.com directly." And every verdict ends with an educational takeaway so the user learns the pattern.
>
> *[click Stripe example, hit Analyze]*
>
> And it doesn't cry wolf. This is a real Stripe receipt — Sentra says SAFE, lists the legitimate signals.
>
> Sentra is a two-layer system. Deterministic TypeScript heuristics check SPF, DKIM, lookalike domains, URL tricks, urgency language. Then Gemini 2.0 Flash reads the raw email plus those findings and writes the verdict in plain English. Together: ground truth plus a readable narrative.
>
> Sentra AI. Built solo for Hack the Tech 2026.

---

## ✅ Pre-submission checklist
- [ ] Live demo URL works (Gemini API key set in Vercel)
- [ ] Try every example email once — verify verdicts make sense
- [ ] Screenshot the result view for thumbnail
- [ ] Record screen demo (Loom / OBS, ~80 sec)
- [ ] Upload video (YouTube unlisted is fine)
- [ ] Submit at https://hack-the-tech.devpost.com/ before **May 18 5:00am EDT (= 11:00 CEST)**
