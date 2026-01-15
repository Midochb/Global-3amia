/* =========================================================
   [CONTRIB-1] CONFIG
   ========================================================= */

// ✅ Mets TON URL Apps Script ici (le nouveau)
const API_URL = "https://script.google.com/macros/s/AKfycbwvGUVxjP6vPy2MZYT7b4I3aqbDAU0aWJ6WluPlYP5R1GzF8peFGtSURn7KJX3v_mkw/exec";
/* =========================================================
   [CONTRIB-i18n] Language (Browser)
   ========================================================= */

function getBrowserLang(){
  const raw = (navigator.language || "fr").toLowerCase();
  if (raw.startsWith("ar")) return "ar";
  if (raw.startsWith("en")) return "en";
  return "fr";
}

const I18N_CONTRIB = {
  fr: {
    subtitle: "Contribuer",
    title: "Proposer un mot",
    hint: "Astuce : si plusieurs sens, sépare avec des virgules (ex : beaucoup, énormément, vachement).",
    word_lab: "Mot (arabe)",
    word_ph: "اكتب الكلمة هنا",
    fr_lab: "Traduction (FR)",
    fr_ph: "ex : beaucoup, énormément, vachement",
    ex_lab: "Exemple",
    ex_ph: "ex : أنا لوّاج على خدمة",
    dialect_lab: "Dialecte / pays",
    city_lab: "Ville / région",
    city_ph: "ex : Zarzis, Casablanca...",
    send: "Envoyer"
  },
  en: {
    subtitle: "Contribute",
    title: "Suggest a word",
    hint: "Tip: if there are multiple meanings, separate with commas (e.g., a lot, very much, tons).",
    word_lab: "Word (Arabic)",
    word_ph: "Type the word here",
    fr_lab: "Meaning (French)",
    fr_ph: "e.g., beaucoup, énormément, vachement",
    ex_lab: "Example",
    ex_ph: "e.g., أنا لوّاج على خدمة",
    dialect_lab: "Dialect / country",
    city_lab: "City / region",
    city_ph: "e.g., Zarzis, Casablanca...",
    send: "Send"
  },
  ar: {
    subtitle: "المساهمة",
    title: "اقترح كلمة",
    hint: "ملاحظة: إذا كانت هناك عدة معانٍ، افصل بينها بفواصل (مثال: كثير، جدًا، بزّاف).",
    word_lab: "الكلمة (بالعربية)",
    word_ph: "اكتب الكلمة هنا",
    fr_lab: "المعنى بالفرنسية",
    fr_ph: "مثال: beaucoup, énormément, vachement",
    ex_lab: "مثال",
    ex_ph: "مثال: أنا لوّاج على خدمة",
    dialect_lab: "اللهجة / البلد",
    city_lab: "المدينة / المنطقة",
    city_ph: "مثال: زرڨيس، الدار البيضاء…",
    send: "إرسال"
  }
};

function applyContribI18n(){
  const lang = getBrowserLang();
  const t = I18N_CONTRIB[lang] || I18N_CONTRIB.fr;

  // texts
  const elSubtitle = document.getElementById("t_subtitle");
  const elTitle = document.getElementById("t_title");
  const elHint = document.getElementById("t_hint");

  const labWord = document.getElementById("t_word_ar_lab");
  const labFr = document.getElementById("t_trad_fr_lab");
  const labEx = document.getElementById("t_example_lab");
  const labDialect = document.getElementById("t_dialect_lab");
  const labCity = document.getElementById("t_city_lab");

  if(elSubtitle) elSubtitle.textContent = t.subtitle;
  if(elTitle) elTitle.textContent = t.title;
  if(elHint) elHint.textContent = t.hint;

  if(labWord) labWord.textContent = t.word_lab;
  if(labFr) labFr.textContent = t.fr_lab;
  if(labEx) labEx.textContent = t.ex_lab;
  if(labDialect) labDialect.textContent = t.dialect_lab;
  if(labCity) labCity.textContent = t.city_lab;

  // placeholders
  if(wordArEl) wordArEl.setAttribute("placeholder", t.word_ph);
  if(tradFrEl) tradFrEl.setAttribute("placeholder", t.fr_ph);
  if(exampleEl) exampleEl.setAttribute("placeholder", t.ex_ph);
  if(cityEl) cityEl.setAttribute("placeholder", t.city_ph);

  // button text
  if(submitBtn) submitBtn.textContent = t.send;

  // html lang + direction
  document.documentElement.setAttribute("lang", lang);
  if(lang === "ar"){
    document.body.setAttribute("dir", "rtl");
  } else {
    document.body.removeAttribute("dir");
  }
}
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
applyContribI18n();
initThemeToggle();
initHomeClick();
initPrefill();
initSubmit();
