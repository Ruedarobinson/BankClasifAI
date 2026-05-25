/* ============================
   BankClasifAI – CHATBOT
============================ */

(function () {
  // Evita cargar este archivo 2 veces
  if (window.__BC_CHAT_SCRIPT_LOADED__) return;
  window.__BC_CHAT_SCRIPT_LOADED__ = true;

  function initBankClasifAIChatbot() {
    // ✅ evita doble init (MUY IMPORTANTE)
    if (window.__BC_CHAT_INITED__) return;
    window.__BC_CHAT_INITED__ = true;

    // ---------- DOM ----------
    const fab = document.getElementById("bc-chat-fab");
    const panel = document.getElementById("bc-chat");
    const closeBtn = document.getElementById("bc-chat-close");

    const elMsgs = document.getElementById("bc-chat-messages");
    const elQuick = document.getElementById("bc-chat-quick");
    const elForm = document.getElementById("bc-chat-form");
    const elInput = document.getElementById("bc-chat-input");
    // ---------- microphone ----------
    const micBtn = document.getElementById("bc-chat-mic");
   let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let voiceMode = false;
let silenceTimer = null;
let audioContext;
let analyser;
let source;
let currentStream;





    // ⛔ Si el HTML aún no existe, no inicializa
    if (!fab || !panel || !closeBtn || !elMsgs || !elForm || !elInput) {
      console.warn("[Chatbot] DOM no listo, init cancelado");
      window.__BC_CHAT_INITED__ = false; // permite reintento si se cargó tarde
      return;
    }

    // ---------- CONFIG ----------
    const STORAGE_KEY = "bc_chat_history_v1";
    const MAX_HISTORY = 12;

    let history = loadHistory();
    let uiLang = "es";

    // ---------- PANEL ----------
    function openPanel() {
      panel.classList.remove("closed");
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      setTimeout(() => scrollChatToBottom(false), 50);
    }

    function closePanel() {
      panel.classList.remove("open");
      panel.classList.add("closed");
      panel.setAttribute("aria-hidden", "true");
    }

    function togglePanel() {
      panel.classList.contains("open") ? closePanel() : openPanel();
    }

    fab.addEventListener("click", togglePanel);
    closeBtn.addEventListener("click", closePanel);

    // ---------- UTILS ----------
    function scrollChatToBottom(smooth = true) {
      elMsgs.scrollTo({
        top: elMsgs.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }

    function escapeHTML(str) {
      return (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function renderSimpleMarkdown(text) {
      let html = escapeHTML(text);
      html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/\n/g, "<br>");
      html = html.replace(/(^|<br>)-\s+/g, "$1• ");
      return html;
    }

    function addMsg(role, text) {
      const div = document.createElement("div");
      div.className = `bc-msg ${role}`;
      div.innerHTML = renderSimpleMarkdown(text);
      elMsgs.appendChild(div);
      scrollChatToBottom(false);
      return div;
    }

    function hideQuickReplies() {
      if (elQuick) elQuick.style.display = "none";
    }

    function showQuickReplies() {
      if (elQuick) elQuick.style.display = "";
    }

    // ---------- STORAGE ----------
    function saveHistory() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history.slice(-MAX_HISTORY))
      );
    }

    function loadHistory() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }

    // ---------- HISTORY ----------
    function renderHistory() {
      elMsgs.innerHTML = "";
      if (history.length === 0) {
        addMsg("bot", "Hi! / ¡Hola! How can I help you?");
        showQuickReplies();
      } else {
        history.forEach((m) => addMsg(m.role, m.content));
        hideQuickReplies();
      }
    }

    // ---------- QUICK REPLIES ----------
    const quick = [
      { es: "¿Cómo funciona BankClasifAI?", en: "How does BankClasifAI work?" },
      { es: "¿Convierten PDF a Excel?", en: "Do you convert PDF to Excel?" },
      { es: "Precios y prueba gratis", en: "Pricing and free trial" },
    ];

    function guessLang(text) {
      const t = (text || "").toLowerCase();
      if (
        /[ñáéíóúü]/.test(t) ||
        /\b(hola|gracias|precio|prueba|banco|extracto|facturacion|facturación)\b/.test(t)
      ) return "es";
      return "en";
    }

    function renderQuick() {
      if (!elQuick) return;
      elQuick.innerHTML = "";
      quick.forEach((q) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "bc-chip";
        b.textContent = q[uiLang];
        b.onclick = () => {
          elInput.value = q[uiLang];
          elForm.requestSubmit();
        };
        elQuick.appendChild(b);
      });
    }

    renderHistory();
    renderQuick();

    elInput.addEventListener("input", () => {
      if (elInput.value.trim().length > 0) hideQuickReplies();
    });

    // ---------- API ----------
    async function askAI(messages) {
  const pageLanguage =
    document.documentElement.lang === "en"
      ? "English"
      : "Spanish";

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      language: pageLanguage
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);

  return data.reply;
}
    // ---------- voice assistant ----------

    async function transcribeAudio(audioBlob) {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Transcription failed");

      return data.text;
    }

    async function speakAI(text) {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error("TTS failed");

  const audioBlob = await res.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);

  return new Promise((resolve) => {
    audio.onended = resolve;
    audio.onerror = resolve;
    audio.play();
  });
}


 async function startListening() {
  if (!voiceMode || isRecording) return;

  currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  audioChunks = [];
  mediaRecorder = new MediaRecorder(currentStream);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    stopAudioAnalysis();

    currentStream.getTracks().forEach(track => track.stop());

    isRecording = false;
    micBtn.classList.remove("recording");
    micBtn.textContent = "⏳";

    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

    if (audioBlob.size < 12000) {
  console.log("[Voice] Audio too short or silent, ignored.");

  if (voiceMode) {
    setTimeout(() => startListening(), 500);
  }

  return;
}

    const loadingNode = addMsg("bot", uiLang === "es" ? "Procesando tu voz..." : "Processing your voice...");

    try {
      const text = await transcribeAudio(audioBlob);
      loadingNode.remove();

      const cleanText = (text || "").trim();

const invalidVoiceText =
  !cleanText ||
  cleanText.length < 4 ||
  /^[^\wáéíóúñü]+$/i.test(cleanText) ||
  /[\u0600-\u06FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/.test(cleanText);

if (invalidVoiceText) {
  console.log("[Voice] Invalid or silent transcription ignored.");
  stopVoiceMode();
  return;
}

elInput.value = text;
await submitVoiceMessage(text);

if (voiceMode) {
  setTimeout(() => startListening(), 600);
}

    } catch (err) {
      console.error("[Voice Conversation] Error:", err);
      loadingNode.innerHTML = renderSimpleMarkdown(
        uiLang === "es"
          ? "No pude convertir tu voz a texto. Intenta de nuevo."
          : "I couldn't convert your voice to text. Please try again."
      );

      if (voiceMode) {
        setTimeout(() => startListening(), 1200);
      }
    }
  };

  mediaRecorder.start();
  isRecording = true;

  micBtn.classList.add("recording");
  micBtn.textContent = "🔴";

  startSilenceDetection(currentStream);
}

