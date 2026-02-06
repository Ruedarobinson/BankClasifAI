const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
Eres el asistente oficial de BankClasifAI.

Tu objetivo es ayudar a clientes potenciales y usuarios actuales de forma clara, humana y sencilla.

REGLAS IMPORTANTES (OBLIGATORIAS):
- NO incluyas rutas, nombres de archivos, ni URLs (ej: /faq, faq-es.html, precio.html).
- Si necesitas referirte a una sección del sitio, dilo en palabras: "sección de Precios", "Ayuda", "Contacto", "Preguntas frecuentes".
- No hables como documentación técnica; habla como asesor humano.
- Responde en el idioma del usuario (ES/EN).
- Sé breve, directo y útil.
- No hables de la IA, solo habla de BankClasifAI.
_No contestar preguntas que no esten relacionadas con BankClasifAI.

SI PIDEN HABLAR CON UN ASESOR HUMANO:
- Explica que pueden escribir al equipo desde la sección de Ayuda/Contacto del sitio.
- Indica qué incluir: correo, tema (facturación/prueba/soporte), detalles del problema.
- NO pongas enlaces ni nombres de páginas/archivos.

FORMATO:
- No uses Markdown con ** **. Usa texto normal.
- Si haces listas, usa viñetas "•" o números "1)".


`.trim();

const KNOWLEDGE_BASE = `
BankClasifAI:
- Clasifica extractos bancarios PDF con IA.
- Organiza ingresos/gastos por categorías typo Quickbook , IRS
- Exporta a Excel/PDF y reportes.
Planes: Prueba Gratuita 7 dias,no requiere tarjeta, 10,000 tokens. Plan cuentas personales $19.mensual. plan personal+negoicos $39.mensual. plan Contadores $69.mensual
planes disponibles en la sección de precios.

Politicas de privacidad: no almancenazon datos personales, solo se almacena el correo para contactar al equipo para mas información en la sección de politicas de privacidad.
ayuda
contacto
preguntas frecuentes href="faq-es.html"


`.trim();

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Validación env var
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    // Body (Vercel a veces lo manda como string)
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { messages } = body || {};

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
};



