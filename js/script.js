
// HEADER//

function initHeader() {

  const hamburger = document.querySelector(".hamburger-menu");
  const navOverlay = document.querySelector(".nav-overlay");
  const closeBtn = document.querySelector(".overlay-close");
  const langDropdown = document.querySelector(".lang-dropdown");
  const langSwitch = document.querySelector(".lang-switch");

  // ESC cierra overlay y dropdowns
  if (!document.body.dataset.escReady) {
    document.body.dataset.escReady = "1";
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        navOverlay?.classList.remove("open");
        langDropdown?.classList.remove("open");
        document.getElementById("solucionesDropdown")?.classList.remove("open");
      }
    });
  }

  // Hamburger
  if (hamburger && navOverlay && !hamburger.dataset.ready) {
    hamburger.dataset.ready = "1";
    hamburger.addEventListener("click", (e) => {
      e.preventDefault();
      navOverlay.classList.toggle("open");
    });

    navOverlay.addEventListener("click", (e) => {
      if (e.target.closest("a")) navOverlay.classList.remove("open");
    });
  }

  // Botón X
  if (closeBtn && navOverlay && !closeBtn.dataset.ready) {
    closeBtn.dataset.ready = "1";
    closeBtn.addEventListener("click", () => navOverlay.classList.remove("open"));
  }

  // Idioma
  if (langDropdown && langSwitch && !langDropdown.dataset.ready) {
    langDropdown.dataset.ready = "1";

    langSwitch.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      langDropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!langDropdown.contains(e.target)) langDropdown.classList.remove("open");
    });
  }

  // Soluciones (Stripe-like)
  initStripeDropdown("solucionesDropdown", "solucionesBtn");
}



// ================== CAMBIO DE IDIOMA ==================
document.querySelectorAll("[data-lang]").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const lang = link.dataset.lang;
    switchLanguage(lang);
  });
});

function switchLanguage(lang) {
  const path = window.location.pathname;

  const map = {
    "/index.html": {
      en: "/index-en.html",
      es: "/index.html"
    },
    "/personales.html": {
      en: "/personal.html",
      es: "/personales.html"
    },
    "/negocios.html": {
      en: "/business.html",
      es: "/negocios.html"
    },
    "/contadores.html": {
      en: "/accountants.html",
      es: "/contadores.html"
    },
    "/cookies.html": {
      en: "/cookies-en.html",
      es: "/cookies.html"
    },
    "/precio.html": {
      en: "/pricing.html",
      es: "/precio.html"
    },
    "/contacto.html": {
      en: "/contact.html",
      es: "/contacto.html"
    },

  };

  if (map[path] && map[path][lang]) {
    window.location.href = map[path][lang];
  } else {
    // fallback
    window.location.href = lang === "en" ? "/index-en.html" : "/index.html";
  }
}







// ================== FAQ ACORDEÓN ==================
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".faq-item");

  items.forEach(item => {
    const btn = item.querySelector(".faq-question");
    if (!btn) return;
    btn.addEventListener("click", () => {
      items.forEach(i => {
        if (i !== item) i.classList.remove("active");
      });
      item.classList.toggle("active");
    });
  });
});






