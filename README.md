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

## Deploy

This is a small Node HTTP server and can run on Replit or another Node host. Add `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) in the host's Secrets/Environment settings. Do not put the API key in the browser code or commit it to Git.

## Scope

This is intentionally the first MVP only. It does not yet include subtitle uploads, annotations, teacher dashboards, student accounts, or saved progress. The chat is kept in browser memory for the current session and is not stored by this app.

AI-generated explanations can be inaccurate; students should verify historical details with course materials.
