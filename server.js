const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const filmContext = `Film: Good Bye, Lenin! (2003), directed by Wolfgang Becker.
A young man, Alex, tries to protect his mother after the fall of the Berlin Wall by maintaining the illusion that East Germany still exists. The film explores family, memory, the German Democratic Republic (GDR/DDR), reunification, identity, and social change.
Discuss the film and its historical/cultural context. Do not invent scenes or quotations. If unsure about a detail, say so.`;

function send(res, status, data, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "X-Content-Type-Options": "nosniff" });
  res.end(type.startsWith("application/json") ? JSON.stringify(data) : data);
}

function serveStatic(req, res) {
  const requested = req.url === "/" ? "/index.html" : decodeURIComponent(req.url.split("?")[0]);
  const filePath = path.resolve(PUBLIC_DIR, "." + requested);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== path.join(PUBLIC_DIR, "index.html")) {
    return send(res, 403, "Forbidden", "text/plain; charset=utf-8");
  }
  fs.readFile(filePath, (err, content) => {
    if (err) return send(res, 404, "Not found", "text/plain; charset=utf-8");
    const ext = path.extname(filePath);
    const types = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".svg":"image/svg+xml" };
    send(res, 200, content, types[ext] || "application/octet-stream");
  });
}

async function handleChat(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    return send(res, 503, { error: "The app needs an OPENAI_API_KEY environment variable. Add your key in the hosting platform's Secrets/Environment settings." });
  }
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 20000) return send(res, 413, { error: "Message is too long." });
  }

  let body;
  try { body = JSON.parse(raw); } catch { return send(res, 400, { error: "Invalid request." }); }
  const level = ["A2", "B1", "B2"].includes(body.level) ? body.level : "B1";
  const language = body.explanationLanguage === "English" ? "English" : "German";
  const messages = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
  if (!messages.length || messages.some(m => !["user", "assistant"].includes(m.role) || typeof m.content !== "string")) {
    return send(res, 400, { error: "Please send a valid chat message." });
  }

  const instructions = `You are KinoFreund, a supportive German-language discussion partner for students studying German.
${filmContext}
Student proficiency: ${level}. Write in German at this level: A2 uses short, simple sentences; B1 uses clear connected language; B2 uses nuanced language.
Respond primarily in German. Give concise, encouraging corrections when the student makes a meaningful German error: quote a short corrected version and explain one point. Do not correct every tiny typo. Ask one natural follow-up question to keep the discussion going. If the student asks for an explanation, provide brief help in ${language}. Be respectful and age-appropriate. Never pretend the student has watched a scene they have not mentioned.`;

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        instructions,
        input: messages.map(m => ({ role: m.role, content: m.content }))
      })
    });
    const result = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error("OpenAI API error:", result.error?.message || apiResponse.status);
      return send(res, 502, { error: "The AI service could not answer. Check the API key and model settings, then try again." });
    }
    const answer = result.output_text || (result.output || []).flatMap(item => item.content || []).map(item => item.text || "").join("\n").trim();
    if (!answer) return send(res, 502, { error: "The AI returned an empty response. Please try again." });
    return send(res, 200, { answer });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: "Could not reach the AI service. Please try again." });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/chat") return handleChat(req, res);
  if (req.method === "GET") return serveStatic(req, res);
  send(res, 405, { error: "Method not allowed." });
});

server.listen(PORT, () => console.log(`MovieGuide running on port ${PORT}`));
