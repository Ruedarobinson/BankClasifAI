// /api/contact.js  (Vercel Serverless Function - Node 18)

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function parseForm(bodyText) {
  const params = new URLSearchParams(bodyText);
  return Object.fromEntries(params.entries());
}

module.exports = async (req, res) => {
  // CORS preflight (por si acaso)
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(200).send("OK");

  try {
    const raw = await readBody(req);
    const body = parseForm(raw);

    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const message = (body.message || "").trim();
    const lang = (body.lang || "es").toLowerCase();
    const isEN = lang === "en";

    if (!name || !email || !message) {
      return res.status(400).send(isEN ? "Missing required fields." : "Faltan campos requeridos.");
    }

    // 🔐 Turnstile token
    const token = (body["cf-turnstile-response"] || "").trim();
    if (!token) {
      return res.status(400).send(isEN ? "Missing anti-bot verification." : "Falta verificación anti-bot.");
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return res.status(500).send("TURNSTILE_SECRET_KEY no configurado.");

    const verifyBody = new URLSearchParams();
    verifyBody.append("secret", secret);
    verifyBody.append("response", token);

    const ip =
      req.headers["cf-connecting-ip"] ||
      (req.headers["x-forwarded-for"] || "").split(",")[0] ||
      req.socket?.remoteAddress;

    if (ip) verifyBody.append("remoteip", ip);

    const verifyResp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: verifyBody,
    });

    const verify = await verifyResp.json();
    if (!verify?.success) {
      return res.status(403).send(isEN ? "Anti-bot verification failed." : "Verificación anti-bot falló.");
    }

    // ✉️ Mailjet
    const MJ_PUBLIC = process.env.MJ_APIKEY_PUBLIC;
    const MJ_PRIVATE = process.env.MJ_APIKEY_PRIVATE;
    const FROM_EMAIL = process.env.MAILJET_FROM_EMAIL;
    const FROM_NAME = process.env.MAILJET_FROM_NAME || "BankClasifAI";
    const TO_EMAIL = process.env.MAILJET_TO_EMAIL;

    if (!MJ_PUBLIC || !MJ_PRIVATE) return res.status(500).send("Mailjet API keys no configuradas.");
    if (!FROM_EMAIL || !TO_EMAIL) return res.status(500).send("MAILJET_FROM_EMAIL o MAILJET_TO_EMAIL faltan.");

    const subject = isEN
      ? `New contact message from ${name}`
      : `Nuevo mensaje de contacto de ${name}`;

    const mjResp = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${MJ_PUBLIC}:${MJ_PRIVATE}`).toString("base64"),
      },
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: FROM_EMAIL, Name: FROM_NAME },
            To: [{ Email: TO_EMAIL, Name: "Info" }],
            ReplyTo: { Email: email, Name: name },
            Subject: subject,
            TextPart: `${name} <${email}>\n\n${message}`,
          },
        ],
      }),
    });

    const mj = await mjResp.json();

    // OJO: Mailjet puede responder 200 pero Status "error"
    const msg0 = mj?.Messages?.[0];
    if (!mjResp.ok || msg0?.Status !== "success") {
      console.error("Mailjet send failed:", { httpStatus: mjResp.status, mj });
      const mjErr = msg0?.Errors?.[0]?.ErrorMessage || "Mailjet failed.";
      return res.status(500).send(isEN ? `Mail delivery failed: ${mjErr}` : `Falló el envío: ${mjErr}`);
    }

    return res.status(200).send(isEN ? "Message sent successfully." : "Mensaje enviado correctamente.");
  } catch (e) {
    console.error("API contact error:", e);
    return res.status(500).send("Internal server error.");
  }
};
