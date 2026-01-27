/* =========================================================
   ZEEDNA 3AMIAT — WORD PAGE (mot)
   URL: /mot/?id=<slug>--<CC>
   ========================================================= */

// Keep same API as the rest of the site
const API_URL = "https://script.google.com/macros/s/AKfycbxRvetENGm215GS4OowKMa_BqHBi5CNEWOgzQ5k5D7UaaItvPHLj2N1tmCBjVB_WZN1/exec";

// Apps Script may return either an array OR a wrapper object (e.g. { ok:true, data:[...] }).
function unwrapArrayPayload(payload){
  if(Array.isArray(payload)) return payload;
  if(payload && typeof payload === "object"){
    if(Array.isArray(payload.data)) return payload.data;
    if(Array.isArray(payload.rows)) return payload.rows;
    if(Array.isArray(payload.items)) return payload.items;
    if(Array.isArray(payload.result)) return payload.result;

    // Some proxies serialize arrays as JSON strings
    const maybe = payload.data ?? payload.rows ?? payload.items ?? payload.result;
    if(typeof maybe === "string"){
      try {
        const parsed = JSON.parse(maybe);
        if(Array.isArray(parsed)) return parsed;
      } catch(e) {}
    }
  }
  return null;
}

// DOM
const wordStatusEl = document.getElementById("wordStatus");
const wordViewEl = document.getElementById("wordView");
const wordNotFoundEl = document.getElementById("wordNotFound");
const nfContribEl = document.getElementById("nfContrib");

const wArEl = document.getElementById("w_ar");
const wTrEl = document.getElementById("w_tr");
const wTradsEl = document.getElementById("w_trads");
const wKvEl = document.getElementById("w_kv");
const wSuggestEl = document.getElementById("w_suggest");

// Social/share header (optional)
const shareHeaderEl = document.getElementById("shareHeader");
const shareFlagEl = document.getElementById("shareFlag");
const shareIconEl = document.getElementById("shareIcon");
const shareDialectEl = document.getElementById("shareDialect");
const shareTitleEl = document.getElementById("shareTitle");
const shareSubtitleEl = document.getElementById("shareSubtitle");
const captureToggleEl = document.getElementById("captureToggle");

const themeBtn = document.getElementById("themeToggle");
const searchBtn = document.getElementById("searchBtn");

/* =====================
   THEME (same logic)
   ===================== */
function applyTheme(mode){
  document.body.setAttribute("data-theme", mode);
  try { localStorage.setItem("zeedna_theme", mode); } catch(e){}
}

function initThemeToggle(){
  if(!themeBtn) return;

  let saved = "dark";
  try { saved = localStorage.getItem("zeedna_theme") || "dark"; } catch(e){}
  if(saved !== "light") saved = "dark";

  applyTheme(saved);
  themeBtn.textContent = (saved === "light") ? "☀️" : "🌙";

  themeBtn.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "dark";
    const next = (current === "light") ? "dark" : "light";
    applyTheme(next);
    themeBtn.textContent = (next === "light") ? "☀️" : "🌙";
  });
}

if(searchBtn){
  const goSearch = () => { window.location.href = "/recherche/"; };
  searchBtn.addEventListener("click", goSearch);
  searchBtn.addEventListener("keydown", (e) => {
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      goSearch();
    }
  });
}

/* =====================
   i18n minimal (FR/EN/AR)
   ===================== */