document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  const nameInput = form.querySelector("#name");
  const emailInput = form.querySelector("#email");
  const messageInput = form.querySelector("#message");
  const formMessage = document.getElementById("formMessage");
  const submitBtn = form.querySelector(".btn-submit");

  function showMsg(type, msg) {
    formMessage.classList.remove("error", "success");
    formMessage.textContent = msg;
    formMessage.classList.add(type);
    formMessage.style.display = "block";
  }

  function clearErrors() {
    [nameInput, emailInput, messageInput].forEach(input => input.classList.remove("has-error"));
    form.querySelectorAll(".error-message").forEach(span => (span.textContent = ""));

    formMessage.classList.remove("error", "success");
    formMessage.style.display = "none";
    formMessage.textContent = "";
  }

  function setError(input, message) {
    const group = input.closest(".form-group");
    const errorSpan = group.querySelector(".error-message");
    input.classList.add("has-error");
    if (errorSpan) errorSpan.textContent = message;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearErrors();

    let isValid = true;

    const lang = (form.querySelector('input[name="lang"]')?.value || "es").toLowerCase();
    const t = {
      es: {
        name: "Por favor ingresa tu nombre completo.",
        emailReq: "El correo electrónico es obligatorio.",
        emailVal: "Ingresa un correo electrónico válido.",
        msg: "El mensaje debe tener al menos 10 caracteres.",
        fix: "Por favor corrige los campos marcados en rojo.",
        sending: "Enviando...",
        ok: "¡Tu mensaje fue enviado correctamente! Pronto nos pondremos en contacto contigo.",
        fail: "Hubo un error al enviar el mensaje. Inténtalo nuevamente.",
        bot: "Completa la verificación anti-bot."
      },
      en: {
        name: "Please enter your full name.",
        emailReq: "Email is required.",
        emailVal: "Please enter a valid email.",
        msg: "Message must be at least 10 characters.",
        fix: "Please fix the fields marked in red.",
        sending: "Sending...",
        ok: "Message sent successfully. We’ll get back to you soon.",
        fail: "There was an error sending your message. Please try again.",
        bot: "Please complete the anti-bot verification."
      }
    }[lang === "en" ? "en" : "es"];

    if (nameInput.value.trim().length < 3) {
      setError(nameInput, t.name);
      isValid = false;
    }

    if (emailInput.value.trim() === "") {
      setError(emailInput, t.emailReq);
      isValid = false;
    } else if (!isValidEmail(emailInput.value.trim())) {
      setError(emailInput, t.emailVal);
      isValid = false;
    }

    if (messageInput.value.trim().length < 10) {
      setError(messageInput, t.msg);
      isValid = false;
    }

    const token = form.querySelector('input[name="cf-turnstile-response"]')?.value?.trim();
    if (!token) {
      showMsg("error", t.bot);
      return;
    }

    if (!isValid) {
      showMsg("error", t.fix);
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = t.sending;

    try {
      const body = new URLSearchParams();
      body.append("lang", lang);
      body.append("name", nameInput.value.trim());
      body.append("email", emailInput.value.trim());
      body.append("message", messageInput.value.trim());
      body.append("cf-turnstile-response", token);

      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Request failed");

      showMsg("success", t.ok);
      form.reset();

      if (window.turnstile) window.turnstile.reset();
    } catch (err) {
      // muestra error real si viene del backend (útil para debug)
      const msg = (err?.message && err.message.length < 200) ? err.message : t.fail;
      showMsg("error", msg);

      if (window.turnstile) window.turnstile.reset();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});


// MENU DE SOLUCIONES

function initSolucionesDropdown() {
  const dd = document.getElementById("solucionesDropdown");
  const btn = document.getElementById("solucionesBtn");
  if (!dd || !btn) return;

  if (dd.dataset.ready === "1") return;
  dd.dataset.ready = "1";

  dd.classList.remove("open");

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dd.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!dd.contains(e.target)) dd.classList.remove("open");
  });
}

function initStripeDropdown(dropdownId, buttonId) {
  const dd = document.getElementById(dropdownId);
  const btn = document.getElementById(buttonId);
  if (!dd || !btn) return;

  if (dd.dataset.stripeReady === "1") return;
  dd.dataset.stripeReady = "1";

  let openTimer = null;
  let closeTimer = null;

  const isDesktop = () => window.matchMedia("(min-width: 901px)").matches;

  const open = () => {
    clearTimeout(closeTimer);
    openTimer = setTimeout(() => dd.classList.add("open"), 90);   // delay corto
  };

  const close = () => {
    clearTimeout(openTimer);
    closeTimer = setTimeout(() => dd.classList.remove("open"), 160); // delay mayor
  };

  // Desktop: hover intent
  dd.addEventListener("mouseenter", () => { if (isDesktop()) open(); });
  dd.addEventListener("mouseleave", () => { if (isDesktop()) close(); });

  // Mobile: click
  btn.addEventListener("click", (e) => {
    if (isDesktop()) return;
    e.preventDefault();
    e.stopPropagation();
    dd.classList.toggle("open");
  });

  // Click fuera: cerrar
  document.addEventListener("click", (e) => {
    if (!dd.contains(e.target)) dd.classList.remove("open");
  });

  // ESC: cerrar
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") dd.classList.remove("open");
  });
}









