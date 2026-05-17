# Sentra AI — Devpost submission cheat-sheet

Copy-paste content for the **Hack the Tech 2026** submission form. Cybersecurity & Privacy track.

---

## Project name
**Sentra AI**

## Tagline (60 chars max)
**Two-layer email defense — heuristics + Gemini, seven modes.**

## Thumbnail / cover image
Two options:
- Screenshot of the analyzer with the **PayPal phishing** example analyzed (gauge filled red, red flags expanded, ATT&CK badges visible).
- Or the auto-generated OG image at `/opengraph-image` — open it in the browser, screenshot it (1200×630, branded, includes all seven mode pills).

---

## Description (long form)

### Inspiration
Spam filters catch the bulk, but the phishing emails that *get through* are the ones that look perfectly legitimate at 9:47 AM on a Monday: brand-perfect HTML, lookalike domains, urgent tone, trust-anchored links. Studies attribute **90% of breaches** to phishing as the initial vector — not because users are careless, but because modern attacks are good enough to fool a careful reader.

I wanted a **second opinion** I could trust — something that does what a security analyst would do, in seconds, free, and which also *teaches* the user how to spot the next one without help.

### What it does
**Sentra AI** is a seven-mode web workbench for email security, built around one core pipeline: deterministic heuristics fused with an LLM analyst, then cross-checked against live DNS truth.

| Mode | What it does |
|---|---|
| **Analyzer** | Paste raw email → two-layer verdict + risk score + ranked red flags + **annotated source** + **Received-chain forensics** + **SPF/DKIM/DMARC live DNS panel** + **sandboxed HTML preview** + streaming **follow-up chat**. |
| **URL Inspector** | Paste a single URL → structural analysis (Punycode, lookalike, IP, suspicious TLD, @-trick, shortener, deep-subdomain) + **live RDAP domain age** + **MX records via DoH** + LLM verdict, without ever fetching the URL. |
| **Compare** | Two emails side by side → parallel analysis with a 3-column diff (Only in A / In both / Only in B). |
| **Train** | Three-button quiz over ten real-pattern emails. |
| **Inbox** | Gmail-like inbox of mixed real/fake mail — triage *before* opening, get graded. |
| **Anatomy** | Step-driven walkthrough of one phishing email, eight stops, animated highlights. |
| **Insights** | Verdict donut, risk-score histogram, top risky senders/hosts, click-through timeline, and an **AI Defense Brief** — Gemini reads the session and writes personalized training. |

Across the app:
- **Live heuristic chips** while you type — regex-only client-side checks, no LLM call.
- **Heuristics ↔ LLM agreement score** — "High confidence", "Split decision" or "Layers conflict" badge on every verdict.
- **MITRE ATT&CK technique tags** on every deterministic finding, linking to attack.mitre.org.
- **Session history** in `localStorage` — last 25, click to re-open, CSV export.
- **⌘K command palette** + `?` shortcuts modal.
- **Share dropdown** — copy share link (hash-encoded, no server), download verdict as a 1200×630 PNG, copy Markdown report.
- **Bookmarklet** at `/bookmarklet` — drag to your bookmarks bar, then one-click triage on any email in any web mail.
- **Toast notifications** + first-visit ⌘K hint.

### How I built it

**Layer 1 — deterministic heuristics** (pure TypeScript, runs on Node):
- MIME parsing via `postal-mime` → headers, body, links, attachments.
- SPF / DKIM / DMARC pulled from `Authentication-Results`.
- **Received-chain forensics** — full SMTP path reconstruction, flags single-hop, private-IP leak, abnormal time gaps, backwards-running timestamps.
- **30+ brand impersonation profiles** — Levenshtein lookalike + free-mail-from-brand + Punycode (`xn--`) detection.
- Link analysis: anchor-text vs. real `href` mismatch, `@`-trick credentials, raw-IP URLs, URL shorteners, deep-subdomain stacks, high-abuse TLDs.
- Content patterns: urgency, threats, credential requests, money bait, MFA-fatigue.
- Risky attachment extensions.

**Layer 2 — Gemini 2.5 Flash as the analyst.** Four distinct Gemini surfaces:
- **Analyze** (structured JSON via `responseSchema`) — verdict, score, red flags, actions, takeaway.
- **URL inspect** (structured JSON) — SAFE / SUSPICIOUS / MALICIOUS from structural findings alone.
- **Follow-up chat** (streaming) — conversational coach grounded in the specific email + verdict.
- **Defense brief** (streaming) — meta-LLM that reads the user's analysis history and writes a personalized 1-page Markdown training.

