const OpenAI = require("openai");
const formidable = require("formidable");
const fs = require("fs");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

module.exports.config = {
    api: {
        bodyParser: false,
    },
};

function parseForm(req) {
    const form = formidable({
        multiples: false,
        keepExtensions: true,
    });

    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });
}

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed",
        });
    }

    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
            error: "Missing OPENAI_API_KEY",
        });
    }

    try {
        const { files } = await parseForm(req);

        const audioFile = Array.isArray(files.audio)
            ? files.audio[0]
            : files.audio;

        if (!audioFile) {
            return res.status(400).json({
                error: "Audio file missing",
            });
        }

        const transcription =
            await client.audio.transcriptions.create({
                file: fs.createReadStream(audioFile.filepath),
                model: "gpt-4o-transcribe",
            });

        return res.status(200).json({
            text: transcription.text,
        });

    } catch (err) {
        console.error("[/api/transcribe]", err);

        return res.status(500).json({
            error: err.message || "Transcription error",
        });
    }
};



/*
========================================================
BankClasifAI - Speech To Text (Voice → Text)
========================================================

¿Para qué sirve este archivo?

Este endpoint recibe el audio grabado desde el micrófono
del chatbot y lo convierte a texto utilizando OpenAI.

Flujo completo:

Usuario habla
      ↓
chatbot.js graba audio (MediaRecorder)
      ↓
POST /api/transcribe
      ↓
OpenAI gpt-4o-transcribe
      ↓
Texto transcrito
      ↓
chatbot.js coloca el texto en el chat
      ↓
/api/chat genera respuesta
      ↓
/api/tts convierte respuesta en voz
      ↓
Usuario escucha la respuesta

--------------------------------------------------------
¿Qué recibe?
--------------------------------------------------------

Un archivo de audio enviado desde el navegador:

audio/webm

Ejemplo:

FormData
└── audio: voice.webm

--------------------------------------------------------
¿Qué devuelve?
--------------------------------------------------------

JSON:

{
  "text": "What is BankClasifAI?"
}

--------------------------------------------------------
Librerías utilizadas
--------------------------------------------------------

OpenAI
→ Convierte audio a texto

Formidable
→ Lee archivos enviados por FormData

fs
→ Permite leer el archivo temporal
   guardado por Vercel

--------------------------------------------------------
Modelo utilizado
--------------------------------------------------------

gpt-4o-transcribe

Función:
Transcribir voz a texto con alta precisión
en inglés y español.

--------------------------------------------------------
Importante
--------------------------------------------------------

Este archivo NO genera respuestas.

Solo convierte:

VOZ → TEXTO

Las respuestas se generan en:

/api/chat.js

La voz de respuesta se genera en:

/api/tts.js

========================================================
*/






/*
FORMIDABLE

¿Para qué sirve?

Recibe y procesa archivos enviados desde el navegador
mediante FormData.

En este proyecto se utiliza para recibir el audio grabado
por el micrófono del usuario.

Flujo:

Micrófono
↓
audio.webm
↓
FormData
↓
Formidable
↓
archivo temporal
↓
OpenAI Transcribe
↓
texto

Sin Formidable no podríamos acceder al archivo
de audio enviado por el navegador.
*/