document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".tarjetas-toggle");
  if (!toggle) return;

  const BONUS_YEARLY = 0.15; // +15% tokens en anual

  const buttons = Array.from(toggle.querySelectorAll(".tarjetas-toggle__btn"));
  const glider = toggle.querySelector(".tarjetas-toggle__glider");

  const priceEls = Array.from(document.querySelectorAll(".tarjetas-amt"));
  const periodEls = Array.from(document.querySelectorAll(".tarjetas-period, .bc-period"));

  const tokenEls = Array.from(document.querySelectorAll(".tarjetas-tokens"));
  const tokenLbls = Array.from(document.querySelectorAll(".tarjetas-tokens-label"));

  function moveGlider(mode, animate = true) {
    const activeBtn = toggle.querySelector(`.tarjetas-toggle__btn[data-billing="${mode}"]`);
    if (!activeBtn || !glider) return;

    const toggleRect = toggle.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const padLeft = parseFloat(getComputedStyle(toggle).paddingLeft) || 0;
    const x = (btnRect.left - toggleRect.left) - padLeft;

    if (!animate) glider.style.transition = "none";
    glider.style.width = `${btnRect.width}px`;
    glider.style.transform = `translateX(${x}px)`;
    if (!animate) {
      glider.getBoundingClientRect();
      glider.style.transition = "";
    }
  }

  function formatNumber(n) {
    return Number.isFinite(n) ? n.toLocaleString("en-US") : String(n);
  }

  function setSavingsBadges(mode) {
    priceEls.forEach(el => {
      const card = el.closest(".tarjetas-card2");
      if (!card) return;

      const badge = card.querySelector(".tarjetas-save");
      if (!badge) return;

      const m = Number(el.dataset.priceMonthly);
      const y = Number(el.dataset.priceYearly);

      if (!Number.isFinite(m) || !Number.isFinite(y) || (m === 0 && y === 0)) {
        badge.style.display = "none";
        return;
      }

      if (mode !== "yearly") {
        badge.style.display = "none";
        return;
      }

      const saved = (m * 12) - y;
      if (!Number.isFinite(saved) || saved <= 0) {
        badge.style.display = "none";
        return;
      }

      badge.textContent = `Ahorra $${formatNumber(Math.round(saved))}`;
      badge.style.display = "inline-flex";
    });
  }

  function setTokens(mode) {
    tokenEls.forEach(el => {
      const baseMonthly = Number(String(el.dataset.tokensMonthly || "").replace(/[^\d]/g, ""));
      if (!Number.isFinite(baseMonthly)) return;

      if (mode === "yearly") {
        const yearly = Math.round(baseMonthly * 12 * (1 + BONUS_YEARLY));
        el.textContent = formatNumber(yearly);
      } else {
        el.textContent = formatNumber(baseMonthly);
      }
    });

    tokenLbls.forEach(lbl => {
      lbl.textContent = (mode === "yearly") ? "tokens/año" : "tokens/mes";
    });
  }

  function setBilling(mode, animate = true) {
    buttons.forEach(b => b.classList.toggle("is-active", b.dataset.billing === mode));

    // precios
    priceEls.forEach(el => {
      const raw = mode === "yearly" ? el.dataset.priceYearly : el.dataset.priceMonthly;
      if (raw == null) return;
      const n = Number(raw);
      el.textContent = Number.isFinite(n) ? n.toLocaleString("en-US") : raw;
    });

    // /mes o /año
    periodEls.forEach(p => (p.textContent = mode === "yearly" ? "año" : "mes"));

    // tokens (mensual vs anual +15%)
    setTokens(mode);

    // ahorro badges
    setSavingsBadges(mode);

    // glider
    moveGlider(mode, animate);
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => setBilling(btn.dataset.billing, true));
  });

  const initial = toggle.querySelector(".tarjetas-toggle__btn.is-active")?.dataset.billing || "monthly";
  setBilling(initial, false);

  window.addEventListener("resize", () => {
    const active = toggle.querySelector(".tarjetas-toggle__btn.is-active")?.dataset.billing || "monthly";
    moveGlider(active, false);
  });
});




