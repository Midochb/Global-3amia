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

const API_URL = "https://script.google.com/macros/s/AKfycbyvwBHRDqOP0OGGCXk1K0TODk1Q9B8L1UZgFcd3_M1kiTjC-7ft6dQHrQVUkzY69WJX/exec";

/* =========================================================
   [APP-2] DOM ELEMENTS
   ========================================================= */

// UI elements
const qEl = document.getElementById("q");
const dialectEl = document.getElementById("dialect");
const resultsEl = document.getElementById("results");
const countEl = document.getElementById("count");
const statusEl = document.getElementById("status");
const homeBtn = document.getElementById("homeBtn");
const searchBtn = document.getElementById("searchBtn");
const suggestionsEl = document.getElementById("suggestions");

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
   [APP-3] i18n (Home language by browser)
   ========================================================= */

const I18N = {
  fr: {
    ready: "Prêt",
    loading: "Chargement…",
    ok: (n) => `OK — ${n} entrées`,
    error: "Erreur chargement (ouvre la console)",
    search_ph: "Chercher un mot (arabe, translit, FR, EN, NL, Fouss7a)...",
    search_btn: "Rechercher",
    contribute_btn: "➕ Contribuer",
    not_available: "Ton mot n'est pas encore disponible.",
    add_word: "Tu peux l'ajouter ici",
    all_dialects: "Tous les dialectes",
    modal_close: "Fermer",
    results_count: (n) => `${n} résultat(s)`,
    no_results: "Aucun résultat"
  },
  en: {
    ready: "Ready",
    loading: "Loading…",
    ok: (n) => `OK — ${n} entries`,
    error: "Load error (open console)",
    search_ph: "Search a word (Arabic, translit, FR, EN, NL, Fusha)...",
    search_btn: "Search",
    contribute_btn: "➕ Contribute",
    not_available: "This word is not available yet.",
    add_word: "You can add it here",
    all_dialects: "All dialects",
    modal_close: "Close",
    results_count: (n) => `${n} result(s)`,
    no_results: "No results"
  },
  ar: {
    ready: "جاهز",
    loading: "جارٍ التحميل…",
    ok: (n) => `تم — ${n} مدخلة`,
    error: "خطأ في التحميل (افتح وحدة التحكم)",
    search_ph: "ابحث عن كلمة (عربي، translit، FR، EN، NL، فصحى)...",
    search_btn: "بحث",
    contribute_btn: "➕ ساهم",
    not_available: "هذه الكلمة غير متوفرة بعد.",
    add_word: "يمكنك إضافتها هنا",
    all_dialects: "كل اللهجات",
    modal_close: "إغلاق",
    results_count: (n) => `${n} نتيجة`,
    no_results: "لا نتائج"
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
  return pack[key] ?? fr[key] ?? "";
}

function applyI18nStatic(){
  // html lang/dir
  document.documentElement.lang = LANG;
  document.documentElement.dir = (LANG === "ar") ? "rtl" : "ltr";

  // data-i18n
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if(!key) return;

    // mapping simple (ton HTML a home_contribute_btn)
    if(key === "home_contribute_btn"){
      el.textContent = t("contribute_btn");
    }
  });

  // placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if(key === "home_search_ph"){
      el.setAttribute("placeholder", t("search_ph"));
    }
  });

  // dropdown first option
  if(dialectEl){
    const first = dialectEl.querySelector("option[value='']");
    if(first) first.textContent = t("all_dialects");
  }

  // modal close text
  if(elClose) elClose.textContent = t("modal_close");
  if(searchBtn) searchBtn.textContent = t("search_btn");
}

function setCount(n){
  if(!countEl) return;
  const pack = I18N[LANG] || I18N.en;
  countEl.textContent = (pack.results_count) ? pack.results_count(n) : `${n}`;
}

/* =========================================================
   [APP-4] STATE
   ========================================================= */

let rows = [];
let filteredRows = [];
let synIndex = null;
let searchPerformed = false;
let lastSearchQ = "";
let lastSearchDialect = "";

/* =========================================================
   [APP-5] HELPERS (local)
   ========================================================= */

function setAppStatus(msg){
  // setStatus(htmlElement, msg) doit exister dans utils.js
  setStatus(statusEl, msg);
}

function safeDirRTL(ar){
  return `<span dir="rtl" style="direction:rtl; unicode-bidi:plaintext;">${escapeHtml(ar)}</span>`;
}

/* =========================================================
   [ROUTE] URL par fiche (hash routing)
   Format: #mot=<slug>--<pays>
   Exemple: #mot=barcha--TN
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
  const [slugEnc, ccEnc] = raw.split("--");
  const slug = decodeURIComponent(slugEnc || "").trim().toLowerCase();
  const cc = decodeURIComponent(ccEnc || "").trim().toUpperCase();

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
  if(found){
    openModal(found);
  }else{
    clearHash();
  }
}

/* =========================================================
   [APP-6] LOAD + NORMALIZE DATA
   ========================================================= */

