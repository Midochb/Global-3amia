/* =========================================================
   ZEEDNA 3AMIAT — ROUTER (Patch #90)
   ========================================================= */
(function(){
  window.Zeedna = window.Zeedna || {};
  const Z = window.Zeedna;

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
  // keep country codes lowercase in URLs for consistency: ...--ma/
  const cc = (row.pays_code || "").toLowerCase().trim();
  return `#mot=${encodeURIComponent(base)}--${encodeURIComponent(cc)}`;
}

function buildIdForRow(row){
  const a = slugify(row.mot_arabe || "");
  const tr = slugify(row.transliteration || "");
  const base = a || tr || "mot";
  // keep country codes lowercase in URLs for consistency: ...--ma/
  const cc = (row.pays_code || "").toLowerCase().trim();
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

  function findRowFromHash(route, rows){
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

  async function openFromCurrentHash(rows){
    const route = parseHash();
    if(!route) return;
    const row = findRowFromHash(route, rows || []);
    if(row && Z.modal) Z.modal.openModal(row, rows || []);
  }

  function readSearchParams(){
    const sp = new URLSearchParams(location.search);
    return {
      q: sp.get("q") || "",
      d: sp.get("dialect") || ""
    };
  }

  function writeSearchParams(q, dialect){
    const sp = new URLSearchParams(location.search);
    if(q) sp.set("q", q); else sp.delete("q");
    if(dialect) sp.set("dialect", dialect); else sp.delete("dialect");
    const qs = sp.toString();
    history.replaceState({}, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }

  Z.router = {
    slugify,
    buildHashForRow,
    buildIdForRow,
    wordPageUrlForRow,
    parseHash,
    findRowFromHash: (route, rows)=>findRowFromHash(route, rows),
    openFromCurrentHash,
    readSearchParams,
    writeSearchParams
  };
})();
