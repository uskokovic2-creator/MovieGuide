import OpenAI from "openai";

const filmContext = `Film: Good Bye, Lenin! (2003), directed by Wolfgang Becker.
A young man, Alex, tries to protect his mother after the fall of the Berlin Wall by maintaining the illusion that East Germany still exists. The film explores family, memory, the German Democratic Republic (GDR/DDR), reunification, identity, and social change.
Discuss the film and its historical/cultural context. Do not invent scenes or quotations. If unsure about a detail, say so.`;

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  const requestBody = await request.text();
  if (!requestBody || requestBody.length > 20000) {
    return Response.json({ error: "Message is too long or missing." }, { status: 413 });
  }

  let body;
  try {
    body = JSON.parse(requestBody);
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const level = ["A2", "B1", "B2"].includes(body.level) ? body.level : "B1";
  const language = body.explanationLanguage === "English" ? "English" : "German";
  const messages = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
  if (!messages.length || messages.some(m => !m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string")) {
    return Response.json({ error: "Please send a valid chat message." }, { status: 400 });
  }

  const instructions = `You are KinoFreund, a supportive German-language discussion partner for students studying German.
${filmContext}
Student proficiency: ${level}. Write in German at this level: A2 uses short, simple sentences; B1 uses clear connected language; B2 uses nuanced language.
Respond primarily in German. Give concise, encouraging corrections when the student makes a meaningful German error: quote a short corrected version and explain one point. Do not correct every tiny typo. Ask one natural follow-up question to keep the discussion going. If the student asks for an explanation, provide brief help in ${language}. Be respectful and age-appropriate. Never pretend the student has watched a scene they have not mentioned.`;

  try {
    const openai = new OpenAI();
    const result = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions,
      input: messages.map(({ role, content }) => ({ role, content }))
    }, { maxRetries: 0 });
    const answer = result.output_text?.trim();
    if (!answer) {
      return Response.json({ error: "The AI returned an empty response. Please try again." }, { status: 502 });
    }
    return Response.json({ answer });
  } catch (error) {
    if (error instanceof OpenAI.APIError && typeof error.status === "number") {
      console.error("OpenAI API error:", error.status);
      return Response.json({ error: "The AI service could not answer. Please try again." }, { status: 502 });
    }
    console.error("Could not reach the AI service.");
    return Response.json({ error: "Could not reach the AI service. Please try again." }, { status: 500 });
  }
};
