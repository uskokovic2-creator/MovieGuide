# MovieGuide — German Film Conversation MVP

A minimal AI-powered German discussion partner built around **Good Bye, Lenin!**. Students can chat in German, choose A2/B1/B2 proficiency, and request explanations in German or English.

## Features

- One-film starting library: *Good Bye, Lenin!* (2003)
- German discussion partner with level-adjusted language
- Encouraging corrections and follow-up questions
- Short cultural and historical explanations
- OpenAI API key stays on the server
- No student accounts or chat history storage

## Run locally

Requires Node.js 18+ and an OpenAI API key.

```bash
npm start
```

Set the environment variable before starting the server:

- macOS/Linux: `OPENAI_API_KEY=your_key_here npm start`
- PowerShell: `$env:OPENAI_API_KEY="your_key_here"; npm start`

Open http://localhost:3000.

Optional: set `OPENAI_MODEL` to use a different model. The default is `gpt-4.1-mini`.

## Deploy to Netlify

The repository includes a Netlify configuration and a serverless function for the AI chat endpoint.

1. Sign in to [Netlify](https://app.netlify.com/) and choose **Add new project → Import an existing project**.
2. Connect GitHub and select `uskokovic2-creator/MovieGuide`.
3. Netlify should detect the settings in `netlify.toml`. The publish directory is `public`; the functions directory is `netlify/functions`. No build command is needed.
4. Before testing the chat, open **Site configuration → Environment variables** in Netlify and add `OPENAI_API_KEY` with your OpenAI API key. Optionally add `OPENAI_MODEL`; the default is `gpt-4.1-mini`.
5. Trigger a deploy (or let the first deploy finish), then open the Netlify site URL.

The `/api/chat` route is redirected to the Netlify Function, which calls OpenAI server-side. Never put the API key in browser code, share it in chat, or commit it to Git.

The original `server.js` remains available for local development with `npm start`.

## Scope

This is intentionally the first MVP only. It does not yet include subtitle uploads, annotations, teacher dashboards, student accounts, or saved progress. The chat is kept in browser memory for the current session and is not stored by this app.

AI-generated explanations can be inaccurate; students should verify historical details with course materials.
