# CLAUDE.md — Gruvle Verify

Engineering reference for anyone (human or Claude) working in this repo. Read this before writing code. See [current_status.md](current_status.md) for what's actually built right now.

## What this is

Gruvle Verify is an evidence-first verification engine, not a chatbot or a generic fact-checker. Users submit a URL, claim, screenshot, PDF, or listing; the system decomposes it into discrete claims, researches each one across multiple sources, scores source quality, detects contradictions, and produces a verdict with a full evidence chain — never a bare "AI says this is true."

Pipeline: `INPUT → UNDERSTAND → DECOMPOSE CLAIMS → RESEARCH → COLLECT EVIDENCE → CROSS-CHECK → DETECT CONTRADICTIONS → SCORE SOURCE QUALITY → REASON → CALCULATE CONFIDENCE → VERDICT → EVIDENCE DISPLAY`

## Non-negotiable constraints

These override convenience every time:

1. **No paid API required for MVP.** Every external provider (search, LLM, vision, OCR) sits behind an interface with a free/open-source/local implementation as the default path.
2. **No hardcoded keys, ever.** All provider credentials come from environment variables, validated at startup, absent gracefully (see degraded mode).
3. **Degraded mode is a first-class state**, not an error. If a provider is unconfigured or fails, the app still returns a usable (labeled, lower-confidence) result rather than a 500.
4. **The verdict is never "the LLM said so."** Verdicts come from a deterministic scoring layer (source quality × independence × agreement × recency × contradiction count) that *consumes* LLM output as one input, never as the whole answer.
5. **Every factual sentence in a report traces to an evidence ID.** No evidence → the report says "insufficient evidence," never a plausible-sounding fabrication.
6. **Never fabricate sources, excerpts, URLs, stats, or quotes.** Excerpts shown in evidence cards must be substrings actually extracted from the source, not paraphrased-then-quoted.
7. **Subjective claims are never scored as objectively true/false** — classify and label them ("subjective marketing claim") instead of verifying them.
8. **Contradictions are surfaced, never hidden or silently resolved** in favor of the majority source.

## Tech stack

Chosen to make the free-tier promise actually true, not aspirational.

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | Free hosting on Vercel, fast iteration, accessible primitives out of the box |
| Backend / verification engine | Python + FastAPI | Best ecosystem for PDF/OCR/vision libs (PyMuPDF, pdfplumber, pytesseract) that the pipeline depends on |
| Database + Auth | Supabase (Postgres) | Free tier covers auth, row-level security, and relational storage for claims/evidence graphs in one service |
| Search provider | Self-hosted SearXNG (primary), direct page fetch (fallback) | No paid search API required; abstracted so Brave/Serper/Tavily/Google can be added later without touching call sites |
| LLM | Gemini (primary, generous free tier) via `AIProvider` interface | Swappable; Groq/OpenRouter/local (Ollama) as fallback implementations |
| Vision | Gemini vision (primary) via `VisionProvider` interface | Local vision model fallback when unconfigured |
| OCR | Tesseract (`pytesseract`) | Open-source, no API key |
| Document parsing | PyMuPDF, pdfplumber, python-docx | Open-source |
| Background jobs | FastAPI `BackgroundTasks` for MVP → Celery+Redis when volume demands it | Avoid infra a startup doesn't need yet |
| Frontend hosting | Vercel free tier | |
| Backend hosting | Render / Fly.io free tier | |

Revisit this table before adding a new dependency — if it requires a paid tier, it needs a free/local fallback path or it doesn't belong in the MVP.

## Repo layout (target)

```
/frontend                 Next.js app
  /app                     routes: /, /dashboard, /verify, /history, /saved, /watchlist, /reports, /settings
  /components
  /lib
/backend
  /app
    /api                   FastAPI routers
    /pipeline              claim extraction, research, evidence, contradiction, verdict, confidence
    /providers
      /ai                  AIProvider + GeminiProvider, GroqProvider, OpenRouterProvider, LocalProvider
      /vision              VisionProvider + Gemini/local impls
      /search              WebSearchProvider + SearXNGProvider, DirectFetchProvider
      /ocr                 OCRProvider (Tesseract)
      /documents           PDF/DOCX extraction
    /models                DB models: users, verifications, claims, evidence, sources
    /scoring                source_quality, contradiction detection, verdict engine (deterministic, testable, no LLM calls inside)
  /tests
/docs
CLAUDE.md
current_status.md
```

## Provider interfaces (contracts, not implementation detail)

Keep these interfaces stable; add implementations, don't widen the interface per-provider.

```python
class AIProvider(Protocol):
    def generate(self, prompt: str) -> str: ...
    def generate_structured(self, prompt: str, schema: type) -> BaseModel: ...
    def classify(self, text: str, labels: list[str]) -> str: ...
    def extract_claims(self, text: str) -> list[Claim]: ...
    def reason(self, claim: Claim, evidence: list[Evidence]) -> ReasonedAnalysis: ...
    def summarize(self, text: str) -> str: ...

class VisionProvider(Protocol):
    def analyze_image(self, image: bytes, prompt: str) -> ImageAnalysis: ...

class WebSearchProvider(Protocol):
    def search(self, query: str) -> list[SearchResult]: ...
    def get_page(self, url: str) -> str: ...
    def extract_content(self, url: str) -> ExtractedContent: ...
```

A **model router** picks implementation by task, not by hardcoding a provider name at call sites: cheap/local for classification and dedup, vision model for images, strongest configured model for final synthesis/contradiction analysis. If the preferred provider errors or is unconfigured, the router falls back down the chain and the report notes which tier actually answered.

## Data model (core entities)

`User → Verification → Claim → Evidence → Source`, plus `Verdict` and `ConfidenceBreakdown` attached to a `Verification`. Every `Evidence` row has a stable `EVIDENCE-###` ID; every sentence in a generated report that asserts a fact must cite one. `Source` carries `source_quality_score` (0–100) with the factors that produced it stored alongside (primary/secondary, official/unofficial, date, independence, corroboration) so scores are explainable, not a black box.

Verdicts: `VERIFIED | LIKELY_TRUE | PARTIALLY_SUPPORTED | MISLEADING | CONTRADICTED | UNVERIFIED | INSUFFICIENT_EVIDENCE | HIGH_RISK`
Claim statuses: `SUPPORTED | PARTIALLY_SUPPORTED | CONTRADICTED | UNVERIFIED | INSUFFICIENT_EVIDENCE | MISLEADING | TIME_SENSITIVE`

## Design system

Premium, calm, evidence-forward — closer to a research/security tool than consumer AI. No gradients-for-decoration, no robot mascots, no marketing superlatives ("revolutionary," "AI-powered" as a headline). Headline copy is fixed by product spec: **"Know what you can trust."** Every report must include a "What's still uncertain?" section — this is a trust differentiator, not optional polish.

## Coding conventions

- Scoring/verdict logic lives in pure, deterministic, unit-testable functions with zero network or LLM calls inside them — LLM output is an *input* to scoring, computed upstream and passed in.
- Every provider call is wrapped so a failure degrades the pipeline (skip that evidence source, lower confidence, label the gap) rather than failing the whole verification.
- No comments explaining what code does; comments only for non-obvious constraints (e.g., why an excerpt must be a verbatim substring check).
