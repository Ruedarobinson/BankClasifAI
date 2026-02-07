// /js/include.js



function ensureScriptOnce(src, attr = "data-loaded") {
  const existing = document.querySelector(`script[${attr}="1"][src="${src}"]`);
  if (existing) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.defer = true;
    s.setAttribute(attr, "1");
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}


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

  const savedLang = localStorage.getItem("bc_lang");
  const en = savedLang ? savedLang === "en" : isEnglishRoute(file);

  // ✅ Asegura que script.js (y initHeader) esté cargado ANTES
  await ensureScriptOnce("/js/script.js", "data-main-js");

  await loadInto(
    "header-placeholder",
    en ? "/components/header-en.html" : "/components/header.html"
  );

  if (typeof initHeader === "function") {
    initHeader();
  } else {
    console.warn("initHeader no está disponible");
  }

  await loadInto(
    "footer-placeholder",
    en ? "/components/footer-en.html" : "/components/footer.html"
  );

  document.querySelectorAll(".js-year").forEach(el => {
    el.textContent = new Date().getFullYear();
  });
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
//CHATBOT LOADER
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
      s.src = "/js/script.js";
      s.defer = true;
      s.setAttribute("data-bc-chat-js", "1");
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  async function ensureChatLoaded() {
    // Si ya existe el HTML del chat, no lo vuelvas a inyectar
    if (!document.getElementById("bc-chat")) {
      const r = await fetch("/components/chatbot.html");
      if (!r.ok) throw new Error("No se pudo cargar /components/chatbot.html");
      const html = await r.text();
      document.body.insertAdjacentHTML("beforeend", html);
    }

    await loadChatScriptOnce();

    if (typeof window.initBankClasifAIChatbot === "function") {
      window.initBankClasifAIChatbot();
    } else {
      console.error("[Chatbot] initBankClasifAIChatbot no está disponible. Revisa /js/script.js");
    }
  }

  ensureChatLoaded().catch((err) => console.error("[Chatbot] Error:", err));
})();


// ===============================
//MODAL VIDEO LOADER
// ===============================

fetch("/components/video-modal.html")
  .then(res => {
    if (!res.ok) throw new Error("No se pudo cargar el modal: " + res.status);
    return res.text();
  })
  .then(html => {
    const container = document.getElementById("video-component");
    if (container) container.innerHTML = html;
    document.dispatchEvent(new Event("videoModalReady"));
  })
  .catch(err => console.error("Modal load error:", err));
