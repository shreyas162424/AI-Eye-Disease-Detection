// gemini-proxy.js (simplified & stable)
// For use with: https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent

import express from "express";
const router = express.Router();

/**
 * Build a simple GenerateContent payload from chat messages:
 * messages: [{ role: "user" | "assistant" | "system", content: string }]
 */
function buildGenerateContentPayload(messages) {
  // Combine the whole chat into a single prompt with role tags
  const combined = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  // Gemini v1 generateContent format
  return {
    contents: [
      {
        role: "user",
        parts: [{ text: combined }],
      },
    ],
  };
}

router.post("/chat", async (req, res) => {
  try {
    const body = req.body || {};
    const messages = Array.isArray(body.messages) ? body.messages : null;

    if (!messages) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Expected { messages: [{role, content}, ...] }",
        receivedBody: body || null,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Missing GEMINI_API_KEY",
      });
    }

    const GEMINI_URL =
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

    const payload = buildGenerateContentPayload(messages);

    console.log("== Calling Gemini ==");
    console.log("URL:", GEMINI_URL);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    const resp = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (_) {
      // not JSON (rare)
    }

    console.log("Gemini status:", resp.status);
    console.log("Gemini raw response:", text);

    // If Gemini itself errors (4xx/5xx), forward that to frontend
    if (!resp.ok) {
      return res.status(resp.status).send(parsed ?? text);
    }

    // If your frontend expects the **raw Gemini JSON**, just return parsed:
    return res.status(200).send(parsed ?? text);
  } catch (err) {
    console.error("gemini-proxy error:", err);
    return res.status(500).json({
      error: "proxy error",
      details: String(err),
    });
  }
});

export default router;
