import OpenAI from "openai";

// Inicializa el cliente con la API Key desde Vercel
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * PROMPT MAESTRO (aquí defines cómo se comporta tu bot)
 */
const SYSTEM_PROMPT = `
Eres el asistente oficial de BankClasifAI.

Objetivo:
- Ayudar a visitantes a entender el producto
- Resolver dudas frecuentes
- Guiarlos a iniciar la prueba gratuita

Reglas IMPORTANTES:
- Responde SIEMPRE en el mismo idioma del usuario (español o inglés).
- Sé claro, breve y profesional.
- Usa listas cuando ayude a entender mejor.
- Si preguntan por precios, explica brevemente y dirige a /precio.html.
- Si preguntan por PDF o Excel, explica que se clasifican extractos bancarios automáticamente.
- Si no sabes algo, dilo con honestidad y ofrece ayuda alternativa.
- NO pidas datos sensibles (números de cuenta, SSN, tarjetas, etc).

Tono:
Fintech, confiable, cercano, orientado a negocio.
`.trim();

/**
 * CONOCIMIENTO DEL PRODUCTO (FAQ resumido)
 * 👉 aquí “pones las respuestas”
 */
const KNOWLEDGE_BASE = `
¿Qué es BankClasifAI?
- Plataforma con IA para clasificar extractos bancarios.
- Soporta PDF e imágenes.
- Organiza ingresos y gastos por categoría.
- Exporta a Excel/CSV y reportes listos para contabilidad.

¿Para quién es?
- Personas con cuentas personales
- Negocios
- Firmas contables

Funciones clave:
- Clasificación automática con IA
- Edición de categorías
- Exportación a Excel
- Soporte multi-banco

Páginas importantes:
- Precios: /precio.html
- Preguntas frecuentes: /faq-es.html
`.trim();

/**
 * ENDPOINT POST /api/chat
 */
export async function POST(request) {
  try {
    // 1. Leer mensajes del frontend
    const { messages } = await request.json();

    if (!Array.isArray(messages)) {
      return Response.json(
        { error: "messages must be an array" },
        { status: 400 }
      );
    }

    // 2. Construir input para OpenAI
    const input = [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\nContexto:\n${KNOWLEDGE_BASE}`,
      },
      ...messages,
    ];

    // 3. Llamar a OpenAI
    const response = await client.responses.create({
      model: "gpt-5.2",
      input,
    });

    // 4. Devolver respuesta al frontend
    return Response.json({
      reply: response.output_text,
    });
  } catch (error) {
    console.error("[API CHAT ERROR]", error);

    return Response.json(
      { error: "Error conectando con OpenAI" },
      { status: 500 }
    );
  }
}
