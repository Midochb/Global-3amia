/* =========================================================
   [SYN-1] STOPWORDS
   ========================================================= */

const SYN_STOPWORDS_FR = new Set([
  "de","des","du","la","le","les","un","une","et","ou","a","à","au","aux",
  "en","dans","pour","par","sur","avec","sans","chez","ce","cet","cette","ces",
  "se","s","que","qui","quoi","dont","comme","il","elle","ils","elles",
  "tres","très","plus","moins"
]);

const SYN_STOPWORDS_EN = new Set([
  "the","a","an","and","or","to","of","in","on","for","with","without","by",
  "is","are","was","were","be","been","being","very","more","less"
]);

/* =========================================================
   [SYN-2] SPLIT SENSE ITEMS
   - gère : virgules, point-virgule, pipe, slash, retours ligne
   ========================================================= */

function synSplitItems(text){
  const t = clean(text);
  if(!t) return [];
  return t
    .replace(/[()]/g, " ")
    .replace(/[\n\r]/g, " ")
    .split(/[,;|/]+/g)
    .map(x => x.trim())
    .filter(Boolean);
}

/* =========================================================
   [SYN-3] TOKENIZE (FR / EN)
   ========================================================= */

function synTokenizeFR(text){
  const t = norm(text);
  if(!t) return [];
  return t
    .replace(/[^\p{L}\p{N}\s]/gu," ")
    .replace(/\s+/g," ")
    .trim()
    .split(" ")
    .filter(w => w && w.length >= 3 && !SYN_STOPWORDS_FR.has(w));
}

function synTokenizeEN(text){
  const t = norm(text);
  if(!t) return [];
  return t
    .replace(/[^\p{L}\p{N}\s]/gu," ")
    .replace(/\s+/g," ")
    .trim()
    .split(" ")
    .filter(w => w && w.length >= 3 && !SYN_STOPWORDS_EN.has(w));
}

/* =========================================================
   [SYN-4] EXTRACT KEYS (FR + EN)
   - clés phrase: fr:ph:beaucoup
   - clés token : fr:tk:enormement
   ========================================================= */

function synExtractSenseKeys(row, lang="fr"){
  const keys = new Set();

  // UI AR: pas de clustering par traduction (on évite les faux matchs)
  if(lang === "ar") return keys;

  // ✅ On extrait uniquement la langue UI
  if(lang === "fr"){
    for(const item of synSplitItems(row.fr)){
      const phrase = norm(item);
      if(phrase) keys.add(`fr:ph:${phrase}`);
      for(const tok of synTokenizeFR(item)) keys.add(`fr:tk:${tok}`);
    }
  } else {
    for(const item of synSplitItems(row.en)){
      const phrase = norm(item);
      if(phrase) keys.add(`en:ph:${phrase}`);
      for(const tok of synTokenizeEN(item)) keys.add(`en:tk:${tok}`);
    }
  }

  return keys;
}

/* =========================================================
   [SYN-5] BUILD INDEX key -> rows[]
   - à appeler 1 fois après loadData()
   ========================================================= */

function buildSynIndex(allRows, lang="fr"){
  const index = new Map();

  for(const r of allRows){
    if(!r || !r.actifBool) continue;

    const keys = synExtractSenseKeys(r, lang);
    r._synKeys = keys; // cache

    for(const k of keys){
      if(!index.has(k)) index.set(k, []);
      index.get(k).push(r);
    }
  }

  return index;
}

/* =========================================================
   [SYN-6] FIND SYNONYMS for one row
   - récupère les rows qui partagent des clés FR/EN
   - exclut le même mot_id
   - dédoublonne
   - tri: hits desc, autres pays en priorité
   ========================================================= */

function findSynonyms(row, allRows, synIndex, limit=10, lang="fr"){
  if(!row || !synIndex) return [];

  const baseKeys = row._synKeys || synExtractSenseKeys(row, lang);
  if(!baseKeys.size) return [];

  const hitCount = new Map(); // id -> {row, hits}

  for(const k of baseKeys){
    const bucket = synIndex.get(k);
    if(!bucket) continue;

    for(const cand of bucket){
      if(!cand || cand.mot_id === row.mot_id) continue;
      if(!cand.actifBool) continue;

      const id = cand.mot_id || `${cand.pays_code}::${cand.mot_arabe}`;
      const prev = hitCount.get(id);
      if(prev) prev.hits += 1;
      else hitCount.set(id, { row: cand, hits: 1 });
    }
  }

  let list = Array.from(hitCount.values());

  list.sort((a,b) => {
    if(b.hits !== a.hits) return b.hits - a.hits;
    const aOther = a.row.pays_code !== row.pays_code ? 1 : 0;
    const bOther = b.row.pays_code !== row.pays_code ? 1 : 0;
    if(bOther !== aOther) return bOther - aOther;
    return (a.row.mot_arabe || "").localeCompare(b.row.mot_arabe || "");
  });

  // Dédoublonnage visuel (même pays + même mot_arabe)
  const seen = new Set();
  const out = [];
  for(const it of list){
    const key = `${it.row.pays_code}::${it.row.mot_arabe}`;
    if(seen.has(key)) continue;
    seen.add(key);
    out.push(it);
    if(out.length >= limit) break;
  }

  return out;
}