async function loadData(){
  setAppStatus(t("loading"));
  try{
    const res = await fetch(API_URL, { cache: "no-store" });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if(!Array.isArray(data)) throw new Error("Réponse JSON invalide (pas un tableau)");

    rows = data.map(normalizeRow).filter(r => r.actifBool);

    // Synonyms index (FR + EN)
    synIndex = buildSynIndex(rows);

    buildDialectDropdown(rows);

    // Prefill from URL (?q=...&d=...)
    const sp = readSearchParams();
    if(qEl && sp.q) qEl.value = sp.q;
    if(dialectEl && sp.d){
      const opt = Array.from(dialectEl.options).find(o => (o.value||"" ).toUpperCase() === sp.d.toUpperCase());
      if(opt) dialectEl.value = opt.value;
    }

    performSearch();
    openFromCurrentHash();

    setAppStatus(t("ok")(rows.length));
  }catch(e){
    console.error(e);
    setAppStatus(t("error"));
  }
}

function normalizeRow(r){
  const actifRaw = clean(r.actif);
  const actifBool = actifRaw === "" ? true : ["true","1","oui","vrai"].includes(lower(actifRaw));

  const fr = clean(r.sens_dialectal) || clean(r.traduction_fr);
  const en = clean(r.traduction_eng) || clean(r.traduction_en);
  const nl = clean(r.traduction_nl);
  const fu = clean(r.Fouss7a);

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

  obj._search = norm([
    obj.mot_arabe,
    obj.transliteration,
    obj.fr,
    obj.en,
    obj.nl,
    obj.fu,
    obj.pays_code,
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
   [APP-8] FILTER + RENDER LIST
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

  renderList(filteredRows);
  setCount(filteredRows.length);
}

/* =========================================================
   [APP-8.5] SUGGESTIONS + SEARCH URL
   - Suggestions while typing (no auto render)
   - Search button generates shareable URL (?q=...&d=...)
   ========================================================= */

function getMatches(q, dialect, limit){
  const qq = norm(q || '');
  const dd = clean(dialect || '');
  if(!qq && !dd) return [];
  const out = [];
  for(const r of rows){
    if(dd && r.pays_code !== dd) continue;
    if(qq && !r._search.includes(qq)) continue;
    out.push(r);
    if(limit && out.length >= limit) break;
  }
  return out;
}

function setSearchParams(q, d){
  try{
    const url = new URL(window.location.href);
    if(q) url.searchParams.set('q', q); else url.searchParams.delete('q');
    if(d) url.searchParams.set('d', d); else url.searchParams.delete('d');
    history.replaceState({}, '', url.pathname + '?' + url.searchParams.toString() + (location.hash || ''));
  }catch(e){}
}

function readSearchParams(){
  try{
    const url = new URL(window.location.href);
    return {
      q: (url.searchParams.get('q') || ''),
      d: (url.searchParams.get('d') || '')
    };
  }catch(e){
    return { q:'', d:'' };
  }
}

function hideSuggestions(){
  if(!suggestionsEl) return;
  suggestionsEl.hidden = true;
  suggestionsEl.innerHTML = '';
}

function updateSuggestions(){
  if(!suggestionsEl) return;
  const q = (qEl?.value || '').trim();
  const d = (dialectEl?.value || '').trim();
  const list = getMatches(q, d, 8);

  if(!q && !d){
    hideSuggestions();
    return;
  }

  if(!list.length){
    suggestionsEl.hidden = false;
    const qs = new URLSearchParams();
    if(d) qs.set('pays', d);
    if(q) qs.set('mot', q);
    const href = `/contribuer/?${qs.toString()}`;
    suggestionsEl.innerHTML = `
      <div class="sug-item muted">${escapeHtml(t('not_available'))}</div>
      <a class="sug-item sug-link" href="${href}">➕ ${escapeHtml(t('add_word'))}</a>
    `;
    return;
  }

  suggestionsEl.hidden = false;
  suggestionsEl.innerHTML = list.map(r => {
    const label = (r.mot_arabe || r.transliteration || '—');
    const sub = r.fr ? ` <span class="muted">• ${escapeHtml(r.fr)}</span>` : '';
    const flag = isoToFlagEmoji(r.pays_code);
    return `
      <button type="button" class="sug-item" data-id="${escapeHtml(r.mot_id)}">
        <span class="sug-flag">${flag}</span>
        <span class="sug-label">${escapeHtml(label)}</span>${sub}
      </button>
    `;
  }).join('');

  suggestionsEl.querySelectorAll('[data-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      const target = rows.find(x => x.mot_id === id);
      if(target) openModal(target);
      hideSuggestions();
    });
  });
}

