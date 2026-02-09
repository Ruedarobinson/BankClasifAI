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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      return data.reply;
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
})();

      if (elQuick) elQuick.style.display = "none";
