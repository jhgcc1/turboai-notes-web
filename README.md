# Turbo Notes Web

Next.js frontend for the Turbo AI notes-taking hiring challenge.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Thin API client only — **no business/authorization logic**
- Vitest + Testing Library (100% coverage on `src/lib`)

## AI tools used

Built end-to-end in **Cursor**. The primary interactive planning/coordination session ran on **Grok 4.5 High Fast** (the model set at kickoff), which turned the hiring-challenge brief into the locked plan in `docs/process/00-MASTER-PLAN.md` and did the initial UI scaffolding. Most of the implementation and polish — component/page build-out, unit test coverage, Figma/video adherence checks, e2e verification (Chrome MCP + curl + DB cross-checks), UI fixes, and this documentation — was delegated to dozens of asynchronous Cursor "Multitask Mode" subagents, which inherited the session's configured model (a mix of Grok 4.5 High Fast and Claude Sonnet 5 across this multi-day session). See [`docs/process/13-ai-development-process.md`](../docs/process/13-ai-development-process.md) for the full writeup, including the verbatim original prompt and a clearly-labeled, methodology-based token/cost estimate.

## Demo video

~5 minute walkthrough (English): [turbo-notes-demo.mp4](https://d1qdib1mcwro0s.cloudfront.net/demo/turbo-notes-demo.mp4)

Hosted on staging S3/CloudFront (`turboai-notes-staging-web-615737882760`); opens directly in the browser with no login.

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000 — API must be at `NEXT_PUBLIC_API_URL` (local: `http://localhost:8000`).

Staging/prod builds set `NEXT_PUBLIC_API_URL` to the **web** CloudFront URL so the SPA calls same-origin `/api/*` (web CF → ALB). That makes auth cookies first-party and works in Incognito. Do not point the build at the separate API CloudFront hostname.

Full stack: from `../backend` run `docker compose up --build`.

## Quality

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
```
