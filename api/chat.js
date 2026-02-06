// ===============================
// CHATBOT
// ===============================


(function loadChatbotOnce() {
  if (window.__BC_CHAT_LOADED__) return;
  window.__BC_CHAT_LOADED__ = true;

  // 1) CSS del chatbot (solo una vez)
  if (!document.querySelector('link[data-bc-chat-css="1"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/chatbot.css";
    link.setAttribute("data-bc-chat-css", "1");
    document.head.appendChild(link);
  }

  // 2) Cargar el JS del chatbot (solo una vez)
  function loadChatScriptOnce() {
    if (document.querySelector('script[data-bc-chat-js="1"]')) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "/js/script.js";      // <-- tu script completo con Markdown
      s.defer = true;
      s.setAttribute("data-bc-chat-js", "1");
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  // 3) Inyectar HTML del chatbot
  fetch("/components/chatbot.html")
    .then((r) => {
      if (!r.ok) throw new Error("No se pudo cargar /components/chatbot.html");
      return r.text();
    })
    .then(async (html) => {
      if (!document.getElementById("bc-chat")) {
        document.body.insertAdjacentHTML("beforeend", html);
      }

      // 4) Asegura que el script esté cargado y luego inicializa
      await loadChatScriptOnce();

      if (window.initBankClasifAIChatbot) {
        window.initBankClasifAIChatbot();
      } else {
        console.error("[Chatbot] initBankClasifAIChatbot no está disponible. Revisa /js/script.js");
      }
    })
    .catch((err) => console.error("[Chatbot] Error:", err));
})();


