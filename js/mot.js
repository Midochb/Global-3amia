// Zeedna3amia - Word detail page (stable)
(() => {
  const API_URL = 'https://script.google.com/macros/s/AKfycbxRvetENGm215GS4OowKMa_BqHBi5CNEWOgzQ5k5D7UaaItvPHLj2N1tmCBjVB_WZN1/exec';
  const CACHE_KEY = 'zeedna3amia_data_v108';
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

  const el = (id) => document.getElementById(id);
  const statusEl = el('status');
  const cardEl = el('wordCard');

  const COUNTRY_LABEL = {
    TN: 'Tunisie', MA: 'Maroc', DZ: 'Algérie', EG: 'Égypte', LY: 'Libye',
    IQ: 'Irak', SD: 'Soudan', SA: 'Arabie saoudite', AE: 'Émirats',
    KW: 'Koweït', QA: 'Qatar', BH: 'Bahreïn', OM: 'Oman', JO: 'Jordanie',
    LB: 'Liban', SY: 'Syrie', PS: 'Palestine', YE: 'Yémen'
  };

  function safeStr(v) { return (v === null || v === undefined) ? '' : String(v); }
  function escapeHtml(s) {
    return safeStr(s)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function normalizeRow(raw) {
    const mot_arabe = safeStr(raw.mot_arabe || raw['Mot (arabe)'] || raw.mot);
    const transliteration = safeStr(raw.transliteration || raw['Phonétique'] || raw.phonetique);
    const traduction = safeStr(raw.traduction || raw['Mot (français)'] || raw.fr);
    const fouss7a = safeStr(raw.Fouss7a || raw.fouss7a || raw['Arabe classique']);
    const pays_code = safeStr(raw.pays_code || raw.pays || raw.country).toUpperCase();
    const region = safeStr(raw.region || raw.ville || raw['Région']);
    const categorie = safeStr(raw.categorie_grammaticale || raw.categorie);
    const registre = safeStr(raw.registre);

    const keyParts = [mot_arabe, transliteration, traduction, pays_code, region].map(s => s.trim());
    const key = encodeURIComponent(keyParts.join('|'));

    return { key, mot_arabe, transliteration, traduction, fouss7a, pays_code, region, categorie, registre, _raw: raw };
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.ts || !Array.isArray(obj.data)) return null;
      if (Date.now() - obj.ts > CACHE_TTL_MS) return null;
      return obj.data;
    } catch { return null; }
  }

  function saveCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch {}
  }

  async function fetchJsonWithTimeout(url, timeoutMs = 12000) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const txt = await res.text();
      return JSON.parse(txt);
    } finally {
      clearTimeout(t);
    }
  }

  function setStatus(txt, state) {
    statusEl.textContent = txt;
    statusEl.dataset.state = state || 'ready';
  }

  function render(row) {
    const country = row.pays_code;
    const countryLabel = COUNTRY_LABEL[country] || country;

    cardEl.innerHTML = `
      <div class="wordHeader">
        <div>
          <div class="wordArabic">${escapeHtml(row.mot_arabe || '—')}</div>
          <div class="wordLatin">${escapeHtml(row.transliteration || '')}</div>
        </div>
        <div class="badge big">${escapeHtml(country || '—')}</div>
      </div>

      <div class="wordMeaning">${escapeHtml(row.traduction || '')}</div>

      <div class="wordMeta">
        <div><span>Pays</span><strong>${escapeHtml(countryLabel || '')}</strong></div>
        <div><span>Région</span><strong>${escapeHtml(row.region || '')}</strong></div>
        <div><span>Catégorie</span><strong>${escapeHtml(row.categorie || '')}</strong></div>
        <div><span>Registre</span><strong>${escapeHtml(row.registre || '')}</strong></div>
      </div>

      ${row.fouss7a ? `<div class="wordFusha"><span>Arabe classique</span><strong>${escapeHtml(row.fouss7a)}</strong></div>` : ''}

      <div class="actionsRow">
        <a class="btn" href="/recherche/">← Retour recherche</a>
        <a class="btn ghost" href="/ajouter/">Ajouter / corriger</a>
      </div>
    `;
  }

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const k = params.get('k');
    if (!k) {
      setStatus('Mot introuvable (clé manquante)', 'error');
      return;
    }

    setStatus('Chargement…', 'loading');

    let rawData = loadCache();
    if (!rawData) {
      try {
        const url = API_URL + '?action=index&_ts=' + Date.now();
        const json = await fetchJsonWithTimeout(url);
        rawData = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
        saveCache(rawData);
      } catch (e) {
        console.error(e);
        setStatus('Erreur chargement (ouvre la console)', 'error');
        return;
      }
    }

    const rows = rawData.map(normalizeRow);
    const found = rows.find(r => r.key === k);
    if (!found) {
      setStatus('Mot introuvable (cache pas à jour?)', 'error');
      return;
    }

    setStatus('Prêt', 'ready');
    render(found);
  }

  init();
})();
