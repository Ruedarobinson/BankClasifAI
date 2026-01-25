export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK - POST only");

  try {
    // 1) Leer body (soporta JSON y urlencoded)
    const contentType = (req.headers["content-type"] || "").toLowerCase();

    let data = {};
    if (contentType.includes("application/json")) {
      data = req.body || {};
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      // Vercel normalmente ya parsea req.body, pero por si llega como string:
      if (typeof req.body === "string") {
        data = Object.fromEntries(new URLSearchParams(req.body));
      } else {
        data = req.body || {};
      }
    } else {
      data = req.body || {};
    }

    const name = (data.name || "").trim();
    const email = (data.email || "").trim();
    const message = (data.message || "").trim();
    const lang = (data.lang || "es").toLowerCase();

    if (!name || !email || !message) {
      return res.status(400).send(lang === "en" ? "Missing required fields." : "Faltan campos requeridos.");
    }

    // 2) Turnstile token
    const token = data["cf-turnstile-response"];
    if (!token) {
      return res.status(400).send(lang === "en" ? "Missing anti-bot verification." : "Falta verificación anti-bot.");
    }

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (!turnstileSecret) return res.status(500).send("TURNSTILE_SECRET_KEY no configurado.");

    // 3) Validar Turnstile
    const formData = new URLSearchParams();
    formData.append("secret", turnstileSecret);
    formData.append("response", token);

    const ip =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress;

    if (ip) formData.append("remoteip", ip);

    const verifyResp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const verify = await verifyResp.json();
    if (!verify.success) {
      return res.status(403).send(lang === "en" ? "Anti-bot verification failed." : "Verificación anti-bot falló.");
    }

    // 4) Mailjet config
    const MJ_PUBLIC = process.env.MJ_APIKEY_PUBLIC;
    const MJ_PRIVATE = process.env.MJ_APIKEY_PRIVATE;

    if (!MJ_PUBLIC || !MJ_PRIVATE) {
      return res.status(500).send("Mailjet API keys no configuradas.");
    }

    const FROM_EMAIL = process.env.MAILJET_FROM_EMAIL || "no-reply@bankclasifai.com";
    const FROM_NAME = process.env.MAILJET_FROM_NAME || "BankClasifAI";
    const TO_EMAIL = process.env.MAILJET_TO_EMAIL || "info@bankclasifai.com";

    // 5) Email content
    const isEN = lang === "en";
    const subject = isEN
      ? `New contact message (${name})`
      : `Nuevo mensaje de contacto (${name})`;

    const html = `
      <h2>${isEN ? "New contact message" : "Nuevo mensaje de contacto"}</h2>
      <p><b>${isEN ? "Name" : "Nombre"}:</b> ${escapeHtml(name)}</p>
      <p><b>Email:</b> ${escapeHtml(email)}</p>
      <p><b>${isEN ? "Message" : "Mensaje"}:</b></p>
      <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>
      <hr>
      <p>Lang: ${escapeHtml(lang)} | IP: ${escapeHtml(ip || "n/a")}</p>
    `;

    // 6) Send with Mailjet
    const mailjetResp = await fetch("https://api.mailjet.com/v3.1/send", {
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
            HTMLPart: html,
          },
        ],
      }),
    });

    const mj = await mailjetResp.json();

    if (!mailjetResp.ok) {
      console.error("Mailjet error:", mj);
      // devuelve error real (solo un texto corto)
      return res.status(500).send(mj?.ErrorMessage || "No se pudo enviar el correo (Mailjet).");
    }

    return res.status(200).send(isEN ? "Message sent." : "Mensaje enviado.");
  } catch (e) {
    console.error(e);
    return res.status(500).send("Error interno.");
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
