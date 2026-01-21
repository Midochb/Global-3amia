// =====================
// ZEEDNA 3AMIAT — SEARCH APP
// - Loads dictionary JSON from Apps Script
// - Search via button/Enter
// - Suggestions dropdown while typing
// - Shareable URL (?q=...&dialect=...)
// - Modal with synonyms + hash routing (#mot=...--CC)
// =====================

// =====================
// THEME (Light/Dark)
// =====================
function applyTheme(mode){
  document.body.setAttribute("data-theme", mode);
  try { localStorage.setItem("zeedna_theme", mode); } catch(e){}
}

function initThemeToggle(){
  const btn = document.getElementById("themeToggle");
  if(!btn) return;

  let saved = "dark";
  try { saved = localStorage.getItem("zeedna_theme") || "dark"; } catch(e){}
  if(saved !== "light") saved = "dark";

  applyTheme(saved);
  btn.textContent = (saved === "light") ? "☀️" : "🌙";

  btn.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "dark";
    const next = (current === "light") ? "dark" : "light";
    applyTheme(next);
    btn.textContent = (next === "light") ? "☀️" : "🌙";
  });
}

/* =========================================================
   [APP-1] CONFIG
   ========================================================= */

// ✅ API Apps Script (JSON)
const API_URL = "https://script.google.com/macros/s/AKfycbxRvetENGm215GS4OowKMa_BqHBi5CNEWOgzQ5k5D7UaaItvPHLj2N1tmCBjVB_WZN1/exec";

// Unwrap API payloads.
// Apps Script may return either an array directly OR an object wrapper like:
// { ok:true, action:"index", data:[...] }
function unwrapArrayPayload(payload){
  if(Array.isArray(payload)) return payload;
  if(payload && typeof payload === "object"){
    // Common wrappers
    if(Array.isArray(payload.data)) return payload.data;
    if(Array.isArray(payload.rows)) return payload.rows;
    if(Array.isArray(payload.items)) return payload.items;
    if(Array.isArray(payload.result)) return payload.result;

    // Some proxies serialize the array as a JSON string
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

// Cache localStorage for faster boot
const CACHE_KEY_BASE = "zeedna_words_cache_v2";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

// UX: limite d'affichage pour éviter les grosses listes sur mobile
const MAX_RESULTS = 50;

/* =========================================================
   [APP-2] i18n (Search)
   ========================================================= */

const I18N = {
  fr: {
    ready: "Prêt",
    loading: "Chargement…",
    ok: (n) => `OK — ${n} entrées`,
    error: "Erreur chargement (ouvre la console)",
    // ✅ On ne recherche plus via EN/NL quand l'UI est en FR (évite les faux matchs)
    search_ph: "Chercher un mot (arabe, translit, FR, arabe classique)...",
    search_btn: "Rechercher",
    all_dialects: "Tous les dialectes",
    modal_close: "Fermer",
    results_count: (n) => `${n} résultat(s)` ,
    no_results: "Ton mot n’est pas encore dispo",
    no_results_cta: "➕ L’ajouter en contribution",
    add_word_btn: "➕ Ajoute ton mot",
    limited_notice: (shown, total) => `Affichage des ${shown} premiers résultats sur ${total}. Affine ta recherche.`
  },
  en: {
    ready: "Ready",
    loading: "Loading…",
    ok: (n) => `OK — ${n} entries`,
    error: "Load error (open console)",
    // ✅ On ne recherche plus via FR/NL quand l'UI est en EN (évite les faux matchs)
    search_ph: "Search a word (Arabic, translit, EN, Classical Arabic)...",
    search_btn: "Search",
    all_dialects: "All dialects",
    modal_close: "Close",
    results_count: (n) => `${n} result(s)` ,
    no_results: "This word isn’t available yet",
    no_results_cta: "➕ Add it as a contribution",
    add_word_btn: "➕ Add your word",
    limited_notice: (shown, total) => `Showing the first ${shown} results out of ${total}. Refine your search.`
  },
  ar: {
    ready: "جاهز",
    loading: "جارٍ التحميل…",
    ok: (n) => `تم — ${n} مدخلة`,
    error: "خطأ في التحميل (افتح وحدة التحكم)",
    // ✅ UI عربي: البحث على العربي/الترانسلِت/العربية الفصحى فقط
    search_ph: "ابحث عن كلمة (عربي، كتابة لاتينية، العربية الكلاسيكية)...",
    search_btn: "بحث",
    all_dialects: "كل اللهجات",
    modal_close: "إغلاق",
    results_count: (n) => `${n} نتيجة`,
    no_results: "الكلمة غير متوفّرة بعد",
    no_results_cta: "➕ أضِفها كمساهمة",
    add_word_btn: "➕ أضف كلمتك",
    limited_notice: (shown, total) => `عرض أول ${shown} نتيجة من أصل ${total}. حدّد البحث أكثر.`
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
  if (nav.startsWith("ar")) return "ar";
  if (nav.startsWith("fr")) return "fr";
  return "en";
}

const LANG = getPreferredLang();

// =====================
// Lang-aware meaning/translation
// - Objectif: n'afficher + ne rechercher que la traduction de la langue UI
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

  // UI AR : pas de 'traduction' FR/EN affichée.
  // On garde plutôt l'Arabe classique (fu) dans l'UI.
  return { label: "", value: "" };
}

function t(key){
  const pack = I18N[LANG] || I18N.en;
  const fr = I18N.fr;
  return (pack[key] !== undefined) ? pack[key] : (fr[key] !== undefined ? fr[key] : "");
}

function applyI18nStatic(){
  // html lang/dir
  document.documentElement.lang = LANG;
  document.documentElement.dir = (LANG === "ar") ? "rtl" : "ltr";

  // placeholders
  if(qEl) qEl.setAttribute("placeholder", t("search_ph"));

  // dropdown first option
  if(dialectEl){
    const first = dialectEl.querySelector("option[value='']");
    if(first) first.textContent = t("all_dialects");
  }

  // modal close
  if(elClose) elClose.textContent = t("modal_close");

  // search btn
  if(searchBtn) searchBtn.textContent = t("search_btn");

  // header CTA (add word)
  document.querySelectorAll("[data-i18n=\"add_word_btn\"]").forEach(el => {
    el.textContent = t("add_word_btn");
  });

  // generic data-i18n (e.g., header CTA)
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    const v = t(k);
    if(v) el.textContent = v;
  });
}

