/* =========================================================
   [UTILS-1] BASIC STRING HELPERS
   ========================================================= */

function clean(v){
  return (v ?? "").toString().trim();
}

function lower(v){
  return clean(v).toLowerCase();
}

/* =========================================================
   [UTILS-2] HTML ESCAPE
   ========================================================= */

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* =========================================================
   [UTILS-3] NORMALIZE FOR SEARCH (diacritics + spaces)
   ========================================================= */

function norm(s){
  return lower(s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")   // accents
    .replace(/\s+/g," ")
    .trim();
}

/* =========================================================
   [UTILS-4] STATUS
   ========================================================= */

function setStatus(statusEl, msg){
  if(statusEl) statusEl.textContent = msg;
}

/* =========================================================
   [UTILS-5] FLAGS (ISO2 -> emoji)
   - pays_code doit être ISO2 (TN, MA, DZ...)
   ========================================================= */

function isoToFlagEmoji(iso){
  if(!iso) return "🏳️";
  const code = String(iso).trim().toUpperCase();
  if(code.length !== 2) return "🏳️";
  const A = 0x1F1E6;
  const first = code.charCodeAt(0) - 65 + A;
  const second = code.charCodeAt(1) - 65 + A;
  return String.fromCodePoint(first, second);
}
// =====================
// i18n (langue navigateur)
// =====================
function detectLang() {
  const raw = (navigator.language || navigator.userLanguage || "fr").toLowerCase();
  if (raw.startsWith("ar")) return "ar";
  if (raw.startsWith("fr")) return "fr";
  if (raw.startsWith("nl")) return "nl";
  if (raw.startsWith("es")) return "es";
  if (raw.startsWith("it")) return "it";
  if (raw.startsWith("en")) return "en";
  return "en";
}

function getPreferredLang() {
  try {
    const saved = localStorage.getItem('zeed_lang');
    if (saved) return saved;
  } catch(e) {}
  return detectLang();
}

function setPreferredLang(lang) {
  try { localStorage.setItem('zeed_lang', lang); } catch(e) {}
  // reload to ensure every page applies the same language consistently
  location.reload();
}

function mountLangSwitcher(container) {
  if (!container) return;
  const current = getPreferredLang();
  const options = [
    {v:'fr', label:'FR'},
    {v:'en', label:'EN'},
    {v:'ar', label:'AR'},
    {v:'nl', label:'NL'},
    {v:'es', label:'ES'},
    {v:'it', label:'IT'},
  ];
  const wrap = document.createElement('div');
  wrap.className = 'lang-switch';
  const select = document.createElement('select');
  select.className = 'lang-select';
  select.setAttribute('aria-label','Language');
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.v; opt.textContent = o.label;
    if (o.v === current) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener('change', () => setPreferredLang(select.value));
  wrap.appendChild(select);
  container.appendChild(wrap);
}

function applyI18n(dict) {
  // textes
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (key && dict[key] != null) el.textContent = dict[key];
  });

  // placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key && dict[key] != null) el.setAttribute("placeholder", dict[key]);
  });

  // lang + direction
  const lang = dict.__lang || "fr";
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === "ar") ? "rtl" : "ltr";
}