/* ============================
   BANNER DINÁMICO POR IDIOMA
============================ */
const ctaPlaceholder = document.getElementById("banner-placeholder");

if (ctaPlaceholder) {
  // 1. Detectar idioma: Primero mira localStorage, si no, mira el atributo lang de <html>
  const currentLang = localStorage.getItem("language") || document.documentElement.lang || "es";

  // 2. Definir qué archivo cargar
  // Si el idioma es "en", carga banner-en.html, de lo contrario banner.html (español)
  const fileName = (currentLang === "en") ? "banner-en.html" : "banner.html";

  // 3. Cargar el componente
  fetch(`/components/${fileName}`)
    .then(r => {
      if (!r.ok) throw new Error("Archivo no encontrado");
      return r.text();
    })
    .then(html => {
      ctaPlaceholder.innerHTML = html;
    })
    .catch(err => console.error("Error cargando el banner:", err));
}






/* ============================
   REVIEWS
============================ */


(function () {
  const track = document.getElementById("bcReviewsTrack");
  if (!track) return;

  const cards = Array.from(track.querySelectorAll(".bc-review"));
  const dots = Array.from(document.querySelectorAll(".bc-dot"));
  let idx = 1; // center por defecto (card 2)

  function applyClasses() {
    cards.forEach(c => c.classList.remove("bc-review--left", "bc-review--active", "bc-review--right"));
    const left = (idx + cards.length - 1) % cards.length;
    const right = (idx + 1) % cards.length;

    cards[left].classList.add("bc-review--left");
    cards[idx].classList.add("bc-review--active");
    cards[right].classList.add("bc-review--right");

    dots.forEach(d => d.classList.remove("is-active"));
    (dots[idx] || dots[0])?.classList.add("is-active");
  }

  function go(to) {
    idx = (to + cards.length) % cards.length;
    applyClasses();
  }

  // dots click
  dots.forEach(d => {
    d.addEventListener("click", () => {
      const to = Number(d.getAttribute("data-go") || "0");
      go(to);
      restart();
    });
  });

  // auto
  let timer = null;
  function start() {
    stop();
    timer = setInterval(() => go(idx + 1), 2900);
  }
  function stop() { if (timer) clearInterval(timer); timer = null; }
  function restart() { start(); }

  // pause on hover
  const stage = track.closest(".bc-reviews__stage");
  stage?.addEventListener("mouseenter", stop);
  stage?.addEventListener("mouseleave", start);

  // swipe (touch)
  let x0 = null;
  stage?.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  stage?.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const x1 = (e.changedTouches[0] || {}).clientX;
    const dx = x1 - x0;
    x0 = null;
    if (Math.abs(dx) < 30) return;
    go(idx + (dx < 0 ? 1 : -1));
    restart();
  });

  // init
  applyClasses();
  start();
})();

/* ============================
   NEWSLETTER FORM FOOTER
============================ */
// Newsletter Google Forms - BankClasifAI
function handleNewsletterSubmit(form) {
  const msg = form.querySelector(".newsletter-msg");
  const privacyCheckbox = form.querySelector(".newsletter-privacy");
  const privacyHidden = form.querySelector(".privacy-value");
  const btn = form.querySelector(".btn-subscribe");

  // Activa/desactiva el hidden del consentimiento para que Google Forms reciba el valor
  if (privacyHidden) privacyHidden.disabled = !privacyCheckbox?.checked;

  // Si no está checked, no enviamos
  if (!privacyCheckbox?.checked) {
    alert("Debes aceptar la Política de Privacidad para suscribirte.");
    return false;
  }

  // UX: bloquear botón y mostrar mensaje
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.8";
    btn.style.cursor = "not-allowed";
  }

  if (msg) {
    msg.style.display = "block";
    msg.style.marginTop = "10px";
    msg.style.fontSize = "13px";
    msg.style.color = "rgba(255,255,255,.8)";
  }

  // Google Forms responde en el iframe; reseteamos sin esperar respuesta (por CORS)
  setTimeout(() => form.reset(), 800);

  // re-habilitar botón
  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = "";
      btn.style.cursor = "";
    }
    if (msg) msg.style.display = "none";
  }, 6000);

  // true => deja que el form haga submit al iframe
  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  // Asegura el año en footer
  document.querySelectorAll(".js-year").forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // (Opcional) Mantener sincronizado el hidden de privacidad al cambiar el checkbox
  document.querySelectorAll(".newsletter-form").forEach(form => {
    const privacyCheckbox = form.querySelector(".newsletter-privacy");
    const privacyHidden = form.querySelector(".privacy-value");
    if (!privacyCheckbox || !privacyHidden) return;

    privacyCheckbox.addEventListener("change", () => {
      privacyHidden.disabled = !privacyCheckbox.checked;
    });
  });
});



