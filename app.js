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
const API_URL = "https://script.google.com/macros/s/AKfycbyvwBHRDqOP0OGGCXk1K0TODk1Q9B8L1UZgFcd3_M1kiTjC-7ft6dQHrQVUkzY69WJX/exec";

// Cache localStorage for faster boot
const CACHE_KEY = "zeedna_words_cache_v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

/* =========================================================
   [APP-2] i18n (Search)
   ========================================================= */

const I18N = {
  fr: {
    ready: "Prêt",
    loading: "Chargement…",
    ok: (n) => `OK — ${n} entrées`,
    error: "Erreur chargement (ouvre la console)",
    search_ph: "Chercher un mot (arabe, translit, FR, EN, NL, Arabe classique)...",
    search_btn: "Rechercher",
    all_dialects: "Tous les dialectes",
    modal_close: "Fermer",
    results_count: (n) => `${n} résultat(s)` ,
    no_results: "Ton mot n’est pas encore dispo",
    no_results_cta: "➕ L’ajouter en contribution"
  },
  en: {
    ready: "Ready",
    loading: "Loading…",
    ok: (n) => `OK — ${n} entries`,
    error: "Load error (open console)",
    search_ph: "Search a word (Arabic, translit, FR, EN, NL, Classical Arabic)...",
    search_btn: "Search",
    all_dialects: "All dialects",
    modal_close: "Close",
    results_count: (n) => `${n} result(s)` ,
    no_results: "This word isn’t available yet",
    no_results_cta: "➕ Add it as a contribution"
  },
  ar: {
    ready: "جاهز",
    loading: "جارٍ التحميل…",
    ok: (n) => `تم — ${n} مدخلة`,
    error: "خطأ في التحميل (افتح وحدة التحكم)",
    search_ph: "ابحث عن كلمة (عربي، كتابة لاتينية، FR، EN، NL، العربية الكلاسيكية)...",
    search_btn: "بحث",
    all_dialects: "كل اللهجات",
    modal_close: "إغلاق",
    results_count: (n) => `${n} نتيجة`,
    no_results: "الكلمة غير متوفّرة بعد",
    no_results_cta: "➕ أضِفها كمساهمة"
  }
};

function detectLang(){
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("ar")) return "ar";
  if (nav.startsWith("fr")) return "fr";
  return "en";
}

const LANG = detectLang();

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
  // setStatus must exist in utils.js
  try { setStatus(statusEl, msg); } catch(e) { if(statusEl) statusEl.textContent = msg; }
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

function saveCache(data){
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch(e){}
}

function readCache(){
  try {
    const raw = localStorage.getItem(CACHE_KEY);
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
      synIndex = buildSynIndex(rows);
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
    const res = await fetch(API_URL, { cache: "no-store" });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if(!Array.isArray(data)) throw new Error("Réponse JSON invalide (pas un tableau)");

    saveCache(data);

    rows = data.map(normalizeRow).filter(r => r.actifBool);
    synIndex = buildSynIndex(rows);
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

  const fr = clean(r.sens_dialectal) || clean(r.traduction_fr) || clean(r.sens_fr);
  const en = clean(r.traduction_eng) || clean(r.traduction_en);
  const nl = clean(r.traduction_nl);
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

  obj._search = norm([
    obj.mot_arabe,
    obj.transliteration,
    obj.fr,
    obj.en,
    obj.nl,
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
  if(!items.length){
    clearSuggestions();
    return;
  }

  suggestionsEl.innerHTML = items.map(it => {
    const label = it.label;
    return `<button type="button" class="suggest-item" data-q="${escapeHtml(it.q)}">${label}</button>`;
  }).join("");

  suggestionsEl.style.display = "block";

  suggestionsEl.querySelectorAll(".suggest-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const q = btn.getAttribute("data-q") || "";
      if(qEl) qEl.value = q;
      clearSuggestions();
      performSearch();
    });
  });
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

  // limit suggestions
  const MAX = 8;
  const out = [];
  for(const r of rows){
    if(!r || !r._search) continue;
    if(!r._search.includes(nq)) continue;

    const ar = r.mot_arabe ? `<span dir="rtl" style="direction:rtl; unicode-bidi:plaintext;">${escapeHtml(r.mot_arabe)}</span>` : "";
    const tr = r.transliteration ? ` <span class="muted">(${escapeHtml(r.transliteration)})</span>` : "";
    const fr = r.fr ? ` <span class="muted">— ${escapeHtml(r.fr)}</span>` : "";
    const flag = isoToFlagEmoji(r.pays_code);

    const display = `${flag} ${ar}${tr}${fr}`;

    // use Arabic if available, else transliteration, else query
    const qUse = r.mot_arabe || r.transliteration || q;

    out.push({ q: qUse, label: display });
    if(out.length >= MAX) break;
  }

  renderSuggestions(out);
}, 120);

/* =========================================================
   [APP-9] FILTER + RENDER LIST (triggered by Search button)
   ========================================================= */

function applyFilters(){
  const q = norm(qEl?.value || "");
  const dialect = clean(dialectEl?.value || "");

  const hasSearch = q.length > 0 || dialect.length > 0;

  if(!hasSearch){
    filteredRows = [];
    renderList([]);
    setCount(0);
    return;
  }

  filteredRows = rows.filter(r => {
    const okDialect = !dialect || r.pays_code === dialect;
    const okQ = !q || r._search.includes(q);
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

    if(qRaw || dialect){
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

  for(const row of data){
    resultsEl.appendChild(renderCard(row));
  }
}

function renderCard(row){
  const card = document.createElement("div");
  card.className = "card";

  const flag = isoToFlagEmoji(row.pays_code);

  const lines = [];
  if(row.fr) lines.push(`<div class="trad-line"><span class="tag">FR</span><span>${escapeHtml(row.fr)}</span></div>`);
  if(row.en) lines.push(`<div class="trad-line"><span class="tag">EN</span><span>${escapeHtml(row.en)}</span></div>`);
  if(row.nl) lines.push(`<div class="trad-line"><span class="tag">NL</span><span>${escapeHtml(row.nl)}</span></div>`);
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

  card.addEventListener("click", () => openModal(row));
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
  if(row.fr) metaLines.push(`<div class="trad-line"><span class="tag">FR</span><span>${escapeHtml(row.fr)}</span></div>`);
  if(row.en) metaLines.push(`<div class="trad-line"><span class="tag">EN</span><span>${escapeHtml(row.en)}</span></div>`);
  if(row.nl) metaLines.push(`<div class="trad-line"><span class="tag">NL</span><span>${escapeHtml(row.nl)}</span></div>`);
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
  const list = findSynonyms(baseRow, rows, synIndex, 12);
  if(!list.length){
    mSyn.innerHTML = "";
    return;
  }

  mSyn.innerHTML = list.map(it => {
    const r = it.row;
    const flag = isoToFlagEmoji(r.pays_code);

    const frLine = r.fr ? `<div class="trad-line"><span class="tag">FR</span><span>${escapeHtml(r.fr)}</span></div>` : "";
    const enLine = r.en ? `<div class="trad-line"><span class="tag">EN</span><span>${escapeHtml(r.en)}</span></div>` : "";

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
          ${frLine}
          ${enLine}
        </div>
      </div>
    `;
  }).join("");

  mSyn.querySelectorAll(".syn-card").forEach(c => {
    c.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = c.getAttribute("data-id");
      const target = rows.find(x => x.mot_id === id);
      if(target) openModal(target);
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
