export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  try {
    const { name, email, message, lang } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).send("Missing required fields.");
    }

    // 🔐 Turnstile
    const token = req.body["cf-turnstile-response"];
    if (!token) {
      return res.status(400).send("Missing anti-bot verification.");
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      return res.status(500).send("Turnstile secret not configured.");
    }

    const formData = new URLSearchParams();
    formData.append("secret", secret);
    formData.append("response", token);

    const verifyResp = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: formData }
    );

    const verify = await verifyResp.json();
    if (!verify.success) {
      return res.status(403).send("Anti-bot verification failed.");
    }

    // ✉️ Mailjet
    const MJ_PUBLIC = process.env.MJ_APIKEY_PUBLIC;
    const MJ_PRIVATE = process.env.MJ_APIKEY_PRIVATE;

    if (!MJ_PUBLIC || !MJ_PRIVATE) {
      return res.status(500).send("Mailjet keys not configured.");
    }

    const FROM_EMAIL = process.env.MAILJET_FROM_EMAIL;
    const FROM_NAME = process.env.MAILJET_FROM_NAME || "BankClasifAI";
    const TO_EMAIL = process.env.MAILJET_TO_EMAIL;

    if (!FROM_EMAIL || !TO_EMAIL) {
      return res.status(500).send("Mailjet emails not configured.");
    }

    const isEN = lang === "en";
    const subject = isEN
      ? `New contact message from ${name}`
      : `Nuevo mensaje de contacto de ${name}`;

    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " + Buffer.from(`${MJ_PUBLIC}:${MJ_PRIVATE}`).toString("base64"),
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

    const mj = await response.json();

    if (!response.ok) {
      console.error("Mailjet error:", mj);
      return res.status(500).send("Mailjet failed.");
    }

    return res
      .status(200)
      .send(isEN ? "Message sent successfully." : "Mensaje enviado correctamente.");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error.");
  }
}
