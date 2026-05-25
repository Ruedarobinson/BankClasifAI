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

        const audio = await client.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice: "marin",
            input: text,
            instructions:
                "Speak in a warm, professional, friendly tone, like a real financial advisor. Natural pacing, clear pronunciation, not robotic.",
            format: "mp3",
        });

        const buffer = Buffer.from(await audio.arrayBuffer());

        res.setHeader("Content-Type", "audio/mpeg");
        return res.status(200).send(buffer);
    } catch (err) {
        console.error("[/api/tts] error:", err);
        return res.status(500).json({ error: err?.message || "TTS error" });
    }
};