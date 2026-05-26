const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
            error: "Missing OPENAI_API_KEY"
        });
    }

    try {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const { text } = body || {};

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        const mp3 = await client.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice: "nova",
            input: text,
            instructions: `
                Habla como una asesora virtual profesional de BankClasifai,
                cálida, amable y conversacional.
            `,
        });

        const ttsInstructions = `
            Habla como una asesora virtual profesional de BankClasifai.

            Tono:
            - Amable
            - Cercano
            - Natural
            - Seguro
            - Conversacional

            Velocidad:
            - Moderadamente lenta
            - Pronunciación clara

            Evita:
            - Sonar robótica
            - Leer listas muy rápido
            - Hablar como un sistema automático

            Haz pausas naturales entre ideas.
        `;

        const speech = await client.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice: "nova",
            input: text,
            instructions: ttsInstructions
        });

        const buffer = Buffer.from(await speech.arrayBuffer());

        res.setHeader("Content-Type", "audio/mpeg");
        return res.status(200).send(buffer);
    } catch (err) {
        console.error("[/api/tts] error:", err);
        return res.status(500).json({ error: err?.message || "TTS error" });
    }
};