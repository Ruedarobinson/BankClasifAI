// /js/include.js

function getPathInfo() {
  // Ejemplos:
  // "/" -> file: "index", dir: "/"
  // "/precio" -> file: "precio", dir: "/"
  // "/precio.html" -> file: "precio", dir: "/"
  // "/html/precio" -> file: "precio", dir: "/html/"
  // "/html/precio.html" -> file: "precio", dir: "/html/"

  const path = window.location.pathname.replace(/\/+$/, ""); // quita "/" final
  const parts = path.split("/").filter(Boolean);

  let file = (parts.pop() || "index").toLowerCase();
  const dir = "/" + (parts.length ? parts.join("/") + "/" : "");

  // Normaliza: quita ".html" si existe
  file = file.replace(/\.html$/i, "");

  return { file, dir };
}

function isEnglishRoute(file) {
  // file ya viene normalizado sin .html y en minúsculas
  const enRoutes = new Set([
    "index-en",
    "personal",
    "business",
    "accountants",
    "pricing",
    "contactus",
    "privacy-policy",
    "terms&conditions",
    "cookies-en",
    "faq-en",
    "bienvenido-en",
  ]);

  return enRoutes.has(file);
}

async function loadInto(placeholderId, url) {
  const el = document.getElementById(placeholderId);
  if (!el) return;

  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`No se pudo cargar ${url} (${res.status})`);
  el.innerHTML = await res.text();
}

async function loadLayout() {
  const { file } = getPathInfo();

  // idioma preferido (si existe), si no, deduce por la ruta actual
  const savedLang = localStorage.getItem("bc_lang"); // "en" o "es"
  const en = savedLang ? savedLang === "en" : isEnglishRoute(file);

  await loadInto("header-placeholder", en ? "/components/header-en.html" : "/components/header.html");
  if (typeof initHeader === "function") initHeader();

  await loadInto("footer-placeholder", en ? "/components/footer-en.html" : "/components/footer.html");

  document.querySelectorAll(".js-year").forEach(el => (el.textContent = new Date().getFullYear()));
}

document.addEventListener("DOMContentLoaded", () => {
  loadLayout().catch(err => console.error("Error cargando layout:", err));
});

// ===============================
// CAMBIO DE IDIOMA
// ===============================
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-lang]");
  if (!link) return;

  e.preventDefault();

  const { file, dir } = getPathInfo();
  const targetLang = (link.dataset.lang || "es").toLowerCase(); // "es" o "en"

  // guarda selección
  localStorage.setItem("bc_lang", targetLang);

  // pares de rutas (SIEMPRE en minúsculas y sin .html)
  const pairs = {
    "index": "index-en",
    "index-en": "index",

    "personales": "personal",
    "personal": "personales",

    "negocios": "business",
    "business": "negocios",

    "contadores": "accountants",
    "accountants": "contadores",

    "precio": "pricing",
    "pricing": "precio",

    "contacto": "contactus",
    "contactus": "contacto",

    "politicas-de-privacidad": "privacy-policy",
    "privacy-policy": "politicas-de-privacidad",

    "terminos&condiciones": "terms&conditions",
    "terms&conditions": "terminos&condiciones",

    "faq-es": "faq-en",
    "faq-en": "faq-es",

    "cookies": "cookies-en",
    "cookies-en": "cookies",
  };

  const targetFile = pairs[file];

  // si no hay par, manda a home del idioma
  const next = targetFile
    ? targetFile
    : (targetLang === "en" ? "index-en" : "index");

  // redirección URL limpia (sin .html)
  window.location.href = dir + next;
});




// ===============================
// CHATBOT
// ===============================


