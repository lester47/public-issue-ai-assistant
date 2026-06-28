# AI 公共議題助手

Mobile First MVP for understanding recent public issues with search-backed answers.

## MVP Scope

- PWA-ready Next.js app
- Text input and browser speech input
- Keyless Google News RSS search
- Search, planning, ranking, timeline, fact, position, and argument services
- Structured TypeScript API responses
- Centralized prompts outside React components
- Every answer preserves source references

## Run

```bash
pnpm install
pnpm dev
```

Open:

```text
http://localhost:3000/
```

No LLM API key is required for the current MVP.

## Deploy

Use Vercel so the `/api/analyze` route can run server-side.

See [DEPLOY.md](./DEPLOY.md).
