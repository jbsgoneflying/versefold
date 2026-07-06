# Versefold Technical Architecture

Repo layout (this repository):

```
app/, components/        Next.js landing page (deployed, unchanged)
backend/                 Node/TypeScript Fastify API (scripture proxy + LLM gateway)
ios/                     Native SwiftUI app (XcodeGen project)
docs/product/            Phase 0 definition artifacts
backend/eval/            LLM evaluation corpus + runner
```

## System boundaries

```
iOS app (SwiftUI)
  ├── bundled KJV (public domain) — instant, offline reading
  ├── local store (SQLite/GRDB): highlights, notes, bookmarks, studies, cards
  ├── CloudKit sync (opt-in, Phase 3)
  └── HTTPS → Versefold backend only (no third-party keys in app)

Versefold backend (Fastify, droplet behind nginx)
  ├── /v1/translations           rights-filtered translation config for the app
  ├── /v1/scripture/*            API.Bible proxy + cache + rights enforcement
  ├── /v1/ai/*                   LLM gateway (explain, ask, study, card-assist)
  ├── /v1/artifacts              AI artifact storage (SQLite → Postgres at scale)
  ├── /v1/feedback               beta feedback intake
  ├── /metrics                   cost + usage metering
  └── middleware: rights gate, quota, device auth (App Attest slot), moderation
```

## Key decisions

| Area | Choice | Why |
|---|---|---|
| Scripture source | API.Bible (`https://rest.api.bible/v1`, `api-key` header) | rights-cleared, 3 copyright Bibles on Starter |
| Scripture cache | in-memory LRU + SQLite persistence (Redis adapter slot for scale) | 5k calls/month budget spent on cold misses only |
| LLM | OpenAI Responses API, Structured Outputs strict, behind `ModelGateway` interface | provider-agnostic, fallback-capable |
| Model tiers | nano (classify/route) / mini (explain, ask, card) / strong (study generation) | cost + latency |
| iOS persistence | SQLite via GRDB, local-first | offline, fast, user-owned |
| Reader rendering | native typography from API.Bible `json` content blocks; bundled PD text as JSON | quiet premium reader |
| Card rendering | deterministic SwiftUI → ImageRenderer export | model never renders cards |
| Sync | CloudKit (Phase 3) | free, Apple-hosted, private |
| Auth | anonymous device id now; Sign in with Apple at sync; App Attest on AI routes | reading needs no account |

## Request flow: passage explanation

```
select passage → POST /v1/ai/explain {bibleKey, passageId, lens}
  → rights gate (llmSend? PD text : reference only)
  → scripture retrieval (cache-first)
  → moderation (user free-text only)
  → prompt assembly (system prompt vN + passage + schema)
  → OpenAI Responses (structured, streamed)
  → citation validation (every ref checked against source; invalid dropped)
  → metering (tokens, cost, quota)
  → response blocks with content kinds → app renders, Scripture from source only
```

## Environment variables (backend/.env, never committed)

`API_BIBLE_KEY`, `OPENAI_API_KEY`, `PORT`, `DATABASE_PATH`, `MODEL_EXPLAIN`, `MODEL_STUDY`, `MODEL_CLASSIFY`.

## Deploy

Beta: same droplet, new nginx server block `api.versefold.app` → backend port; GitHub Actions job mirrors the
landing-page deploy. Scale path: containerize, managed Postgres + Redis, load balancer, CDN (documented in
`docs/product/launch/scale-runbook.md`).