const I18N = {
  fr: {
    loading: "Chargement…",
    not_found_title: "Mot introuvable",
    not_found_hint: "Ce mot n’est pas encore dans la base.",
    contribute_btn: "➕ Ajoute ton mot",
    tr_help_link: "📖 Guide phonétique",
    more: "Autres mots suggérés",
    kv_country: "Pays",
    kv_category: "Catégorie",
    kv_source: "Langue source",
    kv_origin: "Origine",
    kv_number: "Nombre",
    kv_desc: "Description",
    kv_example: "Exemple"
  },
  en: {
    loading: "Loading…",
    not_found_title: "Word not found",
    not_found_hint: "This word is not in the database yet.",
    contribute_btn: "➕ Add your word",
    tr_help_link: "📖 Phonetic guide",
    more: "More suggested words",
    kv_country: "Country",
    kv_category: "Category",
    kv_source: "Source language",
    kv_origin: "Origin",
    kv_number: "Number",
    kv_desc: "Description",
    kv_example: "Example"
  },
  ar: {
    loading: "جارٍ التحميل…",
    not_found_title: "الكلمة غير موجودة",
    not_found_hint: "هذه الكلمة غير متاحة بعد في قاعدة البيانات.",
    contribute_btn: "➕ أضف كلمتك",
    tr_help_link: "📖 دليل النطق",
    more: "كلمات مقترحة أخرى",
    kv_country: "البلد",
    kv_category: "الصنف",
    kv_source: "لغة الأصل",
    kv_origin: "الأصل",
    kv_number: "العدد",
    kv_desc: "الوصف",
    kv_example: "مثال"
  },

  nl: {
    ready: "Klaar",
    loading: "Laden…",
    ok: (n) => `OK — ${n} items`,
    error: "Laadfout (open console)",
    search_ph: "Zoek een woord (Arabisch, translit, NL, Klassiek Arabisch)...",
    search_btn: "Zoeken",
    all_dialects: "Alle dialecten",
    modal_close: "Sluiten",
    results_count: (n) => `${n} resultaat(en)` ,
    no_results: "Dit woord is nog niet beschikbaar",
    no_results_cta: "➕ Voeg het toe als bijdrage",
    add_word_btn: "➕ Voeg je woord toe",
    limited_notice: (shown, total) => `Eerste ${shown} resultaten van ${total}. Verfijn je zoekopdracht.`
  },
  es: {
    ready: "Listo",
    loading: "Cargando…",
    ok: (n) => `OK — ${n} entradas`,
    error: "Error de carga (abre la consola)",
    search_ph: "Buscar una palabra (árabe, translit, ES, árabe clásico)...",
    search_btn: "Buscar",
    all_dialects: "Todos los dialectos",
    modal_close: "Cerrar",
    results_count: (n) => `${n} resultado(s)` ,
    no_results: "Esta palabra aún no está disponible",
    no_results_cta: "➕ Añadir como contribución",
    add_word_btn: "➕ Añade tu palabra",
    limited_notice: (shown, total) => `Mostrando los primeros ${shown} resultados de ${total}. Afina tu búsqueda.`
  },
  it: {
    ready: "Pronto",
    loading: "Caricamento…",
    ok: (n) => `OK — ${n} voci`,
    error: "Errore di caricamento (apri la console)",
    search_ph: "Cerca una parola (arabo, translit, IT, arabo classico)...",
    search_btn: "Cerca",
    all_dialects: "Tutti i dialetti",
    modal_close: "Chiudi",
    results_count: (n) => `${n} risultato(i)` ,
    no_results: "Questa parola non è ancora disponibile",
    no_results_cta: "➕ Aggiungila come contributo",
    add_word_btn: "➕ Aggiungi la tua parola",
    limited_notice: (shown, total) => `Mostro i primi ${shown} risultati su ${total}. Affina la ricerca.`
  }

};

function detectLang(){
  const nav = (navigator.language || "en").toLowerCase();
  if(nav.startsWith("ar")) return "ar";
  if(nav.startsWith("fr")) return "fr";
  return "en";
}
const LANG = getPreferredLang();

