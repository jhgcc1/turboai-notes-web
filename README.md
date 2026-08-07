# Turbo Notes Web

Next.js frontend for the Turbo AI notes-taking hiring challenge.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Thin API client only — **no business/authorization logic**
- Vitest + Testing Library (100% coverage on `src/lib`)

## AI tools used

Built with **Cursor Grok 4.5 High Fast**.

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000 — API must be at `NEXT_PUBLIC_API_URL`.

Full stack: from `../backend` run `docker compose up --build`.

## Quality

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
```
