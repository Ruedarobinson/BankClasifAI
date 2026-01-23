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