// =====================
// Lang-aware meaning/translation
// - Objectif: n'afficher que la traduction de la langue UI
//   (évite les correspondances parasites via d'autres langues)
// =====================
function getMeaningForLang(row){
  if(!row) return { label: "", value: "" };

  if(LANG === "fr"){
    const v = clean(row.fr);
    return { label: "FR", value: v };
  }
  if(LANG === "en"){
    const v = clean(row.en);
    return { label: "EN", value: v };
  }
  // UI AR: pas de traduction FR/EN affichée
  return { label: "", value: "" };
}

function t(key){
  const pack = I18N[LANG] || I18N.en;
  const fr = I18N.fr;
  return pack[key] ?? fr[key] ?? "";
}

function applyI18nStatic(){
  document.documentElement.lang = LANG;
  document.documentElement.dir = (LANG === "ar") ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    if(!k) return;
    // mapping legacy -> new i18n keys
    const mapped = (k === "word_contribute_btn") ? "contribute_btn"
                 : (k === "word_more") ? "more"
                 : (k === "word_nf_title") ? "not_found_title"
                 : (k === "word_nf_hint") ? "not_found_hint"
                 : k;

    const val = t(mapped);
    if(val) el.textContent = val;
  });

  if(wordStatusEl) wordStatusEl.textContent = t("loading");
  if(nfContribEl) nfContribEl.textContent = t("contribute_btn");

  // link under transliteration (some browsers won't show if empty)
  const trLink = document.getElementById("trHelpLink");
  if(trLink) trLink.textContent = t("tr_help_link");
}

/* =====================
   Routing / parsing
   ===================== */
function getIdFromUrl(){
  try{
    const url = new URL(window.location.href);
    return (url.searchParams.get("id") || "").trim();
  }catch(e){
    return "";
  }
}

function parseId(id){
  // id is "slug--CC"
  const raw = (id || "").trim();
  if(!raw) return null;
  const parts = raw.split("--");
  const slug = decodeURIComponent(parts[0] || "").toLowerCase().trim();
  const cc = decodeURIComponent(parts[1] || "").toUpperCase().trim();
  if(!slug) return null;
  return { slug, cc };
}

