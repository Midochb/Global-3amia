/* =========================================================
   [CONTRIB-1] CONFIG
   ========================================================= */

// ✅ Mets TON URL Apps Script ici (le nouveau)
const API_URL = "https://script.google.com/macros/s/AKfycbxjmksJSupiO3d9CwO5GrXzqmTjEkb9NtN2bsHRqO3zvhtkqqIb9Fwx3ggJBx6s9vno/exec";
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
    subtitle: "Ajoute ton mot",
    title: "Proposer un mot",
    hint: "Astuce : si plusieurs sens, sépare avec des virgules (ex : beaucoup, énormément, vachement).",
    word_lab: "Mot (arabe)",
    word_ph: "اكتب الكلمة هنا",
    phon_lab: "Phonétique (suggestion auto)",
    phon_ph: "ex : 7iit / hiit",
    fr_lab: "Traduction (FR)",
    fr_ph: "ex : beaucoup, énormément, vachement",
    ex_lab: "Exemple",
    ex_ph: "ex : أنا لوّاج على خدمة",
    dialect_lab: "Dialecte / pays",
    city_lab: "Ville / région",
    city_ph: "ex : Zarzis, Casablanca...",
    user_lab: "Ton nom / ID (optionnel)",
    user_ph: "ex : Mehdi, @zeedna...",
    send: "Envoyer",
    tr_help_link: "Comment lire la translittération ?"
  },
  en: {
    subtitle: "Add your word",
    title: "Suggest a word",
    hint: "Tip: if there are multiple meanings, separate with commas (e.g., a lot, very much, tons).",
    word_lab: "Word (Arabic)",
    word_ph: "Type the word here",
    phon_lab: "Phonetic (auto suggestion)",
    phon_ph: "e.g. 7iit / hiit",
    fr_lab: "Meaning (French)",
    fr_ph: "e.g., beaucoup, énormément, vachement",
    ex_lab: "Example",
    ex_ph: "e.g., أنا لوّاج على خدمة",
    dialect_lab: "Dialect / country",
    city_lab: "City / region",
    city_ph: "e.g., Zarzis, Casablanca...",
    user_lab: "Your name / ID (optional)",
    user_ph: "e.g., Mehdi, @zeedna...",
    send: "Send",
    tr_help_link: "How to read transliteration?"
  },
  ar: {
    subtitle: "المساهمة",
    title: "اقترح كلمة",
    hint: "ملاحظة: إذا كانت هناك عدة معانٍ، افصل بينها بفواصل (مثال: كثير، جدًا، بزّاف).",
    word_lab: "الكلمة (بالعربية)",
    word_ph: "اكتب الكلمة هنا",
    phon_lab: "النطق (اقتراح تلقائي)",
    phon_ph: "مثال: 7iit / hiit",
    fr_lab: "المعنى بالفرنسية",
    fr_ph: "مثال: beaucoup, énormément, vachement",
    ex_lab: "مثال",
    ex_ph: "مثال: أنا لوّاج على خدمة",
    dialect_lab: "اللهجة / البلد",
    city_lab: "المدينة / المنطقة",
    city_ph: "مثال: زرڨيس، الدار البيضاء…",
    user_lab: "اسمك / معرّفك (اختياري)",
    user_ph: "مثال: Mehdi، @zeedna...",
    send: "إرسال",
    tr_help_link: "كيف نقرأ النقل الصوتي؟"
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
  const labPhon = document.getElementById("t_phon_lab");
  const labFr = document.getElementById("t_trad_fr_lab");
  const labEx = document.getElementById("t_example_lab");
  const labDialect = document.getElementById("t_dialect_lab");
  const labCity = document.getElementById("t_city_lab");
  const labUser = document.getElementById("t_user_id_lab");

  if(elSubtitle) elSubtitle.textContent = t.subtitle;
  if(elTitle) elTitle.textContent = t.title;
  if(elHint) elHint.textContent = t.hint;

  if(labWord) labWord.textContent = t.word_lab;
  if(labPhon) labPhon.textContent = t.phon_lab;
  if(labFr) labFr.textContent = t.fr_lab;
  if(labEx) labEx.textContent = t.ex_lab;
  if(labDialect) labDialect.textContent = t.dialect_lab;
  if(labCity) labCity.textContent = t.city_lab;
  if(labUser) labUser.textContent = t.user_lab;


  // transliteration help link
  const trHelp = document.querySelector("[data-i18n=\"c_tr_help_link\"]");
  if(trHelp) trHelp.textContent = t.tr_help_link;

  // placeholders
  if(wordArEl) wordArEl.setAttribute("placeholder", t.word_ph);
  if(phoneticEl) phoneticEl.setAttribute("placeholder", t.phon_ph);
  if(tradFrEl) tradFrEl.setAttribute("placeholder", t.fr_ph);
  if(exampleEl) exampleEl.setAttribute("placeholder", t.ex_ph);
  if(cityEl) cityEl.setAttribute("placeholder", t.city_ph);
  const userIdEl = document.getElementById("user_id");
  if(userIdEl) userIdEl.setAttribute("placeholder", t.user_ph);

  // button text
  if(submitBtn) submitBtn.textContent = t.send;

  // html lang + direction
  document.documentElement.setAttribute("lang", lang);
  if(lang === "ar"){
    document.body.setAttribute("dir", "rtl");
  } else {
    document.body.removeAttribute("dir");
  }
    // --- Translate select options labels (keep values like TN/MA/...)
  const COUNTRY_LABELS = {
    fr: {
      "": "—",
      TN: "🇹🇳 Tunisie",
      MA: "🇲🇦 Maroc",
      DZ: "🇩🇿 Algérie",
      LY: "🇱🇾 Libye",
      EG: "🇪🇬 Égypte",
      LB: "🇱🇧 Liban",
      SA: "🇸🇦 Arabie Saoudite",
      IQ: "🇮🇶 Irak",
      SD: "🇸🇩 Soudan"
    },
    en: {
      "": "—",
      TN: "🇹🇳 Tunisia",
      MA: "🇲🇦 Morocco",
      DZ: "🇩🇿 Algeria",
      LY: "🇱🇾 Libya",
      EG: "🇪🇬 Egypt",
      LB: "🇱🇧 Lebanon",
      SA: "🇸🇦 Saudi Arabia",
      IQ: "🇮🇶 Iraq",
      SD: "🇸🇩 Sudan"
    },
    ar: {
      "": "—",
      TN: "🇹🇳 تونس",
      MA: "🇲🇦 المغرب",
      DZ: "🇩🇿 الجزائر",
      LY: "🇱🇾 ليبيا",
      EG: "🇪🇬 مصر",
      LB: "🇱🇧 لبنان",
      SA: "🇸🇦 السعودية",
      IQ: "🇮🇶 العراق",
      SD: "🇸🇩 السودان"
    }
  };

  if (dialectEl) {
    const lang = getBrowserLang();
    const map = COUNTRY_LABELS[lang] || COUNTRY_LABELS.fr;

    Array.from(dialectEl.options).forEach(opt => {
      const v = (opt.value || "").toUpperCase();
      if (map[v] !== undefined) opt.textContent = map[v];
    });
  }
}