function startSilenceDetection(stream) {
  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  source = audioContext.createMediaStreamSource(stream);

  source.connect(analyser);
  analyser.fftSize = 2048;

  const dataArray = new Uint8Array(analyser.fftSize);

  function checkVolume() {
    if (!isRecording || !voiceMode) return;

    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const value = dataArray[i] - 128;
      sum += value * value;
    }

    const volume = Math.sqrt(sum / dataArray.length);

    if (volume < 6) {
      if (!silenceTimer) {
        silenceTimer = setTimeout(() => {
          if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        }, 1800);
      }
    } else {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }

    requestAnimationFrame(checkVolume);
  }

  checkVolume();
}

function stopAudioAnalysis() {
  clearTimeout(silenceTimer);
  silenceTimer = null;

  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
}

async function submitVoiceMessage(text) {
  hideQuickReplies();

  uiLang = guessLang(text);
  renderQuick();

  addMsg("user", text);
  history.push({ role: "user", content: text });
  saveHistory();

  elInput.value = "";

  const loadingNode = addMsg("bot", "…");

  try {
    const clipped = history.slice(-MAX_HISTORY);
    const reply = await askAI(clipped);

    loadingNode.innerHTML = renderSimpleMarkdown(reply);

    history.push({ role: "assistant", content: reply });
    saveHistory();

    await speakAI(reply);

  } catch (err) {
    console.error("[Voice Chat] Error:", err);

    const msg =
      uiLang === "es"
        ? "Hubo un error conectando con la IA. Intenta de nuevo."
        : "There was an error connecting to AI. Please try again.";

    loadingNode.innerHTML = renderSimpleMarkdown(msg);
  }
}

function stopVoiceMode() {
  voiceMode = false;

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }

  stopAudioAnalysis();

  micBtn.classList.remove("recording");
  micBtn.textContent = "၊||၊";
}

if (micBtn) {
  micBtn.addEventListener("click", async () => {
    try {
      if (!voiceMode) {
        voiceMode = true;
        micBtn.textContent = "🔴";
        addMsg("bot", uiLang === "es" ? "Modo voz activado. Te escucho." : "Voice mode activated. I'm listening.");
        await startListening();
      } else {
        stopVoiceMode();
        addMsg("bot", uiLang === "es" ? "Modo voz desactivado." : "Voice mode off.");
      }
    } catch (err) {
      console.error("[Voice Mode] Error:", err);
      stopVoiceMode();
      addMsg("bot", uiLang === "es"
        ? "No pude acceder al micrófono. Verifica los permisos."
        : "I couldn't access the microphone. Please check permissions."
      );
    }
  });
}








    // ---------- SUBMIT ----------
    elForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const text = elInput.value.trim();
      if (!text) return;

      hideQuickReplies();

      uiLang = guessLang(text);
      renderQuick();

      addMsg("user", text);
      history.push({ role: "user", content: text });
      saveHistory();
      elInput.value = "";

      const loadingNode = addMsg("bot", "…");

      try {
        const clipped = history.slice(-MAX_HISTORY);
        const reply = await askAI(clipped);
        loadingNode.innerHTML = renderSimpleMarkdown(reply);
        history.push({ role: "assistant", content: reply });
        saveHistory();
  
      } catch (err) {
        console.error("[Chatbot] Error:", err);

        const msg =
          uiLang === "es"
            ? "Hubo un error conectando con la IA. Intenta de nuevo."
            : "There was an error connecting to AI. Please try again.";

        loadingNode.innerHTML = renderSimpleMarkdown(msg);
      }

      requestAnimationFrame(() => scrollChatToBottom(false));
    });
  }

  window.initBankClasifAIChatbot = initBankClasifAIChatbot;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBankClasifAIChatbot);
} else {
  initBankClasifAIChatbot();
}

})();