function slugify(s){
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function findRowById(route, rows){
  if(!route) return null;
  const { slug, cc } = route;

  const candidates = rows.filter(r => {
    const okCountry = !cc || (r.pays_code || "").toUpperCase().trim() === cc;
    if(!okCountry) return false;

    const a = slugify(r.mot_arabe || "");
    const tr = slugify(r.transliteration || "");
    return a === slug || tr === slug;
  });

  return candidates[0] || null;
}

function buildWordUrl(row){
  const a = slugify(row.mot_arabe || "");
  const tr = slugify(row.transliteration || "");
  const base = a || tr || "mot";
  const cc = (row.pays_code || "").toUpperCase().trim();
  const id = `${encodeURIComponent(base)}--${encodeURIComponent(cc)}`;
  return `/mot/?id=${id}`;
}

/* =====================
   Social / screenshot styling helpers
   ===================== */

const COUNTRY_STYLES = {
  TN: { flag: "🇹🇳", icon: "🌶️", a1: "rgba(239,68,68,.82)", a2: "rgba(34,197,94,.55)", dialect: "tunisien" },
  MA: { flag: "🇲🇦", icon: "🫖", a1: "rgba(220,38,38,.80)", a2: "rgba(16,185,129,.55)", dialect: "darija" },
  DZ: { flag: "🇩🇿", icon: "🕌", a1: "rgba(34,197,94,.65)", a2: "rgba(239,68,68,.55)", dialect: "algérien" },
  LY: { flag: "🇱🇾", icon: "🌙", a1: "rgba(16,185,129,.60)", a2: "rgba(59,130,246,.55)", dialect: "libyen" },
  EG: { flag: "🇪🇬", icon: "🐫", a1: "rgba(245,158,11,.75)", a2: "rgba(59,130,246,.55)", dialect: "égyptien" },
  LB: { flag: "🇱🇧", icon: "🌲", a1: "rgba(220,38,38,.80)", a2: "rgba(59,130,246,.55)", dialect: "libanais" },
  SA: { flag: "🇸🇦", icon: "🕌", a1: "rgba(34,197,94,.65)", a2: "rgba(148,163,184,.45)", dialect: "khaliji" },
  IQ: { flag: "🇮🇶", icon: "🏺", a1: "rgba(239,68,68,.70)", a2: "rgba(34,197,94,.45)", dialect: "irakien" },
  SD: { flag: "🇸🇩", icon: "🌾", a1: "rgba(245,158,11,.70)", a2: "rgba(34,197,94,.45)", dialect: "soudanais" },
};

function getCountryStyle(cc){
  const key = (cc || "").toUpperCase().trim();
  if(COUNTRY_STYLES[key]) return COUNTRY_STYLES[key];
  // Build a flag emoji from a 2-letter country code if possible
  let flag = "🌍";
  if(/^[A-Z]{2}$/.test(key)){
    const A = 0x1F1E6; // regional indicator A
    flag = String.fromCodePoint(A + (key.charCodeAt(0) - 65), A + (key.charCodeAt(1) - 65));
  }
  return { flag, icon: "✨", a1: "rgba(99,102,241,.75)", a2: "rgba(236,72,153,.45)", dialect: "dialecte" };
}

function applyShareHeader(row){
  if(!shareHeaderEl) return;

  const cc = (row.pays_code || "").toUpperCase().trim();
  const st = getCountryStyle(cc);

  // set per-page accents (used by CSS)
  document.documentElement.style.setProperty("--z-accent-1", st.a1);
  document.documentElement.style.setProperty("--z-accent-2", st.a2);
  document.documentElement.style.setProperty("--z-accent-3", "rgba(148,163,184,.35)");

  if(shareFlagEl) shareFlagEl.textContent = st.flag || "🌍";
  if(shareIconEl) shareIconEl.textContent = st.icon || "✨";
  if(shareDialectEl) shareDialectEl.textContent = `${st.dialect}${cc ? " · " + cc : ""}`;
  if(shareBrandEl) shareBrandEl.textContent = "zeednalearn.com";

  // Toggle capture mode: hides extra UI for clean screenshots
  const url = new URL(window.location.href);
  const captureOn = url.searchParams.get("capture") === "1";
  document.body.classList.toggle("z-capture", captureOn);
  if(shareCaptureBtnEl){
    shareCaptureBtnEl.textContent = captureOn ? "✅" : "📸";
    shareCaptureBtnEl.onclick = () => {
      const u = new URL(window.location.href);
      const now = u.searchParams.get("capture") === "1";
      if(now) u.searchParams.delete("capture");
      else u.searchParams.set("capture","1");
      window.location.href = u.toString();
    };
  }

  // Ensure the main card gets the proper class for the new background
  const mainCard = document.querySelector(".card");
  if(mainCard) mainCard.classList.add("z-social-card");

  shareHeaderEl.style.display = "flex";
}

/* =====================
   Data normalize
   ===================== */

function lower(s){ return (s || "").toString().toLowerCase(); }

function normalizeRow(r){
  const actifRaw = clean(r.actif);
  const actifBool = actifRaw === "" ? true : ["true","1","oui","vrai"].includes(lower(actifRaw));

  const tr = clean(r.traduction);

  let fr = clean(r.traduction_fr) || clean(r.sens_dialectal) || clean(r.sens_fr);
  let en = clean(r.traduction_en) || clean(r.traduction_eng);
  const nl = "";

  if(tr){
    if(LANG === "fr") fr = tr;
    else if(LANG === "en") en = tr;
  }
  const fu = clean(r["Arabe_classique"]) || clean(r["arabe_classique"]) || clean(r.Fouss7a) || clean(r["Fouss7a"]);

  const obj = {
    mot_id: clean(r.mot_id),
    mot_arabe: clean(r.mot_arabe),
    transliteration: clean(r.transliteration),

    concept_id: clean(r.concept_id),

    pays_code: clean(r.pays_code),
    region: clean(r.region),

    categorie_grammaticale: clean(r.categorie_grammaticale),
    registre: clean(r.registre),

    langue_source: clean(r.langue_source),
    origine_mot: clean(r.origine_mot),

    description_usage: clean(r.description_usage),
    exemple_phrase: clean(r.exemple_phrase),

    nombre: clean(r.nombre),
    statut_validation: clean(r.statut_validation),

    actifBool,

    fr, en, nl, fu
  };

  return obj;
}

/* =====================
   Render
   ===================== */

function safeDirRTL(ar){
  return `<span dir="rtl" style="direction:rtl; unicode-bidi:plaintext;">${escapeHtml(ar)}</span>`;
}

function renderWord(row, rows, synIndex){
  document.title = `${row.mot_arabe || row.transliteration || "Mot"} — Zeedna 3amiat`;

  if(wArEl) wArEl.innerHTML = safeDirRTL(row.mot_arabe || "—");
  if(wTrEl) wTrEl.textContent = row.transliteration || "";

  const flag = isoToFlagEmoji(row.pays_code);

  // Social header (optional) for screenshots / sharing
  applyShareHeader(row);

  const lines = [];
  lines.push(`<div class="trad-line"><span class="tag">${flag}</span>${row.registre ? `<span class="small">${escapeHtml(row.registre)}</span>` : ""}</div>`);
  // ✅ Traduction : uniquement langue UI (FR ou EN)
  const tr = getMeaningForLang(row);
  if(tr.value) lines.push(`<div class="trad-line"><span class="tag">${escapeHtml(tr.label)}</span><span>${escapeHtml(tr.value)}</span></div>`);
  if(row.fu) lines.push(`<div class="trad-line"><span class="tag">Arabe classique</span>${safeDirRTL(row.fu)}</div>`);
  if(wTradsEl) wTradsEl.innerHTML = lines.join("");

  const kv = [
    [t("kv_country"), row.pays_code],
    [t("kv_category"), row.categorie_grammaticale],
    [t("kv_source"), row.langue_source],
    [t("kv_origin"), row.origine_mot],
    [t("kv_number"), row.nombre],
    [t("kv_desc"), row.description_usage],
    [t("kv_example"), row.exemple_phrase],
  ].filter(([_,v]) => clean(v));

  if(wKvEl){
    wKvEl.innerHTML = kv.map(([k,v]) => `
      <div class="k">${escapeHtml(String(k))}</div>
      <div class="v">${escapeHtml(String(v))}</div>
    `).join("");
  }

  // Suggestions
  if(wSuggestEl){
    const list = (typeof findSynonyms === "function" && synIndex)
      ? findSynonyms(row, rows, synIndex, 12, LANG)
      : [];

    wSuggestEl.innerHTML = (list || []).map(it => {
      const r = it.row;
      const f = isoToFlagEmoji(r.pays_code);
      return `
        <div class="card" data-id="${escapeHtml(buildWordUrl(r))}" style="margin:10px 0; padding:12px; cursor:pointer;">
          <div class="row-top">
            <div>
              <div class="word-ar" style="font-size:30px;">${escapeHtml(r.mot_arabe || "—")}</div>
              <div class="translit">${escapeHtml(r.transliteration || "")}</div>
            </div>
            <div class="meta-right">
              <div class="badge"><span class="flag">${f}</span></div>
            </div>
          </div>
          <div class="trads" style="margin-top:10px;">
            ${(() => {
              const tr2 = getMeaningForLang(r);
              return tr2.value ? `<div class="trad-line"><span class="tag">${escapeHtml(tr2.label)}</span><span>${escapeHtml(tr2.value)}</span></div>` : "";
            })()}
          </div>
        </div>
      `;
    }).join("");

    wSuggestEl.querySelectorAll(".card[data-id]").forEach(c => {
      c.addEventListener("click", () => {
        const url = c.getAttribute("data-id");
        if(url) window.location.href = url;
      });
    });
  }
}

function showNotFound(route){
  if(wordStatusEl) wordStatusEl.style.display = "none";
  if(wordViewEl) wordViewEl.style.display = "none";
  if(wordNotFoundEl) wordNotFoundEl.style.display = "block";

  const cc = route?.cc ? route.cc : "";
  if(nfContribEl){
    nfContribEl.href = cc ? `/contribuer/?pays=${encodeURIComponent(cc)}` : "/contribuer";
  }
}

async function main(){
  initThemeToggle();
  applyI18nStatic();

  const id = getIdFromUrl();
  const route = parseId(id);
  if(!route){
    showNotFound(null);
    return;
  }

  try{
    // 1) Charger l'index leger (rapide)
    const indexRes = await fetch(API_URL + "?action=index&lang=" + encodeURIComponent(LANG), { cache: "no-store" });
    if(!indexRes.ok) throw new Error(`HTTP ${indexRes.status}`);

    // Read as text first so we can debug non‑JSON payloads (HTML login pages, etc.)
    const indexText = await indexRes.text();
    let indexPayload;
    try { indexPayload = JSON.parse(indexText); }
    catch(e){
      console.error("[API] Non-JSON index response (first 200 chars):", indexText.slice(0,200));
      throw new Error("Réponse API non-JSON (index)");
    }
    const indexData = unwrapArrayPayload(indexPayload);
    if(!Array.isArray(indexData)) throw new Error("Invalid JSON (index missing data[])");

    const rows = indexData.map(normalizeRow).filter(r => r.actifBool);
    const synIndex = (typeof buildSynIndex === "function") ? buildSynIndex(rows, LANG) : null;

    const foundMini = findRowById(route, rows);
    if(!foundMini){
      showNotFound(route);
      return;
    }

    // 2) Charger le detail uniquement pour CE mot
    let fullRow = foundMini;
    if(foundMini.mot_id){
      const detailRes = await fetch(API_URL + "?action=word&id=" + encodeURIComponent(foundMini.mot_id) + "&lang=" + encodeURIComponent(LANG), { cache: "no-store" });
      if(detailRes.ok){
        const detailText = await detailRes.text();
        let detailPayload;
        try { detailPayload = JSON.parse(detailText); }
        catch(e){
          console.error("[API] Non-JSON word response (first 200 chars):", detailText.slice(0,200));
          detailPayload = null;
        }
        const detailArr = unwrapArrayPayload(detailPayload);

        // detail can be:
        // - array: [...] (handled by unwrapArrayPayload)
        // - wrapper with array: { data:[...] }
        // - wrapper with object: { data:{...} }
        let detailObj = {};
        if(Array.isArray(detailArr)){
          detailObj = detailArr[0] || {};
        }else if(detailPayload && typeof detailPayload === "object" && detailPayload.data && typeof detailPayload.data === "object" && !Array.isArray(detailPayload.data)){
          detailObj = detailPayload.data;
        }else{
          detailObj = detailPayload || {};
        }
        const detailNorm = normalizeRow(detailObj);
        fullRow = Object.assign({}, foundMini, detailNorm);
      }
    }

    if(wordStatusEl) wordStatusEl.style.display = "none";
    if(wordNotFoundEl) wordNotFoundEl.style.display = "none";
    if(wordViewEl) wordViewEl.style.display = "block";

    renderWord(fullRow, rows, synIndex);

  }catch(e){
    console.error(e);
    if(wordStatusEl) wordStatusEl.textContent = "❌ Error loading data";
  }
}

main();


// Lang switcher
document.addEventListener('DOMContentLoaded', () => {
  try { mountLangSwitcher(document.querySelector('.headerActions')); } catch(e) {}
});
