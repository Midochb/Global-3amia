/* =========================================================
   [CONTRIB-1] CONFIG
   ========================================================= */

// ✅ Mets TON URL Apps Script ici (le nouveau)
const API_URL = "https://script.google.com/macros/s/AKfycbzcmKMgG60WxkU52UzO3CsMOd6Ncq5KHO979GDifZgqf7YcUukdkeDOARraVkreFW-i/exec";

/* =========================================================
   [CONTRIB-2] DOM
   ========================================================= */

const form = document.getElementById("contribForm");
const iframe = document.getElementById("hidden_iframe");

const msgEl = document.getElementById("msg");
const submitBtn = document.getElementById("submitBtn");

const homeBtn = document.getElementById("homeBtn");
const themeBtn = document.getElementById("themeToggle");

// fields
const websiteEl = document.getElementById("website");
const wordArEl = document.getElementById("word_ar");
const tradFrEl = document.getElementById("trad_fr");
const exampleEl = document.getElementById("example");
const dialectEl = document.getElementById("dialect");
const cityEl = document.getElementById("city");

/* =========================================================
   [CONTRIB-3] HELPERS
   ========================================================= */

function setMsg(text, type = "info") {
  if (!msgEl) return;
  msgEl.textContent = text || "";
  msgEl.style.color = (type === "error") ? "var(--danger, #ff6b6b)"
                : (type === "success") ? "var(--ok, #5cffb1)"
                : "";
}

function disableSubmit(on) {
  if (!submitBtn) return;
  submitBtn.disabled = !!on;
  submitBtn.style.opacity = on ? "0.7" : "1";
  submitBtn.style.pointerEvents = on ? "none" : "auto";
}

function getQueryParam(name) {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  } catch (e) {
    return null;
  }
}

/* =========================================================
   [CONTRIB-4] THEME (Light/Dark) - même logique que la home
   ========================================================= */

function applyTheme(mode) {
  document.body.setAttribute("data-theme", mode);
  try { localStorage.setItem("zeedna_theme", mode); } catch (e) {}
}

function initThemeToggle() {
  if (!themeBtn) return;

  let saved = "dark";
  try { saved = localStorage.getItem("zeedna_theme") || "dark"; } catch (e) {}
  if (saved !== "light") saved = "dark";

  applyTheme(saved);
  themeBtn.textContent = (saved === "light") ? "☀️" : "🌙";

  themeBtn.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "dark";
    const next = (current === "light") ? "dark" : "light";
    applyTheme(next);
    themeBtn.textContent = (next === "light") ? "☀️" : "🌙";
  });
}

/* =========================================================
   [CONTRIB-5] HOME CLICK
   ========================================================= */

function initHomeClick() {
  if (!homeBtn) return;
  const goHome = () => { window.location.href = "/"; };

  homeBtn.addEventListener("click", goHome);
  homeBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goHome();
    }
  });
}

/* =========================================================
   [CONTRIB-6] PREFILL (optionnel)
   ========================================================= */

function initPrefill() {
  // Exemple: /contribuer/?pays=TN
  const pays = (getQueryParam("pays") || "").toUpperCase().trim();
  if (pays && dialectEl) {
    const opt = Array.from(dialectEl.options).find(o => (o.value || "").toUpperCase() === pays);
    if (opt) dialectEl.value = opt.value;
  }
}

/* =========================================================
   [CONTRIB-7] SUBMIT (POST -> iframe)
   ========================================================= */

function initSubmit() {
  if (!form) return;

  // ✅ Zéro CORS : on envoie comme un vrai form HTML
  form.action = API_URL;

  // Quand l’iframe charge, c’est que Google a répondu
  // (on ne lit pas la réponse, mais on sait que c’est parti)
  if (iframe) {
    iframe.addEventListener("load", () => {
      // Si on était en train d'envoyer
      if (!form.dataset.sending) return;

      form.dataset.sending = "";
      disableSubmit(false);

      // reset + message
      setMsg("✅ Merci ! Contribution envoyée.", "success");
      try { form.reset(); } catch (e) {}
    });
  }

  form.addEventListener("submit", (e) => {
    // Anti-spam: si le bot remplit website => stop
    const honey = (websiteEl?.value || "").trim();
    if (honey) {
      e.preventDefault();
      setMsg("Spam détecté.", "error");
      return;
    }

    // Petite validation user-side (en plus des required)
    const w = (wordArEl?.value || "").trim();
    const fr = (tradFrEl?.value || "").trim();
    const ex = (exampleEl?.value || "").trim();
    const d = (dialectEl?.value || "").trim();
    const c = (cityEl?.value || "").trim();

    if (!w || !fr || !ex || !d || !c) {
      e.preventDefault();
      setMsg("⚠️ Remplis tous les champs avant d’envoyer.", "error");
      return;
    }

    // UI state
    setMsg("⏳ Envoi…", "info");
    disableSubmit(true);

    // marqueur pour l’event load
    form.dataset.sending = "1";

    // ✅ on laisse le submit normal partir (POST -> iframe)
    // pas de fetch => pas de CORS
  });
}

/* =========================================================
   [CONTRIB-8] START
   ========================================================= */

initThemeToggle();
initHomeClick();
initPrefill();
initSubmit();