(function loadChatbotOnce() {
  if (window.__BC_CHAT_LOADED__) return;
  window.__BC_CHAT_LOADED__ = true;

  // 1) CSS del chatbot
  if (!document.querySelector('link[data-bc-chat-css="1"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/chatbot.css";
    link.setAttribute("data-bc-chat-css", "1");
    document.head.appendChild(link);
  }

  // 2) Inyecta HTML del chatbot
  fetch("/components/chatbot.html")
    .then(r => {
      if (!r.ok) throw new Error("No se pudo cargar /components/chatbot.html");
      return r.text();
    })
    .then(html => {
      if (document.getElementById("bc-chat")) return;

      document.body.insertAdjacentHTML("beforeend", html);

      // 3) Inicializa el chatbot (TODO aquí dentro)
      initBCChatbot();
    })
    .catch(err => console.error("[Chatbot] Error:", err));

  function initBCChatbot(){
    const fab = document.getElementById("bc-chat-fab");
    const panel = document.getElementById("bc-chat");
    const closeBtn = document.getElementById("bc-chat-close");

    const elMsgs = document.getElementById("bc-chat-messages");
    const elQuick = document.getElementById("bc-chat-quick");
    const elForm = document.getElementById("bc-chat-form");
    const elInput = document.getElementById("bc-chat-input");

    if (!fab || !panel || !closeBtn || !elMsgs || !elQuick || !elForm || !elInput) {
      console.error("[Chatbot] Faltan elementos del DOM. Revisa chatbot.html");
      return;
    }

    const STORAGE_KEY = "bc_chat_history_v1";
    const MAX_HISTORY = 12;
    let history = loadHistory();

    function scrollChatToBottom(smooth = false){
      elMsgs.scrollTo({
        top: elMsgs.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
    }

    function openPanel(){
      panel.classList.remove("closed");
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      setTimeout(() => scrollChatToBottom(false), 50);
    }

    function closePanel(){
      panel.classList.remove("open");
      panel.classList.add("closed");
      panel.setAttribute("aria-hidden", "true");
    }

    function togglePanel(){
      panel.classList.contains("open") ? closePanel() : openPanel();
    }

    fab.addEventListener("click", togglePanel);
    closeBtn.addEventListener("click", closePanel);

    function addMsg(role, text){
      const div = document.createElement("div");
      div.className = `bc-msg ${role}`;
      div.textContent = text;
      elMsgs.appendChild(div);
      scrollChatToBottom(false);
    }

    function saveHistory(){
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
    }

    function loadHistory(){
      try{
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      }catch{
        return [];
      }
    }

    function hideQuickReplies(){
      elQuick.style.display = "none";
    }

    // Oculta quick replies cuando empieza a escribir
    elInput.addEventListener("input", () => {
      if (elInput.value.trim().length > 0) hideQuickReplies();
    });

    // Quick replies
    const quick = [
      { es: "¿Cómo funciona BankClasifAI?", en: "How does BankClasifAI work?" },
      { es: "¿Convierten PDF a Excel?", en: "Do you convert PDF to Excel?" },
      { es: "Precios y prueba gratis", en: "Pricing and free trial" },
    ];

    function guessLang(text){
      const t = (text||"").toLowerCase();
      if (/[ñáéíóúü]/.test(t) || /\b(hola|gracias|precio|prueba|banco|extracto)\b/.test(t)) return "es";
      return "en";
    }

    let uiLang = "es";

    function renderQuick(){
      elQuick.innerHTML = "";
      quick.forEach(q => {
        const b = document.createElement("button");
        b.className = "bc-chip";
        b.type = "button";
        b.textContent = q[uiLang];
        b.onclick = () => {
          elInput.value = q[uiLang];
          elForm.requestSubmit();
        };
        elQuick.appendChild(b);
      });
    }

    function renderHistory(){
      elMsgs.innerHTML = "";
      if (history.length === 0){
        addMsg("bot", "Hi! / ¡Hola! How can I help you?");
        renderQuick();
      } else {
        history.forEach(m => addMsg(m.role, m.content));
        hideQuickReplies();
      }
    }

    // Typing indicator
    function showTyping(){
      if (document.getElementById("bc-typing")) return;

      const wrap = document.createElement("div");
      wrap.id = "bc-typing";
      wrap.className = "bc-typing";
      wrap.innerHTML = `
        <span class="bc-typing__dot"></span>
        <span class="bc-typing__dot"></span>
        <span class="bc-typing__dot"></span>
      `;
      elMsgs.appendChild(wrap);
      scrollChatToBottom(false);
    }

    function hideTyping(){
      const el = document.getElementById("bc-typing");
      if (el) el.remove();
    }

    // Call AI
    async function askAI(messages){
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      return data.reply;
    }

    renderHistory();

    // Submit único
    elForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = elInput.value.trim();
      if (!text) return;

      hideQuickReplies();

      uiLang = guessLang(text);

      addMsg("user", text);
      history.push({ role: "user", content: text });
      saveHistory();
      elInput.value = "";

      // Typing con delay (evita parpadeo si responde rápido)
      let typingShown = false;
      const t = setTimeout(() => { showTyping(); typingShown = true; }, 250);

      try{
        const clipped = history.slice(-MAX_HISTORY);
        const reply = await askAI(clipped);

        clearTimeout(t);
        if (typingShown) hideTyping();

        addMsg("bot", reply);
        history.push({ role: "assistant", content: reply });
        saveHistory();

      }catch(err){
        clearTimeout(t);
        if (typingShown) hideTyping();

        addMsg("bot", uiLang === "es"
          ? "Hubo un error conectando con la IA. Intenta de nuevo."
          : "There was an error connecting to AI. Please try again."
        );
      }
    });
  }
})();
