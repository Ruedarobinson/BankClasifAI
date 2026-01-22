// /js/include.js

function getPathInfo() {
  const path = window.location.pathname.replace(/\/+$/, ""); // quita / final
  const parts = path.split("/").filter(Boolean);

  // si estás en "/" => index
  let file = (parts.pop() || "index").toLowerCase();
  const dir = "/" + (parts.length ? parts.join("/") + "/" : "");

  // normaliza: si viene con .html lo quita
  file = file.replace(/\.html$/i, "");

  return { file, dir };
}

function isEnglishRoute(file) {
  // soporta con y sin .html (ya normalizamos sin .html)
  const enFiles = [
    "index-en",
    "personal",
    "business",
    "accountants",
    "pricing",
    "contactus",
    "privacy-policy",
    "terms&conditions",
    "cookies-en",
    "fqa-en",
    "bienvenido-en",
  ];
  return enFiles.includes(file);
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

  // prioridad: idioma guardado (si existe), si no, deduce por ruta
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
  const targetLang = link.dataset.lang; // "es" o "en"

  // guarda selección
  localStorage.setItem("bc_lang", targetLang);

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

    "cookies": "cookies-en",
    "cookies-en": "cookies",
  };

  const targetFile = pairs[file];

  // si no hay par, manda a home del idioma
  const next = targetFile
    ? targetFile
    : (targetLang === "en" ? "index-en" : "index");

  // redirección usando URL limpia (sin .html)
  window.location.href = dir + next;
});



