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

const API_URL = "https://script.google.com/macros/s/AKfycbz6qw-BRd6UFG0ZeVlFT72m8uDQIsXXocJ5XGYYkaBr7Ne32zHGDUvONNU05ik7bog/exec";

/* =========================================================
   [APP-2] DOM ELEMENTS
   ========================================================= */

// UI elements
const qEl = document.getElementById("q");
const dialectEl = document.getElementById("dialect");
const resultsEl = document.getElementById("results");
const countEl = document.getElementById("count");
const statusEl = document.getElementById("status");

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
   [APP-3] STATE
   ========================================================= */

let rows = [];
let filteredRows = [];
let synIndex = null;

/* =========================================================
   [APP-4] HELPERS (local)
   ========================================================= */

function setAppStatus(msg){
  // setStatus(htmlElement, msg) doit exister dans ton utils
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
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-") // garde aussi l'arabe
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildHashForRow(row){
  const a = slugify(row.mot_arabe || "");
  const t = slugify(row.transliteration || "");
  const base = a || t || "mot";
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
    const t = slugify(r.transliteration || "");
    return a === slug || t === slug;
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
   [APP-5] LOAD + NORMALIZE DATA
   ========================================================= */

async function loadData(){
  setAppStatus("Chargement…");
  try{
    const res = await fetch(API_URL, { cache: "no-store" });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if(!Array.isArray(data)) throw new Error("Réponse JSON invalide (pas un tableau)");

    rows = data.map(normalizeRow).filter(r => r.actifBool);

    // Build synonym index (FR + EN) — sans concept_id
    synIndex = buildSynIndex(rows);

    buildDialectDropdown(rows);
    applyFilters();
    openFromCurrentHash();

    setAppStatus(`OK — ${rows.length} entrées`);
  }catch(e){
    console.error(e);
    setAppStatus("Erreur chargement (ouvre la console)");
  }
}

function normalizeRow(r){
  const actifRaw = clean(r.actif);
  const actifBool = actifRaw === "" ? true : ["true","1","oui","vrai"].includes(lower(actifRaw));

  // FR: ton champ principal est sens_dialectal (col K)
  const fr = clean(r.sens_dialectal) || clean(r.traduction_fr);

  // EN: traduction_eng fallback traduction_en
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
   [APP-6] DIALECT DROPDOWN
   ========================================================= */

function buildDialectDropdown(data){
  if(!dialectEl) return;

  const set = new Set(data.map(x => x.pays_code).filter(Boolean));
  const list = Array.from(set).sort();

  dialectEl.innerHTML = `<option value="">Tous les dialectes</option>`;
  for(const code of list){
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = `${isoToFlagEmoji(code)} ${code}`;
    dialectEl.appendChild(opt);
  }
}

/* =========================================================
   [APP-7] FILTER + RENDER LIST
   ========================================================= */

function applyFilters(){
  const q = norm(qEl?.value || "");
  const dialect = clean(dialectEl?.value || "");

  // ✅ Ne rien afficher tant qu’il n’y a pas au moins une recherche OU un filtre dialecte
  const hasSearch = q.length > 0 || dialect.length > 0;

  if(!hasSearch){
    filteredRows = [];
    renderList([]); // ✅ IMPORTANT: ta fonction s’appelle renderList
    if(countEl) countEl.textContent = `0 résultat(s)`;
    return;
  }

  filteredRows = rows.filter(r => {
    const okDialect = !dialect || r.pays_code === dialect;
    const okQ = !q || r._search.includes(q);
    return okDialect && okQ;
  });

  renderList(filteredRows); // ✅ IMPORTANT
  if(countEl) countEl.textContent = `${filteredRows.length} résultat(s)`;
}

function renderList(data){
  if(!resultsEl) return;
  resultsEl.innerHTML = "";

  if(!data.length){
    resultsEl.innerHTML = `<div class="muted small" style="padding:10px;">Aucun résultat</div>`;
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
   [APP-8] MODAL OPEN/CLOSE
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
  if(row.fu) metaLines.push(`<div class="trad-line"><span class="tag">Fouss7a</span>${safeDirRTL(row.fu)}</div>`);
  mMeta.innerHTML = metaLines.join("");

  // ✅ PATCH 3 : pas d’ID affiché
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

  // Synonyms (FR + EN) — clickable
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
   [APP-9] MODAL → SYNONYMS (FR + EN)
   ========================================================= */

function renderSynonyms(baseRow){
  if(!mSyn) return;

  const list = findSynonyms(baseRow, rows, synIndex, 12);

  // ✅ PATCH 3 : on n'affiche rien si pas de synonymes
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

  const cards = mSyn.querySelectorAll(".syn-card");
  cards.forEach(c => {
    c.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = c.getAttribute("data-id");
      const target = rows.find(x => x.mot_id === id);
      if(target) openModal(target);
    });
  });
}

/* =========================================================
   [APP-10] EVENTS
   ========================================================= */

qEl?.addEventListener("input", applyFilters);
dialectEl?.addEventListener("change", applyFilters);

elClose?.addEventListener("click", closeModal);
elBackdrop?.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeModal(); });
window.addEventListener("popstate", () => {
  if(location.hash && location.hash.startsWith("#mot=")){
    openFromCurrentHash();
  }else{
    closeModal();
  }
});

/* =========================================================
   [APP-11] START
   ========================================================= */
initThemeToggle();
loadData();
