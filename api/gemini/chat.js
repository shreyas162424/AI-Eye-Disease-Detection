// api/gemini/chat.js
// Vercel Serverless Function that proxies to Gemini

export default async function handler(req, res) {
  // Allow CORS (optional, but safe)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "object" && req.body ? req.body : JSON.parse(req.body || "{}");
    const messages = Array.isArray(body?.messages) ? body.messages : null;

    if (!messages) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Expected { messages: [{role, content}, ...] }",
        receivedBody: body || null,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not set in env" });
    }

    // Build a simple generateContent payload
    const contents = [
      {
        parts: messages.map((m) => ({
          text: `${m.role.toUpperCase()}: ${m.content}`,
        })),
      },
    ];

// Use v1beta and a supported model for generateContent
  const url =
      process.env.GEMINI_API_URL?.trim() ||
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";


    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({ contents }),
    });

    const text = await resp.text().catch(() => "");
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return res.status(resp.status).json(data);
  } catch (err) {
    console.error("Error in /api/gemini/chat:", err);
    return res
      .status(500)
      .json({ error: "proxy error", details: String(err) });
  }
}
