/* =========================================================
   ZEEDNA 3AMIAT — CORE (Patch #90)
   API + cache + row normalization
   ========================================================= */
(function(){
  window.Zeedna = window.Zeedna || {};
  const Z = window.Zeedna;

  // ✅ API Apps Script (JSON)
  const API_URL = "https://script.google.com/macros/s/AKfycbxRvetENGm215GS4OowKMa_BqHBi5CNEWOgzQ5k5D7UaaItvPHLj2N1tmCBjVB_WZN1/exec";
  Z.API_URL = API_URL;

  const CACHE_KEY_BASE = "zeedna_words_cache_v2";
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

  function cacheKey(){
    // cache per UI language (evite de charger des champs inutiles)
    const lang = (Z.i18n && Z.i18n.uiLang) ? Z.i18n.uiLang : "fr";
    return CACHE_KEY_BASE + "_" + lang;
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

  function normalizeRow(r){
  const actifRaw = clean(r.actif);
  const actifBool = actifRaw === "" ? true : ["true","1","oui","vrai"].includes(lower(actifRaw));

  const tr = clean(r.traduction);

  const uiLang = (window.Zeedna && window.Zeedna.i18n && window.Zeedna.i18n.uiLang) || (localStorage.getItem('zeedna_lang') || 'fr');

  let fr = clean(r.fr) || clean(r.traduction_fr) || clean(r.sens_dialectal) || clean(r.sens_fr);
  let en = clean(r.en) || clean(r.translation) || clean(r.traduction_en) || clean(r.traduction_eng);
  const nl = "";

  // Backward compatibility: many exports store the FR meaning in `traduction`.
  // Do not rely on browser/UI language to fill FR.
  if(tr){
    if(!fr) fr = tr;
    if(!en && uiLang === "en") en = tr;
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
    (uiLang === "ar") ? "" : meaning,
    obj.fu,
    obj.pays_code,
    obj.region,
    obj.categorie_grammaticale,
    obj.registre,
    obj.origine_mot
  ].join(" | "));

  return obj;
}

  async function loadData(){
    // 1) cache
    const cached = readCache();
    if(cached && Array.isArray(cached)){
      return cached.map(normalizeRow).filter(r => r.actifBool);
    }

    // 2) fetch
    const res = await fetch(API_URL, { cache: "no-store" });
    const json = await res.json();
    const rawRows = unwrapArrayPayload(json) || [];
    saveCache(rawRows);

    return rawRows.map(normalizeRow).filter(r => r.actifBool);
  }

  Z.core = { loadData, normalizeRow, unwrapArrayPayload, cache: { readCache, saveCache } };
})();
