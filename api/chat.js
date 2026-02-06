import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `
Eres el asistente oficial de BankClasifAI.
Responde siempre en el idioma del usuario (ES/EN).
Sé breve y claro. No pidas datos sensibles.
`.trim();

const KNOWLEDGE_BASE = `
BankClasifAI:
- Clasifica extractos bancarios (PDF/imagen) con IA.
- Organiza ingresos/gastos por categorías.
- Exporta a Excel/CSV y reportes.
Links:
- Precios: /precio.html
- FAQ: /faq-es.html
`.trim();

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const input = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\nContexto:\n${KNOWLEDGE_BASE}` },
      ...messages,
    ];

    const response = await client.responses.create({
      model: "gpt-5.2",
      input,
    });

    return res.status(200).json({ reply: response.output_text });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
