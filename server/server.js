import express from "express";
import dotenv from "dotenv";
import Mailjet from "node-mailjet";

dotenv.config();

const app = express();
app.set("trust proxy", true);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY,
  apiSecret: process.env.MAILJET_API_SECRET,
});

app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  const token = req.body["cf-turnstile-response"];
  if (!token) return res.status(400).send("Falta verificación anti-bot.");

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return res.status(500).send("Configuración inválida.");

  const formData = new URLSearchParams();
  formData.append("secret", secret);
  formData.append("response", token);

  const ip = req.headers["cf-connecting-ip"] || req.ip;
  if (ip) formData.append("remoteip", ip);

  let result;
  try {
    const verify = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: formData }
    );
    result = await verify.json();
  } catch {
    return res.status(500).send("Error verificando seguridad.");
  }

  if (!result.success) {
    return res.status(403).send("Verificación falló.");
  }

  // ✅ Enviar email por Mailjet
  try {
    await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAIL_FROM_EMAIL,
            Name: process.env.MAIL_FROM_NAME,
          },
          To: [
            {
              Email: process.env.MAIL_TO_EMAIL,
              Name: "Soporte",
            },
          ],
          Subject: `Nuevo mensaje de contacto: ${name || "Sin nombre"}`,
          TextPart:
            `Nombre: ${name}\n` +
            `Email: ${email}\n\n` +
            `Mensaje:\n${message}\n`,
          ReplyTo: {
            Email: email, // para que puedas responder directo al cliente
            Name: name || email,
          },
        },
      ],
    });

    return res.send("Mensaje enviado");
  } catch (e) {
    return res.status(500).send("No se pudo enviar el correo.");
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