/* =========================================================
   AUTO-SUGGEST PHONETIC (very simple)
   - Generates an editable "arabizi" suggestion from Arabic input
   - Not perfect (Arabic vowels are ambiguous) but fast + practical
   ========================================================= */

function stripArabicDiacritics(s){
  return (s || "")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "") // harakat + Quran marks
    .replace(/\u0640/g, ""); // tatweel
}

function isArabicVowelLike(ch){
  return ch === "ا" || ch === "و" || ch === "ي" || ch === "ى" || ch === "ة" || ch === "ه";
}

function suggestPhonetic(ar){
  const s = stripArabicDiacritics(ar).trim();
  if(!s) return "";

  const MAP = {
    "ا":"a","أ":"a","إ":"i","آ":"aa","ٱ":"a",
    "ب":"b","ت":"t","ث":"th","ج":"j","ح":"7","خ":"5",
    "د":"d","ذ":"dh","ر":"r","ز":"z","س":"s","ش":"ch",
    "ص":"s","ض":"dh","ط":"t","ظ":"dh","ع":"3","غ":"gh",
    "ف":"f","ق":"9","ك":"k","ل":"l","م":"m","ن":"n",
    "ه":"h","ة":"a","و":"w","ي":"y","ى":"a",
    "ء":"'","ؤ":"w","ئ":"y",
    "ﻻ":"la","لا":"la"
  };

  let out = "";
  let last = "";

  for(let i=0;i<s.length;i++){
    const ch = s[i];
    const next = s[i+1] || "";

    // shadda -> double previous
    if(ch === "ّ"){
      if(last) out += last;
      continue;
    }

    // spaces/punct
    if(/\s/.test(ch)) { out += " "; last = ""; continue; }

    if(ch === "ي"){
      // heuristic: between consonants or at end => long "ii"
      if(!next || !isArabicVowelLike(next)) {
        out += "ii";
        last = "i";
      } else {
        out += "i";
        last = "i";
      }
      continue;
    }

    if(ch === "و"){
      // heuristic: before consonant/end => "ou", else "w"
      if(!next || !isArabicVowelLike(next)) {
        out += "ou";
        last = "u";
      } else {
        out += "w";
        last = "w";
      }
      continue;
    }

    const mapped = MAP[ch];
    if(mapped){
      out += mapped;
      last = mapped.slice(-1);
    } else {
      out += ch;
      last = "";
    }
  }

  return out.replace(/\s+/g," ").trim();
}