function setCount(n){
  if(!countEl) return;
  const pack = I18N[LANG] || I18N.en;
  countEl.textContent = (typeof pack.results_count === "function") ? pack.results_count(n) : `${n}`;
}

/* =========================================================
   [APP-3] DOM ELEMENTS
   ========================================================= */

// UI elements
const qEl = document.getElementById("q");
const searchBtn = document.getElementById("searchBtn");
const suggestionsEl = document.getElementById("suggestions");
const dialectEl = document.getElementById("dialect");
const resultsEl = document.getElementById("results");
const countEl = document.getElementById("count");
const statusEl = document.getElementById("status");
const homeBtn = document.getElementById("homeBtn");

// Modal elements
const elBackdrop = document.getElementById("backdrop");
const elModal = document.getElementById("modal");
const elClose = document.getElementById("m_close");
const mWord = document.getElementById("m_word");
const mTranslit = document.getElementById("m_translit");
const mMeta = document.getElementById("m_meta");
const mKV = document.getElementById("m_kv");
const mSyn = document.getElementById("m_syn");

/* =========================================================
   [APP-4] STATE
   ========================================================= */

let rows = [];
let filteredRows = [];
let synIndex = null;
let lastSuggestQuery = "";
let bootedFromCache = false;

/* =========================================================
   [APP-5] HELPERS
   ========================================================= */

function setAppStatus(msg){
  if(!statusEl) return;

  // Replace the "Loading..." text by a visible spinner
  const loadingMsg = t ? t("loading") : "Loading";
  if (msg === loadingMsg) {
    statusEl.innerHTML = '<span class="spinner" aria-label="Loading"></span>';
    return;
  }

  // Default: plain text
  statusEl.textContent = msg || "";
}

function safeDirRTL(ar){
  return `<span dir="rtl" style="direction:rtl; unicode-bidi:plaintext;">${escapeHtml(ar)}</span>`;
}

function debounce(fn, wait){
  let tmr = null;
  return function(...args){
    if(tmr) clearTimeout(tmr);
    tmr = setTimeout(() => fn.apply(this, args), wait);
  };
}

function cacheKey(){
  return CACHE_KEY_BASE + "_" + LANG;
}

