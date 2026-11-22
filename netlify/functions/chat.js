const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const filmContext = `Film: Good Bye, Lenin! (2003), directed by Wolfgang Becker.
A young man, Alex, tries to protect his mother after the fall of the Berlin Wall by maintaining the illusion that East Germany still exists. The film explores family, memory, the German Democratic Republic (GDR/DDR), reunification, identity, and social change.
Discuss the film and its historical/cultural context. Do not invent scenes or quotations. If unsure about a detail, say so.`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { statusCode: 503, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "The app needs an OPENAI_API_KEY environment variable. Add your key in Netlify's environment variable settings." }) };
  }

  if (!event.body || event.body.length > 20000) {
    return { statusCode: 413, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Message is too long or missing." }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Invalid request." }) };
  }

  const level = ["A2", "B1", "B2"].includes(body.level) ? body.level : "B1";
  const language = body.explanationLanguage === "English" ? "English" : "German";
  const messages = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
  if (!messages.length || messages.some(m => !m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string")) {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Please send a valid chat message." }) };
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
      return { statusCode: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "The AI service could not answer. Check the API key and model settings, then try again." }) };
    }
    const answer = result.output_text || (result.output || []).flatMap(item => item.content || []).map(item => item.text || "").join("\n").trim();
    if (!answer) {
      return { statusCode: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "The AI returned an empty response. Please try again." }) };
    }
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Could not reach the AI service. Please try again." }) };
  }
};
