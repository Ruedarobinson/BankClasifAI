module.exports = async (req, res) => {
  // 1. Manejo de CORS y Métodos
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    // En Vercel, req.body ya viene parseado si envías 'application/x-www-form-urlencoded'
    // No necesitas readBody() ni parseForm()
    const body = req.body;

    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const message = (body.message || "").trim();
    const lang = (body.lang || "en").toLowerCase();
    const isEN = lang === "en";

    // 2. Validación de variables de entorno (Aquí suele fallar)
    const {
      TURNSTILE_SECRET_KEY,
      MJ_APIKEY_PUBLIC,
      MJ_APIKEY_PRIVATE,
      MAILJET_FROM_EMAIL,
      MAILJET_TO_EMAIL
    } = process.env;

    if (!TURNSTILE_SECRET_KEY || !MJ_APIKEY_PUBLIC || !MJ_APIKEY_PRIVATE) {
      console.error("Faltan Variables de Entorno");
      return res.status(500).send("Server configuration error.");
    }

    // 3. Verificar Turnstile
    const token = body["cf-turnstile-response"];
    const verifyResp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${TURNSTILE_SECRET_KEY}&response=${token}`,
    });

    const verify = await verifyResp.json();
    if (!verify.success) {
      return res.status(403).send(isEN ? "Verification failed." : "Fallo la verificación.");
    }

    // 4. Enviar con Mailjet (usando fetch para no depender de librerías externas)
    const auth = Buffer.from(`${MJ_APIKEY_PUBLIC}:${MJ_APIKEY_PRIVATE}`).toString("base64");
    
    const mjResp = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Messages: [{
          From: { Email: MAILJET_FROM_EMAIL, Name: "BankClasifAI" },
          To: [{ Email: MAILJET_TO_EMAIL }],
          Subject: isEN ? `New Message from ${name}` : `Nuevo mensaje de ${name}`,
          TextPart: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`,
          ReplyTo: { Email: email, Name: name }
        }]
      })
    });

    if (mjResp.ok) {
      return res.status(200).send(isEN ? "Success!" : "¡Enviado!");
    } else {
      const errorData = await mjResp.text();
      console.error("Mailjet Error:", errorData);
      throw new Error("Mailjet delivery failed");
    }

  } catch (error) {
    console.error("Error final:", error);
    return res.status(500).send("Internal Error");
  }
};