/* =========================================================
   ZEEDNA 3AMIAT — STABLE MONOLITHIC APP (Patch #97)
   Goal: robustness for Netlify static deploy (no fragile cross-file deps)
   Pages handled:
   - / (home)
   - /recherche (search)
   - /mot/<id>/ (word page)
   ========================================================= */
(function(){
  'use strict';

  // ---------- [UTILS] ----------
  function clean(v){ return (v ?? '').toString().trim(); }
  function lower(v){ return clean(v).toLowerCase(); }
  function norm(s){
    return lower(s)
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/\s+/g,' ')
      .trim();
  }
  function debounce(fn, wait){
    let t; return function(...args){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,args), wait); };
  }
  function isoToFlagEmoji(iso){
    if(!iso) return '🏳️';
    const code = String(iso).trim().toUpperCase();
    if(code.length !== 2) return '🏳️';
    const A = 0x1F1E6;
    return String.fromCodePoint(code.charCodeAt(0)-65+A, code.charCodeAt(1)-65+A);
  }

  function detectLang(){
    const raw = (navigator.language || 'en').toLowerCase();
    if(raw.startsWith('ar')) return 'ar';
    if(raw.startsWith('fr')) return 'fr';
    if(raw.startsWith('nl')) return 'nl';
    if(raw.startsWith('es')) return 'es';
    if(raw.startsWith('it')) return 'it';
    if(raw.startsWith('en')) return 'en';
    return 'en';
  }
  function getPreferredLang(){
    try{ const saved = localStorage.getItem('zeed_lang'); if(saved) return saved; }catch(e){}
    return detectLang();
  }
  function setPreferredLang(lang){
    try{ localStorage.setItem('zeed_lang', lang); }catch(e){}
    location.reload();
  }

  // ---------- [I18N] ----------
  const I18N = {
    fr: {
      ready: 'Prêt',
      loading: 'Chargement…',
      error: 'Erreur chargement (ouvre la console)',
      search_ph: 'Chercher un mot (arabe, translit, FR, arabe classique)...',
      home_search_ph: 'Chercher un mot (arabe, translit, FR, arabe classique)...',
      search_btn: 'Rechercher',
      all_dialects: 'Tous les dialectes',
      results_count: (n)=>`${n} résultat(s)`,
      add_word_btn: '➕ Ajoute ton mot',
      word_more: 'Autres mots suggérés',
      word_nf_title: 'Mot introuvable',
      word_nf_hint: 'Ce mot n\'est pas encore dans la base.',
      tr_help_link: '📖 Guide phonétique',
      home_title: 'Zeedna 3amiat — dictionnaire participatif des dialectes arabes',
      home_sub: 'Compare comment on dit un mot dans différents pays, et contribue au dico.'
    },
    en: {
      ready: 'Ready',
      loading: 'Loading…',
      error: 'Load error (open console)',
      search_ph: 'Search a word (Arabic, translit, EN, Classical Arabic)...',
      home_search_ph: 'Search a word (Arabic, translit, EN, Classical Arabic)...',
      search_btn: 'Search',
      all_dialects: 'All dialects',
      results_count: (n)=>`${n} result(s)`,
      add_word_btn: '➕ Add your word',
      word_more: 'More suggested words',
      word_nf_title: 'Word not found',
      word_nf_hint: 'This word is not in the database yet.',
      tr_help_link: '📖 Phonetic guide',
      home_title: 'Zeedna 3amiat — collaborative Arabic dialect dictionary',
      home_sub: 'Compare how a word is said across countries, and contribute.'
    },
    ar: {
      ready: 'جاهز',
      loading: 'جارٍ التحميل…',
      error: 'خطأ في التحميل (افتح وحدة التحكم)',
      search_ph: 'ابحث عن كلمة (عربي، كتابة لاتينية، العربية الكلاسيكية)...',
      home_search_ph: 'ابحث عن كلمة (عربي، كتابة لاتينية، العربية الكلاسيكية)...',
      search_btn: 'بحث',
      all_dialects: 'كل اللهجات',
      results_count: (n)=>`${n} نتيجة`,
      add_word_btn: '➕ أضف كلمتك',
      word_more: 'اقتراحات أخرى',
      word_nf_title: 'الكلمة غير موجودة',
      word_nf_hint: 'هذه الكلمة غير موجودة بعد في القاعدة.',
      tr_help_link: '📖 دليل النطق',
      home_title: 'Zeedna 3amiat — قاموس لهجات عربيّة تشاركي',
      home_sub: 'قارن كيف تُقال الكلمة بين البلدان وساهم في القاموس.'
    },
    nl: {
      ready: 'Klaar',
      loading: 'Laden…',
      error: 'Laadfout (open console)',
      search_ph: 'Zoek een woord (Arabisch, translit, NL, Klassiek Arabisch)...',
      home_search_ph: 'Zoek een woord (Arabisch, translit, NL, Klassiek Arabisch)...',
      search_btn: 'Zoeken',
      all_dialects: 'Alle dialecten',
      results_count: (n)=>`${n} resultaat(en)`,
      add_word_btn: '➕ Voeg je woord toe',
      word_more: 'Meer suggesties',
      word_nf_title: 'Woord niet gevonden',
      word_nf_hint: 'Dit woord staat nog niet in de database.',
      tr_help_link: '📖 Fonetische gids',
      home_title: 'Zeedna 3amiat — gezamenlijke Arabische dialectwoordenlijst',
      home_sub: 'Vergelijk hoe woorden per land gezegd worden en draag bij.'
    },
    es: {
      ready: 'Listo',
      loading: 'Cargando…',
      error: 'Error de carga (abre la consola)',
      search_ph: 'Buscar una palabra (árabe, translit, ES, árabe clásico)...',
      home_search_ph: 'Buscar una palabra (árabe, translit, ES, árabe clásico)...',
      search_btn: 'Buscar',
      all_dialects: 'Todos los dialectos',
      results_count: (n)=>`${n} resultado(s)`,
      add_word_btn: '➕ Añade tu palabra',
      word_more: 'Más sugerencias',
      word_nf_title: 'Palabra no encontrada',
      word_nf_hint: 'Esta palabra aún no está en la base.',
      tr_help_link: '📖 Guía fonética',
      home_title: 'Zeedna 3amiat — diccionario colaborativo de dialectos árabes',
      home_sub: 'Compara cómo se dice una palabra y contribuye.'
    },
    it: {
      ready: 'Pronto',
      loading: 'Caricamento…',
      error: 'Errore di caricamento (apri la console)',
      search_ph: 'Cerca una parola (arabo, translit, IT, arabo classico)...',
      home_search_ph: 'Cerca una parola (arabo, translit, IT, arabo classico)...',
      search_btn: 'Cerca',
      all_dialects: 'Tutti i dialetti',
      results_count: (n)=>`${n} risultato(i)`,
      add_word_btn: '➕ Aggiungi la tua parola',
      word_more: 'Altri suggerimenti',
      word_nf_title: 'Parola non trovata',
      word_nf_hint: 'Questa parola non è ancora nella base.',
      tr_help_link: '📖 Guida fonetica',
      home_title: 'Zeedna 3amiat — dizionario collaborativo dei dialetti arabi',
      home_sub: 'Confronta come si dice una parola e contribuisci.'
    }
  };

  const LANG = getPreferredLang();

  function t(key){
    const pack = I18N[LANG] || I18N.en;
    const fr = I18N.fr;
    return (pack[key] !== undefined) ? pack[key] : (fr[key] !== undefined ? fr[key] : '');
  }

  function applyI18nStatic(){
    document.documentElement.lang = LANG;
    document.documentElement.dir = (LANG === 'ar') ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const k = el.getAttribute('data-i18n');
      const v = t(k);
      if(v) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      const k = el.getAttribute('data-i18n-placeholder');
      const v = t(k);
      if(v) el.setAttribute('placeholder', v);
    });

    // Search input fallback
    const qEl = document.getElementById('q');
    if(qEl){
      const ph = qEl.getAttribute('data-i18n-placeholder') ? '' : t('search_ph');
      if(ph && !qEl.getAttribute('placeholder')) qEl.setAttribute('placeholder', ph);
    }

    // Dialect default option label
    const dialectEl = document.getElementById('dialect');
    if(dialectEl){
      const first = dialectEl.querySelector("option[value='']");
      if(first) first.textContent = t('all_dialects');
    }

    // Button label
    const searchBtn = document.getElementById('searchBtn');
    // On some pages, searchBtn is the brand link, so only set if it's a button
    if(searchBtn && searchBtn.tagName === 'BUTTON') searchBtn.textContent = t('search_btn');
  }

  function getMeaningForLang(row){
    if(!row) return { label:'', value:'' };
    if(LANG === 'fr') return { label:'FR', value: clean(row.fr) };
    if(LANG === 'en') return { label:'EN', value: clean(row.en) };
    // AR & others: keep empty (or could show fr)
    if(LANG === 'nl') return { label:'NL', value: clean(row.nl) || clean(row.fr) };
    if(LANG === 'es') return { label:'ES', value: clean(row.es) || clean(row.fr) };
    if(LANG === 'it') return { label:'IT', value: clean(row.it) || clean(row.fr) };
    return { label:'', value: clean(row.fr || row.en) };
  }

  // ---------- [THEME] ----------
  function initThemeToggle(){
    const btn = document.getElementById('themeToggle');
    const root = document.documentElement;
    const key = 'zeed_theme';
    const apply = (v)=>{ root.dataset.theme = v; if(btn) btn.textContent = (v==='dark'?'🌙':'☀️'); };
    let cur = 'dark';
    try{ cur = localStorage.getItem(key) || 'dark'; }catch(e){}
    apply(cur);
    if(btn){
      btn.addEventListener('click', ()=>{
        cur = (root.dataset.theme === 'dark') ? 'light' : 'dark';
        try{ localStorage.setItem(key, cur); }catch(e){}
        apply(cur);
      });
    }
  }

  // ---------- [DATA] ----------
  const API_URL = "https://script.google.com/macros/s/AKfycbxRvetENGm215GS4OowKMa_BqHBi5CNEWOgzQ5k5D7UaaItvPHLj2N1tmCBjVB_WZN1/exec";
  const CACHE_KEY = 'zeedna_rows_v1';
  const CACHE_TS = 'zeedna_rows_ts_v1';
  const CACHE_TTL = 1000 * 60 * 30; // 30 min

  function normalizeRow(r){
    const row = Object.assign({}, r);
    // normalize expected fields used by UI
    row.mot_arabe = row.mot_arabe ?? row.arabe ?? '';
    row.transliteration = row.transliteration ?? row.phonetique ?? '';
    row.dialecte = row.dialecte ?? row.dialect ?? row.pays ?? '';
    row.pays_code = (row.pays_code || row.iso2 || '').toString().toUpperCase();
    row.pays = row.pays || row.country || '';
    row.region = row.region || row.ville || '';
    row.fr = row.fr || row.francais || '';
    row.en = row.en || row.anglais || '';
    row.fusha = row.fusha || row.arabe_classique || '';

    // active bool
    const actif = row.actif;
    row.actifBool = (typeof actif === 'boolean') ? actif : (String(actif || '').toLowerCase() !== 'false');
    // id
    row.mot_id = row.mot_id || row.id || '';
    return row;
  }

  async function fetchRows(){
    const res = await fetch(API_URL, { cache: 'no-store' });
    if(!res.ok) throw new Error('API HTTP ' + res.status);
    const data = await res.json();
    const rows = Array.isArray(data) ? data : (data.rows || data.data || []);
    return rows.map(normalizeRow).filter(r=>r.actifBool);
  }

  async function loadData(){
    try{
      const now = Date.now();
      const ts = Number(localStorage.getItem(CACHE_TS) || 0);
      const cached = localStorage.getItem(CACHE_KEY);
      if(cached && ts && (now - ts) < CACHE_TTL){
        const parsed = JSON.parse(cached);
        if(Array.isArray(parsed)) return parsed;
      }
    }catch(e){}

    const rows = await fetchRows();
    try{
      localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
      localStorage.setItem(CACHE_TS, String(Date.now()));
    }catch(e){}
    return rows;
  }

  // ---------- [ROUTER] ----------
  function slugify(s){
    return (s||'')
      .toString().trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9\u0600-\u06FF]+/g,'-')
      .replace(/-+/g,'-')
      .replace(/(^-|-$)/g,'');
  }
  function buildIdForRow(row){
    const a = slugify(row.mot_arabe || '');
    const tr = slugify(row.transliteration || '');
    const base = a || tr || 'mot';
    const cc = (row.pays_code || '').toLowerCase().trim();
    return `${base}--${cc}`;
  }
  function wordPageUrlForRow(row){
    return `/mot/${encodeURIComponent(buildIdForRow(row))}/`;
  }
  function parseWordIdFromPath(){
    const parts = location.pathname.split('/').filter(Boolean);
    const motIdx = parts.indexOf('mot');
    if(motIdx === -1) return null;
    const id = parts[motIdx+1] || '';
    if(!id) return null;
    return decodeURIComponent(id);
  }
  function findRowByIdOrSlug(rows, id){
    if(!id) return null;
    const [slugPart, ccPart] = id.split('--');
    const slug = (slugPart||'').trim().toLowerCase();
    const cc = (ccPart||'').trim().toUpperCase();
    for(const r of rows){
      const okC = !cc || (clean(r.pays_code).toUpperCase() === cc);
      if(!okC) continue;
      const a = slugify(r.mot_arabe || '');
      const tr = slugify(r.transliteration || '');
      if(a === slug || tr === slug) return r;
    }
    return null;
  }

  // ---------- [SYNONYMS] (simplified, stable) ----------
  const SYN_STOP_FR = new Set(['de','des','du','la','le','les','un','une','et','ou','a','à','au','aux','en','dans','pour','par','sur','avec','sans','chez','ce','cet','cette','ces','se','s','que','qui','quoi','dont','comme','il','elle','ils','elles','tres','très','plus','moins']);
  const SYN_STOP_EN = new Set(['the','a','an','and','or','to','of','in','on','for','with','without','by','is','are','was','were','be','been','being','very','more','less']);

  function synSplitItems(text){
    const t = clean(text);
    if(!t) return [];
    return t.replace(/[()]/g,' ').replace(/[\n\r]/g,' ').split(/[,;|/]+/g).map(x=>x.trim()).filter(Boolean);
  }
  function synTokenize(text, lang){
    const t = norm(text);
    if(!t) return [];
    const stop = (lang==='fr') ? SYN_STOP_FR : SYN_STOP_EN;
    return t.replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim().split(' ').filter(w=>w && w.length>=3 && !stop.has(w));
  }
  function synExtractKeys(row, lang){
    const keys = new Set();
    if(lang==='ar') return keys;
    const field = (lang==='fr') ? row.fr : row.en;
    for(const item of synSplitItems(field)){
      const phrase = norm(item);
      if(phrase) keys.add(`${lang}:ph:${phrase}`);
      for(const tok of synTokenize(item, lang)) keys.add(`${lang}:tk:${tok}`);
    }
    return keys;
  }
  function buildSynIndex(rows, lang){
    const idx = new Map();
    for(const r of rows){
      const keys = synExtractKeys(r, lang);
      r._synKeys = keys;
      for(const k of keys){
        if(!idx.has(k)) idx.set(k, []);
        idx.get(k).push(r);
      }
    }
    return idx;
  }
  function findSynonyms(row, idx, rows, limit){
    if(!row || !idx) return [];
    const keys = row._synKeys || synExtractKeys(row, LANG==='en'?'en':'fr');
    if(!keys.size) return [];
    const hit = new Map();
    for(const k of keys){
      const bucket = idx.get(k) || [];
      for(const cand of bucket){
        if(!cand || cand === row) continue;
        const id = cand.mot_id || buildIdForRow(cand);
        const prev = hit.get(id);
        hit.set(id, { row: cand, hits: prev ? prev.hits+1 : 1 });
      }
    }
    const list = Array.from(hit.values()).sort((a,b)=>b.hits-a.hits);
    const out=[]; const seen=new Set();
    for(const it of list){
      const key = `${it.row.pays_code}::${it.row.mot_arabe}`;
      if(seen.has(key)) continue;
      seen.add(key);
      out.push(it.row);
      if(out.length>=limit) break;
    }
    return out;
  }

  // ---------- [UI: HOME] ----------
  function initHome(){
    initThemeToggle();
    // mount lang selector if container exists
    const langMount = document.getElementById('langMount') || document.querySelector('.lang-mount');
    if(langMount){
      // simple select
      const sel = document.createElement('select');
      sel.className = 'lang-select';
      const opts = [
        ['fr','FR'],['en','EN'],['ar','AR'],['nl','NL'],['es','ES'],['it','IT']
      ];
      for(const [v,lbl] of opts){
        const o=document.createElement('option'); o.value=v; o.textContent=lbl; if(v===LANG) o.selected=true; sel.appendChild(o);
      }
      sel.addEventListener('change', ()=>setPreferredLang(sel.value));
      langMount.innerHTML='';
      langMount.appendChild(sel);
    }
    applyI18nStatic();
  }

  // ---------- [UI: SEARCH] ----------
  function initSearch(){
    initThemeToggle();
    applyI18nStatic();

    const qEl = document.getElementById('q');
    const searchBtn = document.getElementById('searchBtn');
    const suggestionsEl = document.getElementById('suggestions');
    const dialectEl = document.getElementById('dialect');
    const resultsEl = document.getElementById('results');
    const countEl = document.getElementById('count');
    const statusEl = document.getElementById('status');
    const loadMoreWrap = document.getElementById('loadMoreWrap');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    let ALL=[];
    let LAST=[];
    let renderLimit=20;

    function setCount(total, shown){
      if(!countEl) return;
      if(typeof shown==='number' && shown < total){
        countEl.textContent = (I18N[LANG]?.results_count ? I18N[LANG].results_count(total) : `${total}`);
        // show shown/total in the corner for clarity
        countEl.textContent = `${shown}/${total} résultat(s)`;
      }else{
        countEl.textContent = I18N[LANG]?.results_count ? I18N[LANG].results_count(total) : `${total}`;
      }
    }`; }

    function clearSuggestions(){
      if(!suggestionsEl) return;
      suggestionsEl.innerHTML='';
      suggestionsEl.style.display='none';
    }

    function renderSuggestions(items){
      if(!suggestionsEl) return;
      const list = items.slice(0,8);
      if(!list.length){ clearSuggestions(); return; }
      suggestionsEl.innerHTML='';
      suggestionsEl.style.display='block';
      list.forEach(r=>{
        const div=document.createElement('div');
        div.className='suggestion';
        const label = clean(r.mot_arabe) || clean(r.transliteration) || clean(r.fr) || clean(r.en) || clean(r.fusha);
        div.textContent = label || '—';
        div.setAttribute('role','option');
        div.addEventListener('mousedown', (e)=>{
          // mousedown to avoid blur before click
          e.preventDefault();
          if(qEl) qEl.value = div.textContent;
          clearSuggestions();
          performSearch(true);
        });
        suggestionsEl.appendChild(div);
      });
    }

    function buildDialectDropdown(rows){
      if(!dialectEl) return;
      const seen=new Set();
      rows.forEach(r=>{ const d=clean(r.dialecte || r.pays || r.region); if(d) seen.add(d); });
      const current = dialectEl.value || '';
      dialectEl.innerHTML = `<option value="">${t('all_dialects')}</option>`;
      [...seen].sort().forEach(d=>{
        const opt=document.createElement('option'); opt.value=d; opt.textContent=d; dialectEl.appendChild(opt);
      });
      dialectEl.value=current;
    }

    function applyFilters(rows, q, dialect){
      const needle = clean(q).toLowerCase();
      const dia = dialect || '';
      // Avoid rendering the whole dictionary when nothing is searched
      if(!needle && !dia) return [];
      return rows.filter(r=>{
        if(dia){
          const d = clean(r.dialecte || r.pays || r.region);
          if(d !== dia) return false;
        }
        if(!needle) return true;
        const m = getMeaningForLang(r);
        const fields = [r.mot_arabe, r.transliteration, r.fr, r.en, r.fusha, m.value].map(v=>clean(v).toLowerCase());
        return fields.some(v=>v.includes(needle));
      });
    }

    function renderCard(row){
      const a=document.createElement('a');
      a.className='resultCard';
      a.href = wordPageUrlForRow(row);

      const top=document.createElement('div');
      top.className='resultTop';

      const left=document.createElement('div');
      left.className='resultLeft';

      const word=document.createElement('div');
      word.className='resultWord';
      word.textContent = clean(row.mot_arabe) || clean(row.transliteration) || '—';

      const translit=document.createElement('div');
      translit.className='resultTranslit muted';
      translit.textContent = clean(row.transliteration);

      left.appendChild(word);
      if(clean(row.transliteration)) left.appendChild(translit);

      const right=document.createElement('div');
      right.className='resultRight';

      const flag=document.createElement('span');
      flag.className='flagBadge';
      flag.textContent = getFlagForRow(row) || '';

      const place=document.createElement('div');
      place.className='resultPlace muted';
      place.textContent = [clean(row.pays), clean(row.region)].filter(Boolean).join(' · ');

      if(flag.textContent) right.appendChild(flag);
      if(place.textContent) right.appendChild(place);

      top.appendChild(left);
      top.appendChild(right);

      const meaning=document.createElement('div');
      meaning.className='resultMeaning';
      meaning.textContent = clean(getMeaningForLang(row).value);

      a.appendChild(top);
      if(meaning.textContent) a.appendChild(meaning);

      return a;
    }

    function renderList(rows, resetLimit){
      if(!resultsEl) return;
      if(resetLimit) renderLimit = 20;
      LAST = rows;
      const shown = Math.min(renderLimit, rows.length);
      resultsEl.innerHTML='';
      rows.slice(0, shown).forEach(r=> resultsEl.appendChild(renderCard(r)));
      setCount(rows.length, shown);
      if(loadMoreWrap && loadMoreBtn){
        if(rows.length > shown){
          loadMoreWrap.style.display='flex';
          loadMoreBtn.disabled=false;
        }else{
          loadMoreWrap.style.display='none';
        }
      }
    }

    function writeParams(q, dialect){
      const sp = new URLSearchParams(location.search);
      if(q) sp.set('q', q); else sp.delete('q');
      if(dialect) sp.set('dialect', dialect); else sp.delete('dialect');
      const qs = sp.toString();
      history.replaceState({}, '', location.pathname + (qs?`?${qs}`:'') );
    }

    function readParams(){
      const sp = new URLSearchParams(location.search);
      return { q: sp.get('q')||'', dialect: sp.get('dialect')||'' };
    }

    function performSearch(resetLimit){
      const q = qEl ? qEl.value : '';
      const dialect = dialectEl ? dialectEl.value : '';
      const rows = applyFilters(ALL, q, dialect);
      renderList(rows, resetLimit!==false);
      writeParams(q, dialect);
    }

    function onInput(){
      if(!qEl) return;
      const needle = clean(qEl.value).toLowerCase();
      if(!needle){ clearSuggestions(); return; }
      const matches = ALL.filter(r=>{
        const m = getMeaningForLang(r).value;
        const fields = [r.mot_arabe, r.transliteration, r.fr, r.en, r.fusha, m].map(v=>clean(v).toLowerCase());
        return fields.some(v=>v.includes(needle));
      });
      renderSuggestions(matches);
    }

    (async ()=>{
      try{
        if(statusEl) statusEl.textContent = t('loading');
        ALL = await loadData();
        buildDialectDropdown(ALL);

        const params = readParams();
        if(qEl) qEl.value = params.q;
        if(dialectEl) dialectEl.value = params.dialect;

        if(searchBtn && searchBtn.tagName==='BUTTON') searchBtn.addEventListener('click', ()=>{ clearSuggestions(); performSearch(true); });
        if(qEl){
          qEl.addEventListener('input', debounce(onInput, 120));
          qEl.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ clearSuggestions(); performSearch(true); } });
        }
        if(dialectEl) dialectEl.addEventListener('change', ()=>{ clearSuggestions(); performSearch(true); });
        if(loadMoreBtn) loadMoreBtn.addEventListener('click', ()=>{ renderLimit += 20; renderList(LAST, false); });

        performSearch(true);
        if(statusEl) statusEl.textContent = t('ready');
      }catch(err){
        console.error(err);
        if(statusEl) statusEl.textContent = t('error');
      }
    })();
  }

  // ---------- [UI: WORD PAGE] ----------
  function initWordPage(){
    initThemeToggle();
    applyI18nStatic();

    const statusEl = document.getElementById('wordStatus');
    const viewEl = document.getElementById('wordView');
    const nfEl = document.getElementById('wordNotFound');

    const elAr = document.getElementById('w_ar');
    const elTr = document.getElementById('w_tr');
    const elFlag = document.getElementById('w_flag');
    const elTrads = document.getElementById('w_trads');
    const elKv = document.getElementById('w_kv');
    const elSuggest = document.getElementById('w_suggest');

    function showNotFound(){
      if(statusEl) statusEl.textContent = '';
      if(viewEl) viewEl.style.display='none';
      if(nfEl) nfEl.style.display='block';
    }

    function kvRow(label, value){
      if(!value) return '';
      return `<div class="kv-row"><div class="kv-k">${label}</div><div class="kv-v">${value}</div></div>`;
    }

    function renderTrads(row){
      if(!elTrads) return;
      const m = getMeaningForLang(row);
      const fr = clean(row.fr);
      const en = clean(row.en);
      const fu = clean(row.fusha);

      // show all in a consistent way
      const items = [];
      if(fr) items.push({k:'FR', v:fr});
      if(en) items.push({k:'EN', v:en});
      if(fu) items.push({k:'Fusha', v:fu});

      elTrads.innerHTML = items.map(it=>`<div class="trad"><div class="tag">${it.k}</div><div class="trad-txt">${it.v}</div></div>`).join('');
    }

    function renderKV(row){
      if(!elKv) return;
      const parts = [];
      parts.push(kvRow('Dialecte', clean(row.dialecte || row.pays)));
      parts.push(kvRow('Région', clean(row.region)));
      parts.push(kvRow('Pays', clean(row.pays)));
      elKv.innerHTML = parts.filter(Boolean).join('');
    }

    function renderSuggestions(list){
      if(!elSuggest) return;
      elSuggest.innerHTML='';
      list.slice(0,12).forEach(r=>{
        const a=document.createElement('a');
        a.className='syn-item';
        a.href = wordPageUrlForRow(r);
        a.textContent = `${isoToFlagEmoji(r.pays_code)} ${clean(r.mot_arabe)||clean(r.transliteration)||'—'}`;
        elSuggest.appendChild(a);
      });
    }

    (async ()=>{
      try{
        if(statusEl) statusEl.textContent = t('loading');
        const rows = await loadData();
        const id = parseWordIdFromPath() || (new URLSearchParams(location.search).get('id')||'');
        const row = findRowByIdOrSlug(rows, id);
        if(!row){ showNotFound(); return; }

        if(elAr) elAr.textContent = clean(row.mot_arabe);
        if(elTr) elTr.textContent = clean(row.transliteration);
        if(elFlag) elFlag.textContent = isoToFlagEmoji(row.pays_code);

        renderTrads(row);
        renderKV(row);

        const synLang = (LANG==='en') ? 'en' : 'fr';
        const synIndex = buildSynIndex(rows, synLang);
        const syns = findSynonyms(row, synIndex, rows, 12);
        renderSuggestions(syns);

        if(statusEl) statusEl.textContent = t('ready');
        if(nfEl) nfEl.style.display='none';
        if(viewEl) viewEl.style.display='block';
      }catch(err){
        console.error(err);
        if(statusEl) statusEl.textContent = t('error');
      }
    })();
  }

  // ---------- [BOOT] ----------
  document.addEventListener('DOMContentLoaded', ()=>{
    const path = location.pathname;
    if(path === '/' || path === '/index.html') return initHome();
    if(path.startsWith('/recherche')) return initSearch();
    if(path.startsWith('/mot')) return initWordPage();
    // other pages: at least theme + i18n labels
    initThemeToggle();
    applyI18nStatic();
  });

})();
