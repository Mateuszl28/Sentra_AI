# Sentra AI — Phishing Sentinel

> An AI-powered email security workbench. Paste a suspicious message — get a verdict, the reasoning, the live conversation, the SMTP forensics, the rendered preview, and the lesson, in seconds.
>
> Built for [**Hack the Tech 2026**](https://hack-the-tech.devpost.com/) · Cybersecurity & Privacy track.

![status](https://img.shields.io/badge/status-hackathon%20v3-22c55e) ![stack](https://img.shields.io/badge/Next.js-16-black) ![ai](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4) ![ui](https://img.shields.io/badge/Tailwind-4-38bdf8) ![dns](https://img.shields.io/badge/DNS-RDAP%20%2B%20DoH-8b5cf6)

---

## The problem

**90% of breaches start with a phishing email.** Users don't fall because they're careless — they fall because modern phishing is good enough to fool a careful reader. Brand-perfect HTML, lookalike domains, urgency, and trust-anchored links bypass instinct.

Spam filters catch the bulk. What lands in your inbox at 9:47 AM "URGENT: action required" is the one that got through.

## What Sentra is

Sentra is a **seven-mode security workbench** built around one core idea: deterministic heuristics fused with an LLM analyst, in a UI that doesn't just give a verdict — it teaches you how to read the next one yourself.

| Mode | What it does |
|---|---|
| **Analyzer** | Paste raw email → two-layer verdict + risk score + ranked red flags + **annotated source** + **Received-chain forensics** + **sandboxed HTML preview** + streaming **follow-up chat**. |
| **URL** | Paste a single URL → structural inspection (Punycode, lookalike, IP host, suspicious TLD, @-trick, shortener, deep-subdomain) + **live RDAP domain age** + **MX records via DoH** + LLM verdict, without ever fetching the URL. |
| **Compare** | Two emails side by side → parallel analysis with a 3-column diff (Only in A / In both / Only in B) and a score-delta banner. |
| **Train** | Three-button quiz over ten real-pattern emails. |
| **Inbox** | Gmail-like inbox of mixed real/fake mail — triage *before* opening, get graded. |
| **Anatomy** | Step-driven walkthrough of one phishing email, eight stops, animated highlights of header / sender / link / content tricks. |
| **Insights** | Verdict donut, risk-score histogram, top risky senders/hosts, click-through timeline — and an **AI Defense Brief** that turns your session into a personalized 1-page security training. |

## How the verdict is produced

1. **Deterministic heuristics** (pure TypeScript, Node runtime):
   - SPF / DKIM / DMARC pulled from `Authentication-Results`
   - Reply-To / Return-Path mismatch
   - Display-name vs. From-domain spoofing
   - **Received-chain forensics** — every hop, IP, protocol, timestamp; flags single-hop messages, private-IP leaks, backwards-time hops, abnormal gaps
   - Lookalike domains (Levenshtein on the brand label) against **30+ brand profiles** (PayPal, Stripe, Microsoft, Apple, Google, Slack, Zoom, Notion, Figma, Atlassian, Okta, Coinbase, Revolut, GitHub, …)
   - Punycode (`xn--`) homoglyph attacks
   - Anchor-text vs. real `href` mismatch
   - `@`-trick credentials in URLs (`http://paypal.com@evil.tld`)
   - URL shorteners, raw-IP URLs, deep-subdomain stacks, suspicious TLDs
   - Urgency, threat, credential-request and money-bait language
   - Risky attachment extensions (`.exe`, `.docm`, `.iso`, `.hta`, …)
2. **Gemini 2.5 Flash as the analyst.** The model receives the raw email *plus* the heuristic findings, then returns strict JSON via `responseSchema`: verdict (SAFE / SUSPICIOUS / PHISHING), 0-100 risk score, ranked red flags with plain-English explanations, recommended actions, legitimate signals, and a one-line educational takeaway.
3. **Agreement score.** Sentra cross-checks the deterministic heuristic score against the LLM's risk score and surfaces one of three confidence bands on the verdict card — **High confidence** (both layers in the same band), **Split decision** (adjacent bands — one layer is reading context the other can't), or **Layers conflict** (rare; treat with maximum caution).
4. **Follow-up chat.** After the verdict, a streaming Gemini chat session takes over — grounded in the specific email and the analyzer's conclusions. Ask "why is this phishing?", "explain SPF like I'm five", or "what if I already clicked?" — answers come back live.
5. **Defense Brief.** A meta-LLM call in Insights reads your recent analysis log and writes a personalized 1-page security training in Markdown. Streams in live.

Same pipeline shape — heuristics first, LLM second — powers the URL Inspector with a separate structural-checks layer plus live DNS truth.

## DNS truth & domain intelligence

Sentra goes beyond heuristics by consulting public DNS infrastructure live:

- **RDAP via [rdap.org](https://rdap.org)** — free meta-RDAP, no key. Returns the canonical registration date, registrar, last-changed and expiry. A `domain-very-fresh` (<7d) finding is the single strongest real-world phishing tell.
- **MX lookup via Cloudflare DoH** (`1.1.1.1/dns-query`). Detects RFC 7505 Null-MX records ("this domain refuses all email", a phishing-infra fingerprint) and domains with no MX at all.

Both run in parallel with the Gemini call, so total inspection latency stays under 2 s on a warm path.

## Sandboxed HTML preview

The Analyzer's **Rendered** tab parses the email body with `postal-mime` *client-side*, runs it through a strict sanitizer (drops `<script>` / `<style>` / `<iframe>` blocks, strips `on*` event handlers, blocks `javascript:` / `data:` URIs, neutralizes `<form>` and `<input>`, replaces every `<img src>` with an inline SVG placeholder to **prevent pixel-tracking IP leaks**, makes `<a href>` inert but visible with the real URL shown on hover), and renders the result into a fully sandboxed `<iframe sandbox="" srcdoc="…">`.

Net effect: the email **looks the way the victim would see it**, but nothing can run, navigate, or beacon home.

## Live-typing feedback

While you paste, a tiny regex-only client-side heuristic engine highlights findings as chips below the textarea — **no network call, no LLM** — so the user sees Punycode / @-trick / brand mismatches *before* they even click Analyze. The full pipeline still runs on submit and may upgrade or contradict the preview.

## Header forensics

Every analyzed email is decomposed into its `Received:` chain — origin host, IP, hop count, per-hop protocol, timestamps and time gaps. Sentra flags single-hop deliveries, private-range IPs leaking into the path, abnormal (>1h) relay gaps, and backwards-running timestamps. Rendered as a clean timeline with summary cards (Origin / Final relay / Hop count).

## Bookmarklet

The `/bookmarklet` route hosts a draggable `javascript:` link. Drag it to your bookmarks bar, then click it on any open Gmail message, Outlook thread or text-heavy page — Sentra opens in a new tab with the visible content pre-pasted, ready to analyze. Works hand-in-hand with Gmail's **Show original** for full SPF/DKIM/DMARC + Received-chain coverage.

## Share & export

The Share dropdown on every verdict offers three outputs:

- **Share link** — base64-encodes the analysis into the URL hash. Opening the link rehydrates the result client-side with zero API calls and zero server-side storage.
- **Verdict PNG** — generates a branded 1200×630 image of the verdict (gauge, sender, top three red flags, agreement badge) via `next/og` at `/api/verdict-card`. Drop straight into a deck, post, or DM.
- **Markdown report** — copies the full structured report to the clipboard.

## PRO UX

- **⌘K command palette** — fuzzy-match every mode plus the last 12 history entries, keyboard navigable.
- **`?` keyboard shortcuts panel** — discoverable list of every shortcut, grouped by area.
- **Persistent left sidebar** (Workbench / Learn groups) and a sticky topbar with breadcrumb-style mode header, online-Gemini status pill, history counter and a phishy badge.
- **Toast notifications** for every clipboard / share / brief action.
- **Branded OG image** at `/opengraph-image` so shared demo URLs preview cleanly on Slack / X / LinkedIn.
- **Custom 404** matching the app shell.
- **Live status indicator** ("Online · Gemini 2.5 Flash") in the sidebar footer.

## Session history

- Every analysis (email or URL) is saved to the **last 25** entries in browser `localStorage`. The header counter shows totals + a phishy badge.
- Click any entry to re-open it in the right mode. The `⌘K` palette searches it.
- Everything stays on-device. Sentra has no accounts, no database, no analytics tracker.

## Demo gallery

Ten baked-in emails cover the patterns judges actually want to see:

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

Plus **six pre-loaded URLs** in URL Inspector (lookalike, Punycode, @-trick, suspicious TLD, shortener, legit github.com) and **three Compare presets** (PayPal vs Stripe, Microsoft vs GitHub, Apple vs LinkedIn).

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
4. Redeploy. All routes pick up the key automatically.

## Routes

| Path | Runtime | Purpose |
|---|---|---|
| `/` | static | Workbench shell, 7 modes |
| `/bookmarklet` | static | Drag-to-bookmarks installer |
| `/icon.svg` | static | Brand favicon |
| `/opengraph-image` | edge | Branded OG card for social sharing |
| `/api/analyze` | node | POST raw email → JSON analysis + agreement |
| `/api/inspect-url` | node | POST URL → JSON inspection + RDAP + MX |
| `/api/chat` | node | Streaming follow-up chat grounded in an analysis |
| `/api/defense-brief` | node | Streaming personalized training from history |
| `/api/domain-info` | node | RDAP + MX lookup for any domain |
| `/api/verdict-card` | edge | PNG verdict card (1200×630) via `next/og` |

## Tech

- **Next.js 16** (App Router, Turbopack, Node + Edge runtimes for API routes)
- **React 19** + TypeScript strict mode
- **Tailwind CSS 4** + a custom design-token layer (`surface`, `surface-elev`, `hairline`, `btn-primary`, `kicker`, `kbd`)
- **`@google/generative-ai`** for Gemini 2.5 Flash — structured output via `responseSchema` for analysis routes, streaming for chat and defense brief
- **`postal-mime`** for cross-runtime MIME parsing (Node and browser)
- **`next/og`** for dynamic PNG generation (OG image, verdict card)
- **`lucide-react`** for icons
- **Cloudflare DoH** + **rdap.org** for DNS / domain intelligence — no keys, no signup

Zero database, zero auth, zero state on the server. History lives in `localStorage`, shared verdicts live in the URL hash.

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts            # POST raw email → JSON analysis + agreement
│   │   ├── inspect-url/route.ts        # POST URL → JSON inspection
│   │   ├── chat/route.ts               # Streaming follow-up chat
│   │   ├── defense-brief/route.ts      # Streaming personalized training
│   │   ├── domain-info/route.ts        # RDAP + MX lookup
│   │   └── verdict-card/route.tsx      # PNG verdict card (edge / next/og)
│   ├── bookmarklet/page.tsx            # Drag-to-bookmarks page
│   ├── opengraph-image.tsx             # Branded OG image (edge)
│   ├── icon.svg, not-found.tsx
│   ├── layout.tsx, page.tsx            # 7-mode shell, share-hash decode, prefill
│   └── globals.css                     # Tailwind + design tokens
├── components/
│   ├── EmailInput.tsx                  # Paste box, .eml upload, live chips
│   ├── ResultView.tsx                  # Verdict + agreement + gauge + red flags + chat
│   ├── HtmlPreview.tsx                 # Sandboxed iframe render of the email body
│   ├── HeaderForensics.tsx             # Received-chain timeline
│   ├── FollowUpChat.tsx                # Streaming Gemini chat grounded in the analysis
│   ├── DefenseBrief.tsx                # Streaming personalized training panel
│   ├── UrlInspector.tsx                # URL mode — input + verdict + domain card
│   ├── CompareMode.tsx                 # Two-slot side-by-side + diff panel
│   ├── InboxSimulator.tsx              # Gmail-like triage game
│   ├── TrainMode.tsx                   # Three-button quiz
│   ├── Anatomy.tsx                     # Step-driven phishing walkthrough
│   ├── Insights.tsx                    # Charts over localStorage history
│   ├── Sidebar.tsx, Topbar.tsx         # PRO chrome (left rail + sticky topbar)
│   ├── CommandPalette.tsx              # ⌘K palette
│   ├── ShortcutsPanel.tsx              # ? shortcuts modal
│   ├── Toast.tsx                       # Toast notification provider
│   ├── HistoryPanel.tsx                # Slide-out history drawer
│   ├── ShareButton.tsx                 # Dropdown: link / PNG / open card
│   ├── AnnotatedSource.tsx, RedFlagCard.tsx, RiskGauge.tsx,
│   │ VerdictBadge.tsx, Logo.tsx
└── lib/
    ├── heuristics/                     # Email-side deterministic checks
    │   ├── parseEmail.ts               # MIME → ParsedEmail + Received chain
    │   ├── headers.ts                  # SPF/DKIM/DMARC + Reply-To + chain forensics
    │   ├── sender.ts                   # 30+ brand impersonation lookup
    │   ├── links.ts                    # Mismatch, IP URLs, shorteners
    │   ├── content.ts                  # Urgency, threats, credential requests
    │   └── index.ts                    # Orchestrator + scoring
    ├── url-inspector.ts                # Structural checks for single URLs
    ├── live-heuristics.ts              # Client-side regex-only chips
    ├── html-preview.ts                 # HTML sanitizer for the sandbox iframe
    ├── agreement.ts                    # Heuristic ↔ LLM agreement band
    ├── domain-info.ts                  # RDAP client
    ├── dns.ts                          # DoH client (Cloudflare 1.1.1.1)
    ├── gemini.ts                       # Four Gemini clients: analyze, URL, chat, brief
    ├── share.ts                        # URL-hash encode/decode for shared verdicts
    ├── report.ts                       # Markdown report builder
    ├── useHistory.ts                   # localStorage hook for session history
    ├── examples.ts                     # Curated demo emails
    └── types.ts
```

## What's *not* in this MVP (by design)

- No accounts, no server-side persistence — every artifact (history, shared verdict) lives in the user's browser or in the URL.
- No outbound link fetching — Sentra never opens, resolves DNS for, or screenshots the URLs *in the email body*. (The URL Inspector mode does DNS lookups on the host the user explicitly pastes, never on links from other emails.)
- No file upload beyond `.eml` text — no binary parsing on the server.

## Limitations

- Verdicts are probabilistic. A `SAFE` rating is not a guarantee — when in doubt, log into the service directly through a fresh browser tab.
- Heuristics only see what's in the email you paste. If headers were stripped before forwarding, half the analysis is gone — use Gmail's *Show original* or the bookmarklet on it.
- The Gemini free tier is rate-limited (15 RPM). Plenty for a demo, not enough for a fleet — and the chat and defense-brief endpoints stream, so each conversation counts as multiple billing units on paid tiers.
- Shared-verdict URLs base64-encode the email and analysis into the hash, so they grow with the size of the message. They're meant for individual demo links, not bulk sharing.
- RDAP coverage varies by TLD. Most gTLDs work; some ccTLDs (`.pl`, `.de`) don't expose registration dates publicly — domain age is then displayed as "not disclosed by registry".

---

Built solo by [Mateusz](mailto:lagockimateusz6@gmail.com) for the [Hack the Tech 2026](https://hack-the-tech.devpost.com/) hackathon.