function saveCache(data){
  try {
    localStorage.setItem(cacheKey(), JSON.stringify({ at: Date.now(), data }));
  } catch(e){}
}

function readCache(){
  try {
    const raw = localStorage.getItem(cacheKey());
    if(!raw) return null;
    const obj = JSON.parse(raw);
    if(!obj || !obj.at || !Array.isArray(obj.data)) return null;
    if(Date.now() - obj.at > CACHE_TTL_MS) return null;
    return obj.data;
  } catch(e){
    return null;
  }
}

/* =========================================================
   [ROUTE] URL per word (hash)
   Format: #mot=<slug>--<pays>
   ========================================================= */

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

function buildHashForRow(row){
  const a = slugify(row.mot_arabe || "");
  const tr = slugify(row.transliteration || "");
  const base = a || tr || "mot";
  const cc = (row.pays_code || "").toUpperCase().trim();
  return `#mot=${encodeURIComponent(base)}--${encodeURIComponent(cc)}`;
}

// Real page id (same format as hash, but stored in ?id=...)
function buildIdForRow(row){
  const a = slugify(row.mot_arabe || "");
  const tr = slugify(row.transliteration || "");
  const base = a || tr || "mot";
  const cc = (row.pays_code || "").toUpperCase().trim();
  return `${base}--${cc}`;
}

function wordPageUrlForRow(row){
  const id = buildIdForRow(row);
  // SEO-friendly static pages generated at build time
  return `/mot/${encodeURIComponent(id)}/`;
}

function parseHash(){
  const h = (location.hash || "").trim();
  if(!h.startsWith("#mot=")) return null;
  const raw = h.slice(5);
  const parts = raw.split("--");
  const slugEnc = parts[0] || "";
  const ccEnc = parts[1] || "";
  const slug = decodeURIComponent(slugEnc).trim().toLowerCase();
  const cc = decodeURIComponent(ccEnc).trim().toUpperCase();
  if(!slug) return null;
  return { slug, cc };
}

function findRowFromHash(route){
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

function setHashForRow(row){
  const newHash = buildHashForRow(row);
  if(location.hash === newHash) return;
  history.pushState({ zeedna: true }, "", newHash);
}

function clearHash(){
  if(!location.hash) return;
  history.pushState({ zeedna: true }, "", "#");
}

function openFromCurrentHash(){
  const route = parseHash();
  if(!route) return;
  const found = findRowFromHash(route);
  if(found) openModal(found);
  else clearHash();
}

/* =========================================================
   [SEARCH] Shareable URL (?q=...&dialect=...)
   ========================================================= */

function readSearchParams(){
  try{
    const u = new URL(window.location.href);
    const q = (u.searchParams.get("q") || "").trim();
    const d = (u.searchParams.get("dialect") || "").trim();
    return { q, d };
  }catch(e){
    return { q: "", d: "" };
  }
}

function writeSearchParams(q, dialect){
  try{
    const u = new URL(window.location.href);
    if(q) u.searchParams.set("q", q); else u.searchParams.delete("q");
    if(dialect) u.searchParams.set("dialect", dialect); else u.searchParams.delete("dialect");
    history.replaceState(history.state || {}, "", u.toString());
  }catch(e){}
}

/* =========================================================
   [APP-6] LOAD + NORMALIZE
   ========================================================= */

async function loadData(){
  setAppStatus(t("loading"));

  // 1) fast path cache
  const cached = readCache();
  if(cached && Array.isArray(cached)){
    bootedFromCache = true;
    try{
      rows = cached.map(normalizeRow).filter(r => r.actifBool);
      synIndex = buildSynIndex(rows, LANG);
      buildDialectDropdown(rows);
      setAppStatus(t("ok")(rows.length));
      // If URL had search, run it immediately
      const sp = readSearchParams();
      if(sp.q) {
        if(qEl) qEl.value = sp.q;
        if(dialectEl) dialectEl.value = sp.d || "";
        performSearch();
      }
      openFromCurrentHash();
    }catch(e){
      // ignore cache errors
    }
  }

  // 2) fetch fresh
  try{
    const res = await fetch(API_URL + "?action=index&lang=" + encodeURIComponent(LANG), { cache: "no-store" });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);

    // Read as text first so we can debug non‑JSON payloads (HTML login pages, etc.)
    const rawText = await res.text();
    let payload;
    try {
      payload = JSON.parse(rawText);
    } catch(parseErr){
      console.error("[API] Non-JSON response (first 200 chars):", rawText.slice(0, 200));
      throw new Error("Réponse API non-JSON");
    }

    const data = unwrapArrayPayload(payload);
    if(!Array.isArray(data)){
      console.error("[API] Unexpected payload shape:", payload);
      throw new Error("Réponse JSON invalide (pas un tableau)");
    }

    saveCache(data);

    rows = data.map(normalizeRow).filter(r => r.actifBool);
    synIndex = buildSynIndex(rows, LANG);
    buildDialectDropdown(rows);

    // Keep UI consistent
    setAppStatus(t("ok")(rows.length));

    // If we did not boot from cache, maybe apply URL search
    if(!bootedFromCache){
      const sp = readSearchParams();
      if(sp.q) {
        if(qEl) qEl.value = sp.q;
        if(dialectEl) dialectEl.value = sp.d || "";
        performSearch();
      }
      openFromCurrentHash();
    }

  }catch(e){
    console.error(e);
    if(!bootedFromCache) setAppStatus(t("error"));
  }
}

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
    exemple_phrase: clean(r.exemple_phrase) || clean(r.exemple_usage),

    nombre: clean(r.nombre),
    statut_validation: clean(r.statut_validation),

    actifBool,

    fr, en, nl, fu
  };

  // ✅ Search index : uniquement la langue UI + champs neutres
  // - FR UI => cherche sur FR (fallback EN)
  // - EN UI => cherche sur EN (fallback FR)
  // - AR UI => pas de recherche sur FR/EN/NL
  const meaning = getMeaningForLang(obj).value;

  obj._search = norm([
    obj.mot_arabe,
    obj.transliteration,
    (LANG === "ar") ? "" : meaning,
    obj.fu,
    obj.pays_code,
    obj.region,
    obj.categorie_grammaticale,
    obj.registre,
    obj.origine_mot
  ].join(" | "));

  return obj;
}