**Layer 3 — live DNS truth.**
- **RDAP** via [rdap.org](https://rdap.org) — domain age, registrar, expiry. `<7d` registration is the strongest real-world phishing tell.
- **DoH** via Cloudflare 1.1.1.1 — MX records (catches Null-MX phishing infra), SPF policy, DMARC policy, DKIM public-key resolution by selector.
- **DKIM inspection** — parses every `DKIM-Signature` header (v/a/d/s/c/h/bh/b), resolves `<selector>._domainkey.<domain>`, reports key status (present / revoked / missing / malformed / lookup-failed) and algorithm match.

**Layer 4 — agreement score.** Sentra cross-checks the deterministic risk score against the LLM's risk score and surfaces one of three confidence bands on the verdict card: **High confidence** / **Split decision** / **Layers conflict**.

**Layer 5 — sandboxed HTML preview.** The analyzer re-parses the email body client-side, runs it through a strict sanitizer (drops scripts/styles/iframes, neutralizes `on*` handlers, blocks `javascript:` / `data:` URIs, **replaces every `<img src>` with an inline SVG placeholder** so attackers can't pixel-beacon the recipient's IP, makes links inert but visible with the real URL on hover), and renders into an `iframe sandbox="" srcdoc="…"`. The email looks the way the victim would see it, but nothing can run, navigate, or call home.

**Stack:** Next.js 16 (App Router, Turbopack, Node + Edge runtimes) · React 19 · TypeScript strict · Tailwind CSS 4 with a custom design-token layer (`surface`, `surface-elev`, `hairline`, `btn-primary`, `kicker`, `kbd`) · `@google/generative-ai` · `postal-mime` · `next/og` · `lucide-react`. Cloudflare DoH and rdap.org used for DNS / domain intelligence — zero keys, zero signup. **Zero database, zero auth, zero server-side state.** History lives in `localStorage`. Shared verdicts live in the URL hash.

### Challenges I ran into
- **Strict JSON from LLMs.** Gemini's `responseSchema` saved hours of regex tolerance.
- **Heuristic false positives.** First pass flagged every email with "urgent". Tuned by severity weights and minimum-hit thresholds. Built two pure-SAFE baselines (legit Stripe, legit GitHub).
- **Sandboxing untrusted email HTML.** Built a defense-in-depth sanitizer + sandbox="" iframe, then specifically blocked the one residual attack vector that even `sandbox=""` doesn't stop — `<img src>` pixel beacons.
- **DKIM inspection without full crypto.** Full RFC 6376 verification needs intricate header/body canonicalization. Instead I parse the signature and verify the *public key resolves at the right selector* — already catches a huge slice of forged DKIM, because attackers often invent a selector that simply doesn't exist in DNS.
- **PRO-grade UI in hackathon time.** Built a unified design-token layer + animated radial-mesh background + ⌘K palette + sidebar/topbar so it doesn't read as a hackathon prototype.

### Accomplishments I'm proud of
- **Seven working modes**, four distinct Gemini surfaces, three layers of live DNS truth — solo, in the hackathon window.
- **MITRE ATT&CK mapping** on every deterministic finding, linking out to attack.mitre.org — real cyber framework alignment.
- **An educational layer in every artifact** — takeaways in every verdict, the Defense Brief generates personalized training, Anatomy breaks one phish into eight teachable tricks, the bookmarklet brings it into the user's real inbox.
- **Real cyber depth** — Received-chain forensics, DKIM/SPF/DMARC live parsers, Punycode/homoglyph, brand-lookalike Levenshtein, RDAP domain age, sandboxed HTML preview — not just LLM smoke and mirrors.
- **PRO UI** — sidebar, sticky topbar, ⌘K palette, animated mesh background, branded OG image, PNG verdict card, error boundary, custom 404, toast system.

### What I learned
- Structured LLM output (`responseSchema`) is the single biggest unlock for agentic features.
- A two-layer architecture (heuristics + LLM) plus a third *live DNS* layer plays much better on stage than any one alone — judges immediately understand the trust model.
- The hardest part of an email-security tool isn't catching the obvious phishing. It's *not* crying wolf on the legitimate Stripe receipt.

### What's next
- **Browser extension** based on the bookmarklet logic.
- **Self-hosted variant** — swap Gemini → local Llama / Qwen behind the same JSON contract.
- **Full DKIM cryptographic verification** with Web Crypto.
- **Multilingual content heuristics** (English-only today).
- **Confidence calibration** on real corpora (Nazario, PhishTank).

---

## Built with
`next-js`, `react`, `typescript`, `tailwind-css`, `google-gemini`, `gemini-2.5-flash`, `vercel`, `postal-mime`, `next-og`, `lucide-react`, `node-js`, `cloudflare-doh`, `rdap`, `mitre-attack`, `localstorage`

## Try it out links
- **Live demo:** *[paste your Vercel URL here]*
- **Source:** <https://github.com/Mateuszl28/Sentra_AI>

---

## Demo video script (~90 sec)

> Phishing emails cause 90% of breaches. Spam filters catch most. The ones that get through look perfectly real.
>
> *[show landing — sidebar, hero, sticky topbar]*
>
> This is Sentra AI. Seven modes for email security. Let me show you the analyzer first.
>
> *[click PayPal sample — live red-flag chips appear under the textarea before Analyze is clicked]*
>
> Before I even click Analyze, Sentra flags SPF fail, the lookalike domain, urgency. Client-side, no network call.
>
> *[click Analyze. Loading skeleton appears. Result in ~4 sec.]*
>
> **PHISHING**, risk score 87. And next to the verdict — *Split decision* — meaning Sentra's heuristics and Gemini's reading don't perfectly agree, treat with caution.
>
> *[scroll to red flags — six found. Each one has a MITRE ATT&CK badge]*
>
> Every deterministic finding is tagged with the real MITRE ATT&CK technique — T1566 Phishing, T1036.005 Match Legitimate Name, T1583.001 Acquire Infrastructure. Click any of them, jump straight to attack.mitre.org.
>
> *[scroll to Email Authentication]*
>
> This is the email-auth panel. SPF, DKIM and DMARC, fetched **live** from DNS over HTTPS. SPF tail is open. DMARC says p=none — monitoring only. DKIM selector doesn't exist at the signing domain. Three independent layers all say "this domain is not authorized to send this email".
>
> *[scroll to Received chain forensics]*
>
> SMTP path reconstructed from the Received headers. Single hop, private-IP injection — typical of homemade spam infrastructure.
>
> *[scroll to Rendered preview, click toggle]*
>
> And this is what the victim would see. Fully sandboxed iframe. Scripts can't run, images blocked so the sender can't beacon your IP, every link disabled but shown so you can read the real URL.
>
> *[scroll to follow-up chat, type "explain SPF like I'm five"]*
>
> Every verdict ships with a follow-up chat. Gemini, grounded in this exact email and the analyzer's verdict.
>
> *[hit ⌘K]*
>
> ⌘K to switch modes. URL Inspector takes a single URL — same pipeline, plus live RDAP domain age and MX records. Domain registered 4 days ago, Null-MX — phishing-only infrastructure.
>
> *[switch to Inbox simulator briefly]*
>
> Inbox simulator drills triage skills. *[click one card]* Report. Wrong — that was the legit Stripe receipt.
>
> *[switch to Insights → click Generate on Defense Brief]*
>
> Finally — the AI Defense Brief. Gemini reads your session and writes you personalized security training.
>
> Sentra AI. Three layers — heuristics, Gemini, live DNS. Seven modes. Zero accounts. Built solo for Hack the Tech 2026.

---

## Pre-submission checklist
- [ ] Live demo URL works (Gemini API key set in Vercel, scope: Production)
- [ ] Try every example email once — verify verdicts make sense
- [ ] Try every mode once — Analyzer / URL / Compare / Train / Inbox / Anatomy / Insights
- [ ] Generate one Defense Brief from a non-empty history
- [ ] Send a share URL to yourself in incognito and confirm it rehydrates
- [ ] Try the bookmarklet on Gmail "Show original"
- [ ] Screenshot the result view for thumbnail (PayPal phish, gauge filled red, ATT&CK badges visible)
- [ ] Record screen demo (Loom / OBS, ~90 sec) following the script above
- [ ] Upload video (YouTube unlisted is fine)
- [ ] Submit at <https://hack-the-tech.devpost.com/> before **May 18 5:00am EDT (= 11:00 CEST)**
