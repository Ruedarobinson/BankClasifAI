// ================== CAMBIO DE IDIOMA CARPETA LANG.JS ==================
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-lang]");
  if (!link) return;

  e.preventDefault();
  const lang = link.dataset.lang; // "es" o "en"

  const path = window.location.pathname;       // ej: /html/precio.html
  const parts = path.split("/");
  const file = parts.pop() || "index.html";    // precio.html
  const dir  = parts.join("/") + "/";          // /html/

  // Pares reales (según tus archivos)
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

    "faq-es.html": "faq-en.html",
    "faq-en.html": "faq-es.html",
  };

  const targetFile = pairs[file];

  // Si no hay equivalente, fallback a home del idioma
  if (!targetFile) {
    window.location.href = dir + (lang === "en" ? "index-en.html" : "index.html");
    return;
  }

  // Si eligió EN, vamos al equivalente EN (que ya está en pairs)
  // Si eligió ES, vamos al equivalente ES (también está en pairs)
  window.location.href = dir + targetFile;
});