function suggestArabicFromPhonetic(ph){
  const raw = (ph || "").toLowerCase().trim();
  if (!raw) return "";

  let s = raw
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9' \-]/g, "");

  const DIGRAPHS = {
    ch: "ش",
    sh: "ش",
    kh: "خ",
    gh: "غ",
    th: "ث",
    dh: "ذ"
  };

  const SINGLE = {
    b: "ب",
    t: "ت",
    j: "ج",
    d: "د",
    r: "ر",
    z: "ز",
    s: "س",
    f: "ف",
    q: "ق",
    k: "ك",
    c: "ك",
    l: "ل",
    m: "م",
    n: "ن",
    h: "ه",
    w: "و",
    y: "ي",
    g: "گ",
    p: "پ",
    v: "ڤ",
    x: "كس"
  };

  let out = "";
  for (let i = 0; i < s.length; ) {
    const ch = s[i];

    if (ch === " ") {
      out += " ";
      i += 1;
      continue;
    }

    // numbers used in arabizi
    if (ch === "3") { out += "ع"; i += 1; continue; }
    if (ch === "7") { out += "ح"; i += 1; continue; }
    if (ch === "5") { out += "خ"; i += 1; continue; }
    if (ch === "9") { out += "ق"; i += 1; continue; }

    // long vowels
    const two = s.slice(i, i + 2);
    if (two === "aa") { out += "ا"; i += 2; continue; }
    if (two === "ii") { out += "ي"; i += 2; continue; }
    if (two === "ou" || two === "oo" || two === "uu") { out += "و"; i += 2; continue; }

    // digraphs
    if (DIGRAPHS[two]) {
      out += DIGRAPHS[two];
      i += 2;
      continue;
    }

    // apostrophe / hamza
    if (ch === "'") {
      out += "ء";
      i += 1;
      continue;
    }

    // short vowels: keep very light heuristic (initial vowel => ا)
    if ("aeiou".includes(ch)) {
      const prev = out.slice(-1);
      if (!out || prev === " ") out += "ا";
      i += 1;
      continue;
    }

    if (SINGLE[ch]) {
      out += SINGLE[ch];
      i += 1;
      continue;
    }

    // fallback
    out += ch;
    i += 1;
  }

  return out.replace(/\s+/g, " ").trim();
}

