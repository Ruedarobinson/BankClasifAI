(function () {
  // Eliminamos la clave de storage para que no haya restricciones
  const OPEN_DELAY_MS = 800;

  function initPromoModal(modal) {
    // IMPORTANTE: Mantenemos el dataset.ready para evitar que el 
    // MutationObserver lo intente abrir varias veces en la misma carga de página.
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

    // Se ejecuta siempre después del delay
    setTimeout(openModal, OPEN_DELAY_MS);

    // Eventos de cierre
    closeBtn?.addEventListener("click", closeModal);
    
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
  }

  function tryFindAndInit() {
    const modal = document.getElementById("promo-modal-2026");
    if (modal) {
      initPromoModal(modal);
      return true;
    }
    return false;
  }

  // 1) Intentar si ya está en el HTML
  if (tryFindAndInit()) return;

  // 2) Si se carga después (dinámicamente), lo detectamos aquí
  const observer = new MutationObserver((mutations, obs) => {
    if (tryFindAndInit()) {
      obs.disconnect(); 
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();