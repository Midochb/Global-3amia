// Zeedna3amia - Search page app (stable)
(() => {
  const API_URL = 'https://script.google.com/macros/s/AKfycbxRvetENGm215GS4OowKMa_BqHBi5CNEWOgzQ5k5D7UaaItvPHLj2N1tmCBjVB_WZN1/exec';
  const CACHE_KEY = 'zeedna3amia_data_v108';
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

  const qEl = document.getElementById('q');
  const btnEl = document.getElementById('btnSearch');
  const countryEl = document.getElementById('country');
  const statusEl = document.getElementById('status');
  const countEl = document.getElementById('count');
  const resultsEl = document.getElementById('results');
  const loadMoreEl = document.getElementById('loadMore');
  const suggestBoxEl = document.getElementById('suggestBox');

  const COUNTRY_LABEL = {
    TN: 'Tunisie', MA: 'Maroc', DZ: 'Algérie', EG: 'Égypte', LY: 'Libye',
    IQ: 'Irak', SD: 'Soudan', SA: 'Arabie saoudite', AE: 'Émirats',
    KW: 'Koweït', QA: 'Qatar', BH: 'Bahreïn', OM: 'Oman', JO: 'Jordanie',
    LB: 'Liban', SY: 'Syrie', PS: 'Palestine', YE: 'Yémen'
  };

  function isArabic(s) {
    return /[\u0600-\u06FF]/.test(s);
  }

  function safeStr(v) {
    return (v === null || v === undefined) ? '' : String(v);
  }

  function normalizeRow(raw) {
    const mot_arabe = safeStr(raw.mot_arabe || raw['Mot (arabe)'] || raw['mot arabe'] || raw.mot || raw.arabe);
    const transliteration = safeStr(raw.transliteration || raw['Phonétique'] || raw.phonetique || raw['Translit'] || raw['translitération']);
    const traduction = safeStr(raw.traduction || raw['Mot (français)'] || raw.fr || raw.francais || raw['traduction fr']);
    const fouss7a = safeStr(raw.Fouss7a || raw.fouss7a || raw['Arabe classique'] || raw.fusha);
    const pays_code = safeStr(raw.pays_code || raw.pays || raw.country || raw['pays_code']);
    const region = safeStr(raw.region || raw.ville || raw['Région'] || raw['region']);
    const categorie = safeStr(raw.categorie_grammaticale || raw.categorie || raw['categorie']);
    const registre = safeStr(raw.registre || raw['registre']);

    let pc = pays_code.toUpperCase();
    if (!pc) {
      const r = region.toLowerCase();
      if (['zarzis','tunis','sfax','sousse','bizerte','gabes'].some(x=>r.includes(x))) pc = 'TN';
      else if (['rabat','kenitra','casablanca','fes','marrakech','agadir','oujda'].some(x=>r.includes(x))) pc = 'MA';
      else if (['alger','oran','constantine','annaba','setif'].some(x=>r.includes(x))) pc = 'DZ';
      else if (['le caire','cairo','alexandrie','alexandria','gizeh','giza'].some(x=>r.includes(x))) pc = 'EG';
      else if (['tripoli','benghazi','misrata'].some(x=>r.includes(x))) pc = 'LY';
    }

    const keyParts = [mot_arabe, transliteration, traduction, pc, region].map(s => s.trim());
    const key = encodeURIComponent(keyParts.join('|'));

    const searchLatin = (traduction + ' ' + transliteration + ' ' + fouss7a).toLowerCase();
    const searchArabic = (mot_arabe + ' ' + fouss7a).toLowerCase();

    return {
      key,
      mot_arabe,
      transliteration,
      traduction,
      fouss7a,
      pays_code: pc,
      region,
      categorie,
      registre,
      _searchLatin: searchLatin,
      _searchArabic: searchArabic,
      _raw: raw,
    };
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

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.ts || !Array.isArray(obj.data)) return null;
      if (Date.now() - obj.ts > CACHE_TTL_MS) return null;
      return obj.data;
    } catch {
      return null;
    }
  }

  function saveCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch {}
  }

  function setLoading(isLoading, msg) {
    qEl.disabled = isLoading;
    btnEl.disabled = isLoading;
    countryEl.disabled = isLoading;
    statusEl.textContent = msg || (isLoading ? 'Chargement…' : 'Prêt');
    statusEl.dataset.state = isLoading ? 'loading' : 'ready';
  }

  function clearResults() {
    resultsEl.innerHTML = '';
    countEl.textContent = '0 résultat(s)';
    loadMoreEl.style.display = 'none';
  }

  function escapeHtml(s) {
    return safeStr(s)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function renderCard(row) {
    const country = row.pays_code || '';
    const countryLabel = COUNTRY_LABEL[country] || country;
    const region = row.region ? escapeHtml(row.region) : '';

    const fr = row.traduction ? escapeHtml(row.traduction) : '';
    const tr = row.transliteration ? escapeHtml(row.transliteration) : '';
    const ar = row.mot_arabe ? escapeHtml(row.mot_arabe) : '';

    const meta = [countryLabel, region].filter(Boolean).join(' • ');

    return `
      <a class="card" href="/mot/?k=${row.key}">
        <div class="cardTop">
          <div class="cardArabic">${ar || '—'}</div>
          <div class="badge">${escapeHtml(country || '—')}</div>
        </div>
        <div class="cardLatin">${tr || ''}</div>
        <div class="cardFr">${fr || ''}</div>
        <div class="cardMeta">${escapeHtml(meta)}</div>
      </a>
    `;
  }

  function populateCountrySelect(rows) {
    const codes = new Set();
    for (const r of rows) {
      if (r.pays_code) codes.add(r.pays_code);
    }
    const sorted = [...codes].sort((a,b) => (COUNTRY_LABEL[a]||a).localeCompare((COUNTRY_LABEL[b]||b), 'fr'));

    countryEl.innerHTML = '';
    const optAll = document.createElement('option');
    optAll.value = '';
    optAll.textContent = 'Tous les pays';
    countryEl.appendChild(optAll);

    for (const c of sorted) {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = COUNTRY_LABEL[c] || c;
      countryEl.appendChild(opt);
    }
  }

  function makeSuggestions(rows, q) {
    const qTrim = q.trim();
    if (!qTrim) return [];
    const qLower = qTrim.toLowerCase();
    const arab = isArabic(qTrim);

    const out = [];
    for (const r of rows) {
      const hay = arab ? r._searchArabic : r._searchLatin;
      if (!hay) continue;
      if (hay.startsWith(qLower) || hay.includes(' ' + qLower)) {
        out.push(r);
        if (out.length >= 8) break;
      }
    }
    return out;
  }

  function renderSuggestions(list) {
    if (!list.length) {
      suggestBoxEl.style.display = 'none';
      suggestBoxEl.innerHTML = '';
      return;
    }
    suggestBoxEl.style.display = 'block';
    suggestBoxEl.innerHTML = list.map(r => {
      const left = r.traduction ? escapeHtml(r.traduction) : (r.transliteration ? escapeHtml(r.transliteration) : '');
      const right = r.mot_arabe ? escapeHtml(r.mot_arabe) : '';
      const code = escapeHtml(r.pays_code || '');
      return `<div class="suggestItem" data-k="${r.key}"><span>${left}</span><span class="suggestRight">${right} <em>${code}</em></span></div>`;
    }).join('');
  }

  function filterRows(rows, q, country) {
    const qTrim = q.trim();
    if (!qTrim) return [];

    const arab = isArabic(qTrim);
    const qLower = qTrim.toLowerCase();

    const matches = [];
    for (const r of rows) {
      if (country && r.pays_code !== country) continue;

      if (arab) {
        if (r._searchArabic.includes(qLower)) matches.push(r);
      } else {
        const hay = (r.traduction + ' ' + r.transliteration + ' ' + r.fouss7a).toLowerCase();
        if (hay.includes(qLower)) matches.push(r);
      }
    }
    return matches;
  }

  let ALL = [];
  let CURRENT = [];
  let PAGE = 0;
  const PAGE_SIZE = 20;

  function renderPage(reset = false) {
    if (reset) {
      PAGE = 0;
      resultsEl.innerHTML = '';
    }

    const start = PAGE * PAGE_SIZE;
    const slice = CURRENT.slice(start, start + PAGE_SIZE);
    resultsEl.insertAdjacentHTML('beforeend', slice.map(renderCard).join(''));

    const total = CURRENT.length;
    countEl.textContent = `${total} résultat(s)`;

    PAGE += 1;
    loadMoreEl.style.display = (PAGE * PAGE_SIZE < total) ? 'inline-flex' : 'none';
  }

  function doSearch(pushState = true) {
    const q = qEl.value || '';
    const country = countryEl.value || '';

    CURRENT = filterRows(ALL, q, country);
    renderPage(true);

    if (pushState) {
      const params = new URLSearchParams(window.location.search);
      q ? params.set('q', q) : params.delete('q');
      country ? params.set('c', country) : params.delete('c');
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? ('?' + qs) : ''));
    }
  }

  function readInitialParams() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const c = params.get('c') || '';
    qEl.value = q;
    return { q, c };
  }

  async function init() {
    setLoading(true, 'Chargement…');
    clearResults();

    const initial = readInitialParams();

    let rawData = loadCache();
    if (!rawData) {
      try {
        const url = API_URL + '?action=index&_ts=' + Date.now();
        const json = await fetchJsonWithTimeout(url);
        const arr = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : (Array.isArray(json.rows) ? json.rows : []));
        rawData = arr;
        saveCache(rawData);
      } catch (e) {
        console.error('Load error', e);
        setLoading(false, 'Erreur chargement (ouvre la console)');
        statusEl.dataset.state = 'error';
        return;
      }
    }

    ALL = rawData.map(normalizeRow);

    populateCountrySelect(ALL);
    if (initial.c && [...countryEl.options].some(o => o.value === initial.c)) {
      countryEl.value = initial.c;
    }

    setLoading(false, 'Prêt');

    if ((initial.q || '').trim()) {
      doSearch(false);
    }

    btnEl.addEventListener('click', () => doSearch(true));
    loadMoreEl.addEventListener('click', () => renderPage(false));

    qEl.addEventListener('input', () => {
      const list = makeSuggestions(ALL, qEl.value);
      renderSuggestions(list);
    });

    qEl.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        renderSuggestions([]);
        doSearch(true);
      }
      if (ev.key === 'Escape') {
        renderSuggestions([]);
      }
    });

    document.addEventListener('click', (ev) => {
      const t = ev.target;
      const item = t && t.closest ? t.closest('.suggestItem') : null;
      if (item && item.dataset && item.dataset.k) {
        window.location.href = '/mot/?k=' + item.dataset.k;
        return;
      }
      if (!t.closest('#suggestWrap')) {
        renderSuggestions([]);
      }
    });

    countryEl.addEventListener('change', () => {
      if ((qEl.value || '').trim()) doSearch(true);
    });
  }

  init();
})();
