// /js/include.js

function getFileAndDir() {
  const path = window.location.pathname; // ej: /html/precio.html
  const parts = path.split("/");
  const file = (parts.pop() || "index.html").toLowerCase();
  const dir = parts.join("/") + "/";     // ej: /html/
  return { file, dir };
}

function isEnglishFile(file) {
  return [
    "index-en.html",
    "personal.html",
    "business.html",
    "accountants.html",
    "pricing.html",
    "contactus.html",
    "privacy-policy.html",
    "terms&conditions.html",
    "cookies-en.html",
  ].includes(file);
}

async function loadInto(placeholderId, url) {
  const el = document.getElementById(placeholderId);
  if (!el) return;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar ${url} (${res.status})`);
  el.innerHTML = await res.text();
}

(async function initLayout() {
  try {
    const { file } = getFileAndDir();
    const en = isEnglishFile(file);

    await loadInto("header-placeholder", en ? "/components/header-en.html" : "/components/header.html");
    if (typeof initHeader === "function") initHeader();

    await loadInto("footer-placeholder", en ? "/components/footer-en.html" : "/components/footer.html");
    document.querySelectorAll(".js-year").forEach(el => (el.textContent = new Date().getFullYear()));

  } catch (err) {
    console.error("Error cargando layout:", err);
  }
})();

// ===============================
// CAMBIO DE IDIOMA (UNICO)
// ===============================
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-lang]");
  if (!link) return;

  e.preventDefault();

  const { file, dir } = getFileAndDir();
  const targetLang = link.dataset.lang; // "es" o "en"
  const enNow = isEnglishFile(file);

  if (targetLang === "en" && enNow) return;
  if (targetLang === "es" && !enNow) return;

  const pairs = {
    "index.html": "index-en.html",
    "index-en.html": "index.html",

    "personales.html": "personal.html",
    "personal.html": "personales.html",

    "negocios.html": "business.html",
    "business.html": "negocios.html",

    "contadores.html": "accountants.html",
    "accountants.html": "contadores.html",

    "precio.html": "pricing.html",
    "pricing.html": "precio.html",

    "contacto.html": "contactus.html",
    "contactus.html": "contacto.html",

    "politicas-de-privacidad.html": "privacy-policy.html",
    "privacy-policy.html": "politicas-de-privacidad.html",

    "terminos&condiciones.html": "terms&conditions.html",
    "terms&conditions.html": "terminos&condiciones.html",

    "cookies.html": "cookies-en.html",
    "cookies-en.html": "cookies.html",
  };

  const targetFile = pairs[file];

  if (!targetFile) {
    window.location.href = dir + (targetLang === "en" ? "index-en.html" : "index.html");
    return;
  }

  window.location.href = dir + targetFile;
});


