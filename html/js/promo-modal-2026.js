(function () {
  const STORAGE_KEY = "bc_promo_2026_seen"; // usa sessionStorage o localStorage según tu preferencia
  const OPEN_DELAY_MS = 800;

  function initPromoModal(modal) {
    // Evita inicializar 2 veces si el observer lo detecta varias veces
    if (modal.dataset.ready === "1") return;
    modal.dataset.ready = "1";

    const closeBtn = modal.querySelector(".bc-modal__close");

    function openModal() {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    // Mostrar al entrar (una sola vez por sesión)
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setTimeout(openModal, OPEN_DELAY_MS);
      sessionStorage.setItem(STORAGE_KEY, "1");
    }

    closeBtn && closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
  }

  function tryFindAndInit() {
    const modal = document.getElementById("promo-modal-2026");
    if (modal) initPromoModal(modal);
    return !!modal;
  }

  // 1) Intenta inmediatamente
  if (tryFindAndInit()) return;

  // 2) Si aún no existe (por include.js), obsérvalo
  const observer = new MutationObserver(() => {
    if (tryFindAndInit()) observer.disconnect();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
