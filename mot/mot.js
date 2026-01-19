/* =========================================================
   ZEEDNA 3AMIAT — WORD PAGE (mot)
   URL: /mot/?id=<slug>--<CC>
   ========================================================= */

// Keep same API as the rest of the site
const API_URL = "https://script.google.com/macros/s/AKfycbyvwBHRDqOP0OGGCXk1K0TODk1Q9B8L1UZgFcd3_M1kiTjC-7ft6dQHrQVUkzY69WJX/exec";

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
    contribute_btn: "➕ Contribuer",
      tr_help_link: "Comment lire la translittération ?",
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
    contribute_btn: "➕ Contribute",
      tr_help_link: "How to read transliteration?",
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
    contribute_btn: "➕ ساهم",
      tr_help_link: "كيف نقرأ النقل الصوتي؟",
    more: "كلمات مقترحة أخرى",
    kv_country: "البلد",
    kv_category: "الصنف",
    kv_source: "لغة الأصل",
    kv_origin: "الأصل",
    kv_number: "العدد",
    kv_desc: "الوصف",
    kv_example: "مثال"
  }
};

function detectLang(){
  const nav = (navigator.language || "en").toLowerCase();
  if(nav.startsWith("ar")) return "ar";
  if(nav.startsWith("fr")) return "fr";
  return "en";
}
const LANG = detectLang();

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
    if(k === "word_contribute_btn") el.textContent = t("contribute_btn");
    if(k === "word_more") el.textContent = t("more");
    if(k === "word_nf_title") el.textContent = t("not_found_title");
    if(k === "word_nf_hint") el.textContent = t("not_found_hint");
  });

  if(wordStatusEl) wordStatusEl.textContent = t("loading");
  if(nfContribEl) nfContribEl.textContent = t("contribute_btn");
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
   Data normalize
   ===================== */

function lower(s){ return (s || "").toString().toLowerCase(); }

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

  const lines = [];
  lines.push(`<div class="trad-line"><span class="tag">${flag}</span>${row.registre ? `<span class="small">${escapeHtml(row.registre)}</span>` : ""}</div>`);
  if(row.fr) lines.push(`<div class="trad-line"><span class="tag">FR</span><span>${escapeHtml(row.fr)}</span></div>`);
  if(row.en) lines.push(`<div class="trad-line"><span class="tag">EN</span><span>${escapeHtml(row.en)}</span></div>`);
  if(row.nl) lines.push(`<div class="trad-line"><span class="tag">NL</span><span>${escapeHtml(row.nl)}</span></div>`);
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
      ? findSynonyms(row, rows, synIndex, 12)
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
            ${r.fr ? `<div class="trad-line"><span class="tag">FR</span><span>${escapeHtml(r.fr)}</span></div>` : ""}
            ${r.en ? `<div class="trad-line"><span class="tag">EN</span><span>${escapeHtml(r.en)}</span></div>` : ""}
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
    const res = await fetch(API_URL, { cache: "no-store" });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if(!Array.isArray(data)) throw new Error("Invalid JSON (not an array)");

    const rows = data.map(normalizeRow).filter(r => r.actifBool);
    const synIndex = (typeof buildSynIndex === "function") ? buildSynIndex(rows) : null;

    const found = findRowById(route, rows);
    if(!found){
      showNotFound(route);
      return;
    }

    if(wordStatusEl) wordStatusEl.style.display = "none";
    if(wordNotFoundEl) wordNotFoundEl.style.display = "none";
    if(wordViewEl) wordViewEl.style.display = "block";

    renderWord(found, rows, synIndex);

  }catch(e){
    console.error(e);
    if(wordStatusEl) wordStatusEl.textContent = "❌ Error loading data";
  }
}

main();
