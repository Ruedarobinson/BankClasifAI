import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
Eres el asistente oficial de BankClasifAI.

REGLAS OBLIGATORIAS:
- NO incluyas rutas, nombres de archivos, ni URLs (ej: /faq, faq-es.html, precio.html).
- Si necesitas referirte a una sección del sitio, dilo en palabras: "sección de Precios", "Ayuda", "Contacto", "Preguntas frecuentes".
- Habla como asesor humano, no como documentación técnica.
- Responde siempre en el idioma del último mensaje del usuario (ES o EN).
- Sé claro, directo y útil. Evita respuestas largas.
`.trim();

const KNOWLEDGE_BASE = `
BankClasifAI:
- Clasifica extractos bancarios (PDF/imagen) con IA.
- Organiza ingresos/gastos por categorías.
- Exporta a Excel/CSV y reportes.
Secciones del sitio:
- Precios y planes (incluye prueba gratis)
- Preguntas frecuentes / Ayuda
- Contacto / Soporte
`.trim();

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    // Mensajes finales enviados al modelo
    const finalMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `Contexto del producto:\n${KNOWLEDGE_BASE}` },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || ""),
      })),
    ].slice(-30); // limite de seguridad

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: finalMessages,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "…";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("API /api/chat error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
}