/* =========================================================
   [APP-7] DIALECT DROPDOWN
   ========================================================= */

function buildDialectDropdown(data){
  if(!dialectEl) return;

  const set = new Set(data.map(x => x.pays_code).filter(Boolean));
  const list = Array.from(set).sort();

  dialectEl.innerHTML = `<option value="">${t("all_dialects")}</option>`;
  for(const code of list){
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = `${isoToFlagEmoji(code)} ${code}`;
    dialectEl.appendChild(opt);
  }
}

/* =========================================================
   [APP-8] SUGGESTIONS (Google-like)
   ========================================================= */

function clearSuggestions(){
  if(!suggestionsEl) return;
  suggestionsEl.innerHTML = "";
  suggestionsEl.style.display = "none";
}

function renderSuggestions(items){
  if(!suggestionsEl) return;
  if(!items || !items.length){
    clearSuggestions();
    return;
  }

  suggestionsEl.innerHTML = items.map(it => {
    const arText = it.ar || it.q || "";
    const trText = it.tr || "";
    const meaningText = it.meaning || "";

    const main = arText
      ? `<span class="sMain" dir="rtl">${escapeHtml(arText)}</span>`
      : `<span class="sMain">${escapeHtml(it.q || "")}</span>`;

    const subParts = [];
    if(trText) subParts.push(escapeHtml(trText));
    if(meaningText) subParts.push(escapeHtml(meaningText));
    const sub = subParts.length ? `<span class="sSub">${subParts.join(" — ")}</span>` : "";

    const meta = `${escapeHtml(it.flag || "")} ${escapeHtml(it.code || "")}`.trim();

    return `
      <button type="button" class="suggestItem" role="option"
        data-q="${escapeHtml(it.q || "")}" data-id="${escapeHtml(it.id || "")}">
        <span class="sLeft">
          ${main}
          ${sub}
        </span>
        ${meta ? `<span class="suggestMeta">${meta}</span>` : ""}
      </button>
    `;
  }).join("");

  suggestionsEl.style.display = "block";
}
const updateSuggestions = debounce(() => {
  if(!qEl) return;
  const q = (qEl.value || "").trim();
  if(!q){
    lastSuggestQuery = "";
    clearSuggestions();
    return;
  }

  const nq = norm(q);
  if(nq === lastSuggestQuery) return;
  lastSuggestQuery = nq;

  // limit suggestions (Google-like)
  const MAX = 5;

  const pop = getLocalPopularityMap();

  const scored = [];
  for(const r of rows){
    if(!r) continue;

    const ar = clean(r.mot_arabe);
    const tr = clean(r.transliteration);
    const meaning = (LANG === "ar") ? "" : clean(getMeaningForLang(r).value);

    // Build searchable fields for typeahead (fast)
    const nar = ar ? norm(ar) : "";
    const ntr = tr ? norm(tr) : "";
    const nme = meaning ? norm(meaning) : "";

    // Prefer prefix matches, then contains
    let score = 0;
    const isPrefix = (nar && nar.startsWith(nq)) || (ntr && ntr.startsWith(nq)) || (nme && nme.startsWith(nq));
    const isContains = (!isPrefix) && ((nar && nar.includes(nq)) || (ntr && ntr.includes(nq)) || (nme && nme.includes(nq)));

    if(isPrefix) score += 3;
    else if(isContains) score += 1;
    else continue;

    // Small local ranking boost based on user clicks
    const pid = clean(r.mot_id);
    const p = pid ? (pop[pid] || 0) : 0;
    if(p) score += Math.log(1 + p) * 0.6;

    // Slightly prefer shorter matches
    const len = (ar || tr || "").length || 999;
    score += Math.max(0, 1.2 - (len / 50));

    scored.push({ score, r, meaning });
  }

  scored.sort((a,b) => b.score - a.score);

  const out = scored.slice(0, MAX).map(({r, meaning}) => {
    const flag = isoToFlagEmoji(r.pays_code);
    return {
      id: r.mot_id || "",
      q: r.mot_arabe || r.transliteration || q,
      ar: r.mot_arabe || "",
      tr: r.transliteration || "",
      meaning: meaning || "",
      flag,
      code: r.pays_code || ""
    };
  });

  renderSuggestions(out);
}, 120);