function initPhoneticAutosuggest(){
  if(!wordArEl || !phoneticEl) return;

  let dirtyAr = false;
  let dirtyPh = false;
  let internal = false;

  const syncFromAr = () => {
    const ar = (wordArEl.value || "").trim();
    if(!ar) return;

    const current = (phoneticEl.value || "").trim();
    if(dirtyPh && current) return;

    internal = true;
    phoneticEl.value = suggestPhonetic(ar);
    internal = false;
  };

  const syncFromPh = () => {
    const ph = (phoneticEl.value || "").trim();
    if(!ph) return;

    const current = (wordArEl.value || "").trim();
    if(dirtyAr && current) return;

    internal = true;
    wordArEl.value = suggestArabicFromPhonetic(ph);
    internal = false;
  };

  wordArEl.addEventListener("input", () => {
    if(internal) return;
    dirtyAr = true;
    syncFromAr();
  });

  phoneticEl.addEventListener("input", () => {
    if(internal) return;
    dirtyPh = true;
    syncFromPh();
  });

  wordArEl.addEventListener("blur", syncFromAr);
  phoneticEl.addEventListener("blur", syncFromPh);

  // initial sync
  if((wordArEl.value || "").trim() && !(phoneticEl.value || "").trim()) syncFromAr();
  if((phoneticEl.value || "").trim() && !(wordArEl.value || "").trim()) syncFromPh();
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
const phoneticEl = document.getElementById("phonetic");
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
   [CONTRIB-5] HOME CLICK (logo -> home)
   ========================================================= */

function initHomeClick() {
  const homeBtn = document.getElementById("homeBtn");
  if (!homeBtn) return;

  const goHome = () => {
    window.location.href = "/recherche";
  };

  // clic souris
  homeBtn.addEventListener("click", goHome);

  // accessibilité clavier (Enter / Space)
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

  // =====================
  // TRACEABILITE / ACK
  // =====================
  // Objectif : avoir une preuve côté front que Google a bien reçu,
  // et afficher un ID de contribution.
  // -> nécessite un Apps Script qui répond via postMessage (voir /apps-script/Code.gs)

  let ackTimer = null;
  let awaitingAck = false;

  function finishOk(receipt) {
    awaitingAck = false;
    if (ackTimer) clearTimeout(ackTimer);
    ackTimer = null;

    form.dataset.sending = "";
    disableSubmit(false);

    // Message + receipt
    if (receipt?.id) {
      setMsg(`✅ Envoyé. ID : ${receipt.id}`, "success");
      try {
        const k = "zeedna_last_receipts";
        const prev = JSON.parse(localStorage.getItem(k) || "[]");
        prev.unshift({ id: receipt.id, at: receipt.at || new Date().toISOString() });
        localStorage.setItem(k, JSON.stringify(prev.slice(0, 20)));
      } catch (e) {}
    } else {
      setMsg("✅ Envoyé.", "success");
    }

    try { form.reset(); } catch (e) {}
  }

  function finishErr(msg) {
    awaitingAck = false;
    if (ackTimer) clearTimeout(ackTimer);
    ackTimer = null;

    form.dataset.sending = "";
    disableSubmit(false);
    setMsg(msg || "❌ Erreur lors de l’envoi.", "error");
  }

  // Réception de l'ACK du serveur (Apps Script renvoie une page HTML dans l'iframe)
  window.addEventListener("message", (ev) => {
    // On accepte uniquement les messages de Google Apps Script
    const origin = (ev.origin || "").toLowerCase();
    const okOrigin = origin.includes("script.google.com") || origin.includes("googleusercontent.com");
    if (!okOrigin) return;

    const data = ev.data || {};
    if (!awaitingAck) return;

    if (data && data.type === "zeedna_contrib") {
      if (data.ok) finishOk({ id: data.id, at: data.at });
      else finishErr(data.error || "❌ Envoi refusé.");
    }
  });

  // Fallback : si l'iframe charge mais qu'on n'a pas de postMessage (ancien script)
  if (iframe) {
    iframe.addEventListener("load", () => {
      if (!awaitingAck) return;
      // L'iframe a chargé : on considère que c'est probablement reçu,
      // mais on prévient l'utilisateur que l'ID n'a pas été confirmé.
      finishOk(null);
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
    let w = (wordArEl?.value || "").trim();
    const ph = (phoneticEl?.value || "").trim();
    const fr = (tradFrEl?.value || "").trim();
    const ex = (exampleEl?.value || "").trim();
    const d = (dialectEl?.value || "").trim();
    const c = (cityEl?.value || "").trim();

    // If user filled only one of Arabic/phonetic, auto-suggest the other
    if (!w && ph) {
      try { wordArEl.value = suggestArabicFromPhonetic(ph); } catch (e) {}
      w = (wordArEl.value || "").trim();
    }
    if (!ph && w) {
      try { phoneticEl.value = suggestPhonetic(w); } catch (e) {}
    }

    // Require at least one of Arabic or phonetic + other mandatory fields
    if ((!w && !ph) || !fr || !ex || !d || !c) {
      e.preventDefault();
      setMsg("⚠️ Remplis au moins le mot en arabe OU sa phonétique, puis les autres champs.", "error");
      return;
    }

    // UI state
    setMsg("⏳ Envoi…", "info");
    disableSubmit(true);

    // marqueur + ACK
    form.dataset.sending = "1";
    awaitingAck = true;
    if (ackTimer) clearTimeout(ackTimer);
    ackTimer = setTimeout(() => {
      // Si rien n'est revenu, on ne sait pas où c'est tombé.
      // On garde la possibilité de retry.
      awaitingAck = false;
      form.dataset.sending = "";
      disableSubmit(false);
      setMsg("⚠️ Envoi non confirmé. Vérifie ta connexion et réessaie.", "error");
    }, 12000);

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
initPhoneticAutosuggest();
initSubmit();