function performSearch(){
  const q = (qEl?.value || '').trim();
  const d = (dialectEl?.value || '').trim();

  lastSearchQ = q;
  lastSearchDialect = d;
  searchPerformed = !!(q || d);

  hideSuggestions();

  // Apply filters + render
  const qNorm = norm(q);
  const dialect = clean(d);

  if(!searchPerformed){
    filteredRows = [];
    renderList([]);
    setCount(0);
    setSearchParams('', '');
    return;
  }

  filteredRows = rows.filter(r => {
    const okDialect = !dialect || r.pays_code === dialect;
    const okQ = !qNorm || r._search.includes(qNorm);
    return okDialect && okQ;
  });

  renderList(filteredRows);
  setCount(filteredRows.length);
  setSearchParams(q, d);
}


function renderList(data){
  if(!resultsEl) return;
  resultsEl.innerHTML = "";

  if(!data.length){
    if(searchPerformed){
      const q = (lastSearchQ || '').trim();
      const d = (lastSearchDialect || '').trim();
      const qs = new URLSearchParams();
      if(d) qs.set('pays', d);
      if(q) qs.set('mot', q);
      const href = `/contribuer/?${qs.toString()}`;
      resultsEl.innerHTML = `
        <div class="muted small" style="padding:10px;">${escapeHtml(t('not_available'))}</div>
        <div style="padding:0 10px 10px;">
          <a class="cta" href="${href}">${escapeHtml(t('add_word'))}</a>
        </div>
      `;
    } else {
      resultsEl.innerHTML = '';
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
  if(row.fu) lines.push(`<div class="trad-line"><span class="tag">Fouss7a</span>${safeDirRTL(row.fu)}</div>`);

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
   [APP-9] MODAL OPEN/CLOSE
   ========================================================= */

function openModal(row){
  if(!elModal || !elBackdrop) return;

  setHashForRow(row);

  mWord.textContent = row.mot_arabe || "—";
  mTranslit.textContent = row.transliteration || "";

  const flag = isoToFlagEmoji(row.pays_code);

  const metaLines = [];
  metaLines.push(`<div class="trad-line"><span class="tag">${flag}</span>${row.registre ? `<span class="small">${escapeHtml(row.registre)}</span>` : ""}</div>`);
  if(row.fr) metaLines.push(`<div class="trad-line"><span class="tag">FR</span><span>${escapeHtml(row.fr)}</span></div>`);
  if(row.en) metaLines.push(`<div class="trad-line"><span class="tag">EN</span><span>${escapeHtml(row.en)}</span></div>`);
  if(row.nl) metaLines.push(`<div class="trad-line"><span class="tag">NL</span><span>${escapeHtml(row.nl)}</span></div>`);
  if(row.fu) metaLines.push(`<div class="trad-line"><span class="tag">Fouss7a</span>${safeDirRTL(row.fu)}</div>`);
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
   [APP-10] MODAL → SYNONYMS (FR + EN)
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

  // click sur une carte synonyme
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
   [APP-10] EVENTS + HASH ROUTING
   ========================================================= */

qEl?.addEventListener("input", updateSuggestions);

// Enter = lancer la recherche
qEl?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    performSearch();
  }
});

searchBtn?.addEventListener("click", () => performSearch());

dialectEl?.addEventListener("change", () => {
  updateSuggestions();
});

// click ailleurs => cache suggestions
document.addEventListener("click", (e) => {
  const t = e.target;
  const inside = (t && suggestionsEl && (suggestionsEl.contains(t) || t === qEl));
  if (!inside) hideSuggestions();
});

elClose?.addEventListener("click", closeModal);
elBackdrop?.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// Important: quand on navigue dans l’historique (back/forward)
window.addEventListener("popstate", () => {
  if (location.hash && location.hash.startsWith("#mot=")) {
    openFromCurrentHash();
  } else {
    closeModal();
  }
});
// Important: quand le hash change (#mot=...)
window.addEventListener("hashchange", () => {
  if (location.hash && location.hash.startsWith("#mot=")) {
    openFromCurrentHash();
  } else {
    closeModal();
  }
});
/* =========================================================
   [APP-11] HOME CLICK (logo)
   ========================================================= */

function goHome(){
  // ferme la modale si ouverte
  closeModal();

  // reset filtres
  if(qEl) qEl.value = "";
  if(dialectEl) dialectEl.value = "";

  // vide résultats
  filteredRows = [];
  renderList([]);
  setCount(0);

  // reset url
  history.pushState({}, "", "/");
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
   [APP-12] START
   ========================================================= */

initThemeToggle();
applyI18nStatic();
loadData();