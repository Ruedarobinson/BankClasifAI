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
Planes: Prueba Gratuita 7 dias,no requiere tarjeta, 10,000 tokens. 

Plan cuentas personales $19.mensual. 
incluye:
100,000/ mes tokens 100 MB memoria
limite 3 cuentas bancarias
Categorización automática - editable
Exportar en formato Excel
Reportes en PDF imprimibles

plan personal+negoicos $39.mensual.
incluye:
250,000/ mes tokens 200 MB memoria
Clientes ilimitados
Carpetas por cliente
Categorización automática - editable
Exportar en formato excel
Reportes en PDF por cliente 

plan Contadores $69.mensual 
incluye:
1,000,000/ mes tokens 400 MB memoria
Clientes ilimitados
Carpetas por cliente
Categorización automática - editable
Exportar en formato excel
Reportes en PDF por cliente


Privacidad: BankClasifAI
1. Recopilación Mínima: Solo se solicita correo electrónico para la cuenta y datos técnicos (cookies/IP) para el funcionamiento. Nunca se piden contraseñas bancarias. 2. Manejo de Archivos: Se extraen fechas, montos y descripciones de PDFs/imágenes. La IA solo procesa lo estrictamente necesario para clasificar (minimización de datos). 3. Infraestructura y Seguridad: Datos alojados en Google Cloud con cifrado en tránsito, auditorías periódicas y enfoque security-first. 4. No Comercialización: Los datos personales no se venden. Solo se comparten con proveedores esenciales (infraestructura, email) bajo confidencialidad. 5. Derechos del Usuario: El usuario puede solicitar acceso, rectificación o eliminación total de sus datos escribiendo a info@bankclasifai.com. 6. Retención: Los archivos se guardan solo el tiempo necesario para el servicio o hasta que el usuario pida borrarlos. 7. Cumplimiento: Alineado con principios de GDPR, CCPA y LGPD.
 Pasarela de pagos  Stripe y us politicas , no almacenamos datos de tarjeta.
 Cookies: usamos cookies para almacenar la preferencia del idioma. y las politicas de cookiesbot y cookieconsent.
 Google tag manager: usamos google tag manager para medir el tráfico del sitio.

Resumen de T&C: BankClasifAI
1. Propósito: Herramienta de extracción (PDF/Imagen) y clasificación de extractos bancarios mediante IA. No es asesoría contable ni legal. 2. Responsabilidad del Usuario: * Es obligatorio revisar y validar los resultados. La IA puede errar por formatos ambiguos.

El usuario debe tener autorización legal sobre los archivos que sube. 3. Restricciones: Prohibido el uso para fraude, scraping, reventa sin permiso o vulneración de seguridad. 4. Privacidad: Los datos se procesan en Google Cloud. Nunca se solicitan contraseñas bancarias. 5. Propiedad: El usuario es dueño de sus datos; BankClasifAI es dueño de la plataforma y el software. 6. Limitación de Responsabilidad: El servicio se ofrece "tal cual". BankClasifAI no responde por decisiones fiscales o financieras tomadas sin revisión humana previa. 7. Suspensión: El mal uso o intentos de hackeo resultarán en la terminación inmediata de la cuenta.

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