/* =========================================================
   [APP-8b] LOCAL POPULARITY (client-only)
   - stores only ids + counts in localStorage (no PII)
   ========================================================= */

const POP_KEY = "zeedna_popularity_v1";

function getLocalPopularityMap(){
  try{
    const raw = localStorage.getItem(POP_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return (obj && typeof obj === "object") ? obj : {};
  }catch(e){
    return {};
  }
}

function bumpLocalPopularity(motId){
  try{
    if(!motId) return;
    const m = getLocalPopularityMap();
    m[motId] = (m[motId] || 0) + 1;
    // keep it small
    const entries = Object.entries(m);
    if(entries.length > 400){
      entries.sort((a,b) => b[1]-a[1]);
      const trimmed = Object.fromEntries(entries.slice(0, 250));
      localStorage.setItem(POP_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(POP_KEY, JSON.stringify(m));
    }
  }catch(e){}
}

/* =========================================================
   [APP-9] FILTER + RENDER LIST (triggered by Search button)
   ========================================================= */

function applyFilters(){
  const q = norm(qEl?.value || "");
  const dialect = clean(dialectEl?.value || "");

  // UX: ne pas afficher toute la base quand l'utilisateur choisit seulement un dialecte.
  // Les résultats s'affichent uniquement quand il y a une requête.
  const hasSearch = q.length > 0;

  if(!hasSearch){
    filteredRows = [];
    renderList([]);
    setCount(0);
    return;
  }

  filteredRows = rows.filter(r => {
    const okDialect = !dialect || r.pays_code === dialect;
    const okQ = r._search.includes(q);
    return okDialect && okQ;
  });

  renderList(filteredRows, { qRaw: (qEl?.value || "").trim(), dialect });
  setCount(filteredRows.length);
}

function renderList(data, ctx){
  if(!resultsEl) return;
  resultsEl.innerHTML = "";

  if(!data.length){
    const qRaw = (ctx && ctx.qRaw) ? ctx.qRaw : "";
    const dialect = (ctx && ctx.dialect) ? ctx.dialect : "";

    // On n'affiche le bloc "mot introuvable" que si l'utilisateur a vraiment tapé un mot.
    // Sélectionner uniquement un dialecte ne doit pas lister (ou suggérer) toute la base.
    if(qRaw){
      const params = new URLSearchParams();
      if(qRaw) params.set("mot", qRaw);
      if(dialect) params.set("pays", dialect);

      resultsEl.innerHTML = `
        <div class="noResultBox">
          <div class="noResultTitle">${escapeHtml(t("no_results"))}</div>
          <a class="noResultCta" href="/contribuer/?${params.toString()}">${escapeHtml(t("no_results_cta"))}</a>
        </div>
      `;
    } else {
      resultsEl.innerHTML = `<div class="muted small" style="padding:10px;">${escapeHtml(I18N[LANG]?.ready || I18N.en.ready)}</div>`;
    }
    return;
  }

  // Limite d'affichage (on garde le total dans le compteur en haut)
  const total = data.length;
  const shown = Math.min(total, MAX_RESULTS);
  if(total > MAX_RESULTS){
    const note = document.createElement("div");
    note.className = "limitNote";
    note.textContent = (typeof t("limited_notice") === "function") ? t("limited_notice")(shown, total) : `Showing first ${shown} / ${total}`;
    resultsEl.appendChild(note);
  }

  const toRender = (total > MAX_RESULTS) ? data.slice(0, MAX_RESULTS) : data;

  for(const row of toRender){
    resultsEl.appendChild(renderCard(row));
  }
}

function renderCard(row){
  const card = document.createElement("div");
  card.className = "card";

  const flag = isoToFlagEmoji(row.pays_code);

  const lines = [];

  // ✅ Traduction : uniquement la langue UI (FR ou EN)
  const tr = getMeaningForLang(row);
  if(tr.value) lines.push(`<div class="trad-line"><span class="tag">${escapeHtml(tr.label)}</span><span>${escapeHtml(tr.value)}</span></div>`);

  // UI AR : on n'affiche pas FR/EN, mais on garde l'Arabe classique
  if(row.fu) lines.push(`<div class="trad-line"><span class="tag">Arabe classique</span>${safeDirRTL(row.fu)}</div>`);

  card.innerHTML = `
    <div class="row-top">
      <div>
        <div class="word-ar">${escapeHtml(row.mot_arabe || "—")}</div>
        <div class="translit">${escapeHtml(row.transliteration || "")}</div>
      </div>

      <div class="meta-right">
        <div class="badge"><span class="flag">${flag}</span></div>
        ${row.categorie_grammaticale ? `<div class="badge">${escapeHtml(row.categorie_grammaticale)}</div>` : ""}
      </div>
    </div>

    <div class="trads">
      ${lines.join("")}
    </div>
  `;

  // Open in dedicated page (shareable URL)
  card.addEventListener("click", () => {
    // remember this word as often visited (for smarter suggestions)
    if(row.mot_id) bumpLocalPopularity(row.mot_id);
    window.location.href = wordPageUrlForRow(row);
  });
  return card;
}

/* =========================================================
   [APP-10] MODAL OPEN/CLOSE
   ========================================================= */

function openModal(row){
  if(!elModal || !elBackdrop) return;

  setHashForRow(row);

  mWord.textContent = row.mot_arabe || "—";
  mTranslit.textContent = row.transliteration || "";

  const flag = isoToFlagEmoji(row.pays_code);

  // Meta
  const metaLines = [];
  metaLines.push(`<div class="trad-line"><span class="tag">${flag}</span>${row.registre ? `<span class="small">${escapeHtml(row.registre)}</span>` : ""}</div>`);
  // ✅ Traduction : uniquement langue UI (FR ou EN)
  const tr = getMeaningForLang(row);
  if(tr.value) metaLines.push(`<div class="trad-line"><span class="tag">${escapeHtml(tr.label)}</span><span>${escapeHtml(tr.value)}</span></div>`);

  // UI AR : on garde l'Arabe classique
  if(row.fu) metaLines.push(`<div class="trad-line"><span class="tag">Arabe classique</span>${safeDirRTL(row.fu)}</div>`);
  mMeta.innerHTML = metaLines.join("");

  const kv = [
    ["Pays", row.pays_code],
    ["Catégorie", row.categorie_grammaticale],
    ["Langue source", row.langue_source],
    ["Origine", row.origine_mot],
    ["Nombre", row.nombre],
    ["Description", row.description_usage],
    ["Exemple", row.exemple_phrase],
  ].filter(([_,v]) => clean(v));

  mKV.innerHTML = kv.map(([k,v]) => `
    <div class="k">${escapeHtml(k)}</div>
    <div class="v">${escapeHtml(String(v))}</div>
  `).join("");

  renderSynonyms(row);

  elBackdrop.style.display = "block";
  elModal.style.display = "block";
  elBackdrop.setAttribute("aria-hidden","false");
  elModal.setAttribute("aria-hidden","false");
}

function closeModal(){
  if(!elModal || !elBackdrop) return;
  elBackdrop.style.display = "none";
  elModal.style.display = "none";
  elBackdrop.setAttribute("aria-hidden","true");
  elModal.setAttribute("aria-hidden","true");
  clearHash();
}

/* =========================================================
   [APP-11] MODAL → SYNONYMS (FR + EN)
   ========================================================= */

function renderSynonyms(baseRow){
  if(!mSyn) return;
  const list = findSynonyms(baseRow, rows, synIndex, 12, LANG);
  if(!list.length){
    mSyn.innerHTML = "";
    return;
  }

  mSyn.innerHTML = list.map(it => {
    const r = it.row;
    const flag = isoToFlagEmoji(r.pays_code);

    const tr = getMeaningForLang(r);
    const trLine = tr.value
      ? `<div class="trad-line"><span class="tag">${escapeHtml(tr.label)}</span><span>${escapeHtml(tr.value)}</span></div>`
      : "";

    return `
      <div class="card syn-card" data-id="${escapeHtml(r.mot_id)}" style="margin:10px 0; padding:12px;">
        <div class="row-top">
          <div>
            <div class="word-ar" style="font-size:30px;">${escapeHtml(r.mot_arabe || "—")}</div>
            <div class="translit">${escapeHtml(r.transliteration || "")}</div>
          </div>
          <div class="meta-right">
            <div class="badge"><span class="flag">${flag}</span></div>
          </div>
        </div>
        <div class="trads" style="margin-top:10px;">
          ${trLine}
        </div>
      </div>
    `;
  }).join("");

  mSyn.querySelectorAll(".syn-card").forEach(c => {
    c.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = c.getAttribute("data-id");
      const target = rows.find(x => x.mot_id === id);
      if(target) window.location.href = wordPageUrlForRow(target);
    });
  });
}

