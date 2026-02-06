const elQuick = document.getElementById("quickReplies");

const quick = [
  { es: "¿Convierten PDFs a Excel/CSV?", en: "Do you convert PDFs to Excel/CSV?" },
  { es: "¿Soportan bancos locales?", en: "Do you support local banks?" },
];

function getLangFromText(text){
  // súper simple: si detecta caracteres/stopwords comunes, asume ES; si no, EN.
  // (Puedes dejar que la IA decida igualmente; esto es solo para quick replies.)
  const t = (text||"").toLowerCase();
  if (/[ñáéíóúü]/.test(t) || /\b(hola|gracias|quiero|necesito|banco)\b/.test(t)) return "es";
  return "en";
}

let uiLang = "en"; // se ajusta cuando el usuario escriba

function renderQuick(){
  elQuick.innerHTML = "";
  quick.forEach(q => {
    const b = document.createElement("button");
    b.className = "quick-reply";
    b.type = "button";
    b.textContent = q[uiLang];
    b.onclick = () => {
      document.getElementById("ai-input").value = q[uiLang];
      document.getElementById("ai-form").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    };
    elQuick.appendChild(b);
  });
}

// llama renderQuick() al inicio
renderQuick();

// y cuando el usuario escriba, actualiza idioma de UI
// en tu submit handler, antes de mandar a IA:
uiLang = getLangFromText(text);
renderQuick();



const fab = document.getElementById("chatFab");
const panel = document.getElementById("ai-chat");
const closeBtn = document.getElementById("chatClose");

function openPanel(){
  panel.classList.remove("closed");
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
}
function closePanel(){
  panel.classList.remove("open");
  panel.classList.add("closed");
  panel.setAttribute("aria-hidden", "true");
}
function togglePanel(){
  if (panel.classList.contains("open")) closePanel();
  else openPanel();
}

fab.addEventListener("click", togglePanel);
closeBtn.addEventListener("click", closePanel);
