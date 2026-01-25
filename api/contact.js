export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");

  try {
    const { name, email, message, lang } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).send(lang === "en" ? "Missing required fields." : "Faltan campos requeridos.");
    }

    // 🔐 Turnstile
    const token = req.body?.["cf-turnstile-response"];
    if (!token) {
      return res.status(400).send(lang === "en" ? "Missing anti-bot verification." : "Falta verificación anti-bot.");
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return res.status(500).send("TURNSTILE_SECRET_KEY no configurado.");

    const verifyBody = new URLSearchParams();
    verifyBody.append("secret", secret);
    verifyBody.append("response", token);

    const ip =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress;

    if (ip) verifyBody.append("remoteip", ip);

    const verifyResp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: verifyBody,
    });

    const verify = await verifyResp.json();
    if (!verify?.success) {
      return res.status(403).send(lang === "en" ? "Anti-bot verification failed." : "Verificación anti-bot falló.");
    }

    // ✉️ Mailjet
    const MJ_PUBLIC = process.env.MJ_APIKEY_PUBLIC;
    const MJ_PRIVATE = process.env.MJ_APIKEY_PRIVATE;
    const FROM_EMAIL = process.env.MAILJET_FROM_EMAIL;
    const FROM_NAME = process.env.MAILJET_FROM_NAME || "BankClasifAI";
    const TO_EMAIL = process.env.MAILJET_TO_EMAIL || "info@bankclasifai.com";

    if (!MJ_PUBLIC || !MJ_PRIVATE) return res.status(500).send("Mailjet API keys no configuradas.");
    if (!FROM_EMAIL) return res.status(500).send("MAILJET_FROM_EMAIL falta.");
    if (!TO_EMAIL) return res.status(500).send("MAILJET_TO_EMAIL falta.");

    const isEN = (lang || "").toLowerCase() === "en";
    const subject = isEN
      ? `New contact message (${name})`
      : `Nuevo mensaje de contacto (${name})`;

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
            Headers: {
              "X-Form-Source": "bankclasifai-contact",
            },
          },
        ],
      }),
    });

    const mj = await mjResp.json();

    // ✅ OJO: Mailjet puede responder 200 pero el mensaje venir con Status "error"
    const msg0 = mj?.Messages?.[0];
    const status = msg0?.Status;

    if (!mjResp.ok || status !== "success") {
      console.error("Mailjet send failed:", {
        httpStatus: mjResp.status,
        mj,
      });

      // Devuelve un error legible (y si viene detalle de Mailjet, lo mostramos)
      const mjError =
        msg0?.Errors?.[0]?.ErrorMessage ||
        msg0?.Errors?.[0]?.ErrorCode ||
        "Mailjet failed.";

      return res.status(500).send(isEN ? `Mail delivery failed: ${mjError}` : `Falló el envío: ${mjError}`);
    }

    return res.status(200).send(isEN ? "Message sent successfully." : "Mensaje enviado correctamente.");
  } catch (err) {
    console.error("API contact error:", err);
    return res.status(500).send("Internal server error.");
  }
}
