module.exports = async (req, res) => {
  try {
    // Para probar en el browser sin crash:
    if (req.method === "GET") return res.status(200).send("OK - POST only");

    if (req.method !== "POST") return res.status(405).send("Method not allowed");

    // Leer body x-www-form-urlencoded
    let body = "";
    await new Promise((resolve) => {
      req.on("data", (chunk) => (body += chunk));
      req.on("end", resolve);
    });

    const params = new URLSearchParams(body);
    const name = params.get("name") || "";
    const email = params.get("email") || "";
    const message = params.get("message") || "";
    const lang = (params.get("lang") || "es").toLowerCase();
    const token = params.get("cf-turnstile-response");

    if (!token) return res.status(400).send("Missing anti-bot token");

    // ✅ Turnstile verify
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return res.status(500).send("Missing TURNSTILE_SECRET_KEY");

    const verifyData = new URLSearchParams();
    verifyData.append("secret", secret);
    verifyData.append("response", token);

    const ip = req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"];
    if (ip) verifyData.append("remoteip", ip.toString().split(",")[0].trim());

    const vr = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: verifyData,
    });
    const verifyResult = await vr.json();

    if (!verifyResult.success) return res.status(403).send("Turnstile failed");

    // ✅ Mailjet (Basic Auth)
    const mjKey = process.env.MAILJET_API_KEY;
    const mjSecret = process.env.MAILJET_API_SECRET;
    const fromEmail = process.env.MAIL_FROM_EMAIL;
    const fromName = process.env.MAIL_FROM_NAME || "Website";
    const toEmail = process.env.MAIL_TO_EMAIL;

    if (!mjKey || !mjSecret || !fromEmail || !toEmail) {
      return res.status(500).send("Missing Mailjet env vars");
    }

    const subject = lang === "en" ? "New contact form message" : "Nuevo mensaje del formulario";
    const intro = lang === "en" ? "New message from your site:" : "Nuevo mensaje desde tu sitio:";

    const auth = Buffer.from(`${mjKey}:${mjSecret}`).toString("base64");

    const mjRes = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: fromEmail, Name: fromName },
            To: [{ Email: toEmail, Name: "Support" }],
            Subject: subject,
            TextPart:
              `${intro}\n\n` +
              `Name: ${name}\n` +
              `Email: ${email}\n\n` +
              `Message:\n${message}\n`,
            ReplyTo: { Email: email || fromEmail, Name: name || email || "Visitor" },
          },
        ],
      }),
    });

    if (!mjRes.ok) {
      const err = await mjRes.text();
      return res.status(500).send("Mail send failed: " + err);
    }

    return res.status(200).send("OK");
  } catch (e) {
    // Para ver algo útil en logs
    console.error(e);
    return res.status(500).send("Internal error");
  }
};
