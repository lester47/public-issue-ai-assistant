# Deploy

This project should be deployed as a server-rendered Next.js app.
Use Vercel for the simplest shareable link.

## Recommended: Vercel

1. Push this project to GitHub.
2. Open Vercel and choose **New Project**.
3. Import the GitHub repository.
4. Keep the defaults:
   - Framework Preset: Next.js
   - Install Command: `pnpm install`
   - Build Command: `pnpm build`
   - Output Directory: `.next`
5. Deploy.

No LLM API key is required for the current MVP. The app uses Google News RSS
for keyless search and a rule-based argument builder.

Optional environment variables:

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.1
TAVILY_API_KEY=
DISABLE_KEYLESS_SEARCH=false
```

## Share With Family

After deployment, send the Vercel URL to the user.

Example:

```text
https://public-issue-ai-assistant.vercel.app
```

They can open the link on a phone and use:

- text input
- Chrome/Edge voice input
- mobile keyboard microphone input

## Why Not GitHub Pages

GitHub Pages only serves static files. This project needs `/api/analyze`, which
runs server-side search and analysis. Use Vercel, Railway, Render, or another
Node/Next.js host.