/* =========================================================
   [APP-12] SEARCH ACTION
   ========================================================= */

function performSearch(){
  clearSuggestions();
  applyFilters();

  const qRaw = (qEl?.value || "").trim();
  const d = clean(dialectEl?.value || "");
  writeSearchParams(qRaw, d);
}

/* =========================================================
   [APP-13] EVENTS + NAV
   ========================================================= */

// Suggestions while typing (NOT full search)
qEl?.addEventListener("input", updateSuggestions);

// Enter triggers search
qEl?.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    e.preventDefault();
    performSearch();
  }
  if(e.key === "Escape"){
    clearSuggestions();
  }
});

// Clicking the search button triggers search
searchBtn?.addEventListener("click", () => performSearch());

// Dialect change triggers search only if there is a query already
// (still lets users filter with empty query if they want)
dialectEl?.addEventListener("change", () => {
  const qRaw = (qEl?.value || "").trim();
  const d = clean(dialectEl?.value || "");
  if(qRaw || d) performSearch();
});

// Close suggestions when clicking outside
document.addEventListener("click", (e) => {
  if(!suggestionsEl || !qEl) return;
  const target = e.target;
  if(target === qEl || suggestionsEl.contains(target)) return;
  clearSuggestions();
});

// Modal events
elClose?.addEventListener("click", closeModal);
elBackdrop?.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeModal(); });

// History navigation for hash
window.addEventListener("popstate", () => {
  if(location.hash && location.hash.startsWith("#mot=")) openFromCurrentHash();
  else closeModal();
});
window.addEventListener("hashchange", () => {
  if(location.hash && location.hash.startsWith("#mot=")) openFromCurrentHash();
  else closeModal();
});

// Logo → home
function goHome(){
  closeModal();
  window.location.href = "/";
}
if(homeBtn){
  homeBtn.addEventListener("click", goHome);
  homeBtn.addEventListener("keydown", (e) => {
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      goHome();
    }
  });
}

/* =========================================================
   [APP-14] START
   ========================================================= */

initThemeToggle();
applyI18nStatic();

// initial state
setAppStatus(t("ready"));
setCount(0);
renderList([]);

// load data (cache + fetch)
loadData();


// Lang switcher
document.addEventListener('DOMContentLoaded', () => {
  try { mountLangSwitcher(document.querySelector('.headerActions')); } catch(e) {}
});