/* ============================
   CHAT
============================ */
/* ============================
   BankClasifAI – CHATBOT
============================ */

function initBankClasifAIChatbot(){

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
    return;
  }

  // ---------- CONFIG ----------
  const STORAGE_KEY = "bc_chat_history_v1";
  const MAX_HISTORY = 12;

  let history = loadHistory();
  let uiLang = "es";

  // ---------- PANEL ----------
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

  // ---------- UTILS ----------
  function scrollChatToBottom(smooth = true){
    elMsgs.scrollTo({
      top: elMsgs.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    });
  }

  function escapeHTML(str){
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderSimpleMarkdown(text){
  let html = escapeHTML(text);

  // **bold**
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // saltos de línea
  html = html.replace(/\n/g, "<br>");

  // líneas que empiezan con "- " => viñetas básicas
  html = html.replace(/(^|<br>)-\s+/g, "$1• ");

  return html;
}

function addMsg(role, text){
  const div = document.createElement("div");
  div.className = `bc-msg ${role}`;
  div.innerHTML = renderSimpleMarkdown(text);
  elMsgs.appendChild(div);
  scrollChatToBottom(false);
}


  function hideQuickReplies(){
    if (elQuick) elQuick.style.display = "none";
  }

  // ---------- STORAGE ----------
  function saveHistory(){
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(history.slice(-MAX_HISTORY))
    );
  }

  function loadHistory(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch{
      return [];
    }
  }

  // ---------- HISTORY ----------
  function renderHistory(){
    elMsgs.innerHTML = "";
    if (history.length === 0){
      addMsg("bot", "Hi! / ¡Hola! How can I help you?");
    } else {
      history.forEach(m => addMsg(m.role, m.content));
      hideQuickReplies();
    }
  }

  renderHistory();

  // ---------- QUICK REPLIES ----------
  const quick = [
    { es: "¿Cómo funciona BankClasifAI?", en: "How does BankClasifAI work?" },
    { es: "¿Convierten PDF a Excel?", en: "Do you convert PDF to Excel?" },
    { es: "Precios y prueba gratis", en: "Pricing and free trial" },
  ];

  function guessLang(text){
    const t = (text || "").toLowerCase();
    if (/[ñáéíóúü]/.test(t) || /\b(hola|precio|prueba|banco|extracto)\b/.test(t)) {
      return "es";
    }
    return "en";
  }

  function renderQuick(){
    if (!elQuick) return;
    elQuick.innerHTML = "";

    quick.forEach(q => {
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

  renderQuick();

  // Ocultar quick replies cuando escriben
  elInput.addEventListener("input", () => {
    if (elInput.value.trim().length > 0) hideQuickReplies();
  });

  // ---------- API ----------
  async function askAI(messages){
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }
    return data.reply;
  }

  // ---------- SUBMIT ----------
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

    addMsg("bot", "…");
    const loadingNode = elMsgs.lastChild;

    try{
      const clipped = history.slice(-MAX_HISTORY);
      const reply = await askAI(clipped);

      loadingNode.textContent = reply;
      history.push({ role: "assistant", content: reply });
      saveHistory();
    }catch(err){
      console.error("[Chatbot] Error:", err);
      loadingNode.textContent =
        uiLang === "es"
          ? "Hubo un error conectando con la IA. Intenta de nuevo."
          : "There was an error connecting to AI. Please try again.";
    }

    requestAnimationFrame(() => scrollChatToBottom());
  });
}

/* 👉 EXPONER FUNCIÓN GLOBAL */
window.initBankClasifAIChatbot = initBankClasifAIChatbot;
