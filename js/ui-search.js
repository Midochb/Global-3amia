/* =========================================================
   ZEEDNA 3AMIAT — SEARCH UI (Patch #90)
   ========================================================= */
(function(){
  window.Zeedna = window.Zeedna || {};
  const Z = window.Zeedna;

  const qEl = document.getElementById("q");
  const searchBtn = document.getElementById("searchBtn");
  const suggestionsEl = document.getElementById("suggestions");
  const dialectEl = document.getElementById("dialect");
  const resultsEl = document.getElementById("results");
  const countEl = document.getElementById("count");
  const loadMoreWrap = document.getElementById("loadMoreWrap");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  let ALL_ROWS = [];
  let CURRENT_RESULTS = [];
  let DISPLAY_LIMIT = 20;

  function setCount(n){
    if(!countEl) return;
    const pack = (Z.i18n && Z.i18n.I18N) ? (Z.i18n.I18N[Z.i18n.LANG] || Z.i18n.I18N.en) : null;
    countEl.textContent = (pack && typeof pack.results_count === "function") ? pack.results_count(n) : `${n}`;
  }

  function setLoadMore(visible, label){
    if(!loadMoreWrap || !loadMoreBtn) return;
    loadMoreWrap.style.display = visible ? "flex" : "none";
    if(label) loadMoreBtn.textContent = label;
  }

  function buildDialectDropdown(rows){
    if(!dialectEl) return;
    const seen = new Set();
    rows.forEach(r=>{
      const d = clean(r.dialecte || r.pays || r.region);
      if(d) seen.add(d);
    });

    const current = dialectEl.value || "";
    dialectEl.innerHTML = `<option value="">${Z.i18n ? Z.i18n.t("all_dialects") : "Tous les dialectes"}</option>`;
    [...seen].sort().forEach(d=>{
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      dialectEl.appendChild(opt);
    });
    dialectEl.value = current;
  }

  function clearSuggestions(){
    if(suggestionsEl) suggestionsEl.innerHTML = "";
  }

  function renderSuggestions(items){
    if(!suggestionsEl) return;
    suggestionsEl.innerHTML = "";
    items.slice(0,8).forEach(r=>{
      const div = document.createElement("div");
      div.className = "suggestion";
      div.textContent = clean(r.mot_arabe) || clean(r.transliteration) || clean(r.fr) || clean(r.en);
      div.setAttribute("role","option");
      div.addEventListener("click", ()=>{
        if(qEl) qEl.value = div.textContent;
        clearSuggestions();
        performSearch();
      });
      suggestionsEl.appendChild(div);
    });
  }

  function renderCard(row){
    const card = document.createElement("article");
    card.className = "result-card";
    card.tabIndex = 0;

    const header = document.createElement("div");
    header.className = "rc-head";

    const left = document.createElement("div");
    left.className = "rc-left";

    const right = document.createElement("div");
    right.className = "rc-right";

    const flag = document.createElement("span");
    flag.className = "rc-flag";
    try { flag.textContent = isoToFlagEmoji(row.pays_code); } catch(e){ flag.textContent = "🏳️"; }
    right.appendChild(flag);

    const title = document.createElement("div");
    title.className = "rc-title";
    title.textContent = clean(row.mot_arabe) || clean(row.transliteration) || "—";

    const sub = document.createElement("div");
    sub.className = "rc-sub";
    const m = Z.i18n ? Z.i18n.getMeaningForLang(row) : {value: clean(row.fr||row.en)};
    sub.textContent = clean(m.value);

    const meta = document.createElement("div");
    meta.className = "rc-meta";
    meta.textContent = [clean(row.pays_code), clean(row.region)].filter(Boolean).join(" · ");

    left.appendChild(title);
    if(clean(row.transliteration)){
      const tr = document.createElement("div");
      tr.className = "rc-translit";
      tr.textContent = clean(row.transliteration);
      left.appendChild(tr);
    }

    header.appendChild(left);
    header.appendChild(right);

    card.appendChild(header);
    card.appendChild(sub);
    card.appendChild(meta);

    card.addEventListener("click", ()=>{
      if(Z.modal) Z.modal.openModal(row, ALL_ROWS);
      if(Z.router) location.hash = Z.router.buildHashForRow(row);
    });
    card.addEventListener("keydown",(e)=>{ if(e.key==="Enter") card.click(); });

    return card;
  }

  function renderList(rows){
    if(!resultsEl) return;
    resultsEl.innerHTML = "";
    const visible = rows.slice(0, DISPLAY_LIMIT);
    visible.forEach(r=> resultsEl.appendChild(renderCard(r)));
    setCount(rows.length);

    if(rows.length > DISPLAY_LIMIT){
      const remaining = rows.length - DISPLAY_LIMIT;
      setLoadMore(true, `Charger plus (+${Math.min(20, remaining)})`);
    } else {
      setLoadMore(false);
    }
  }

  function applyFilters(rows, q, dialect){
    const needle = norm(q);
    const dia = dialect || "";

    return rows.filter(r=>{
      if(dia){
        const d = clean(r.dialecte || r.pays_code || r.pays || r.region);
        if(d !== dia) return false;
      }
      // ne pas afficher toute la base par défaut
      if(!needle) return false;

      const hay = r._search ? clean(r._search) : norm([
        r.mot_arabe, r.transliteration, r.fr, r.en, r.fu, r.pays_code, r.region
      ].join(" | "));
      return hay.includes(needle);
    });
  }

  function readSearchParams(){
    const sp = new URLSearchParams(location.search);
    return {
      q: sp.get("q") || "",
      dialect: sp.get("dialect") || ""
    };
  }

  function writeSearchParams(q, dialect){
    const sp = new URLSearchParams(location.search);
    if(q) sp.set("q", q); else sp.delete("q");
    if(dialect) sp.set("dialect", dialect); else sp.delete("dialect");
    const qs = sp.toString();
    history.replaceState({}, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }

  function performSearch(){
    const q = qEl ? qEl.value : "";
    const dialect = dialectEl ? dialectEl.value : "";

    DISPLAY_LIMIT = 20;
    CURRENT_RESULTS = applyFilters(ALL_ROWS, q, dialect);
    renderList(CURRENT_RESULTS);
    writeSearchParams(q, dialect);
  }

  function onInput(){
    if(!qEl) return;
    const needle = norm(qEl.value);
    if(!needle){ clearSuggestions(); return; }
    const matches = ALL_ROWS.filter(r=>{
      const v = r._search ? clean(r._search) : norm(r.mot_arabe||r.transliteration||r.fr||r.en);
      return v.includes(needle);
    });
    renderSuggestions(matches);
  }

  async function init(){
    if(Z.i18n) Z.i18n.applyI18nStatic();
    if(Z.theme) Z.theme.initThemeToggle();

    if(Z.modal) Z.modal.setAppStatus(Z.i18n ? Z.i18n.t("loading") : "Chargement…");
    ALL_ROWS = await (Z.core ? Z.core.loadData() : []);
    buildDialectDropdown(ALL_ROWS);

    const params = readSearchParams();
    if(qEl) qEl.value = params.q;
    if(dialectEl) dialectEl.value = params.dialect;

    if(searchBtn) searchBtn.addEventListener("click", ()=>{ clearSuggestions(); performSearch(); });
    if(qEl) qEl.addEventListener("input", debounce(onInput, 120));
    if(qEl) qEl.addEventListener("keydown",(e)=>{ if(e.key==="Enter"){ clearSuggestions(); performSearch(); }});
    if(dialectEl) dialectEl.addEventListener("change", ()=>{ clearSuggestions(); performSearch(); });

    if(loadMoreBtn) loadMoreBtn.addEventListener("click", ()=>{
      DISPLAY_LIMIT += 20;
      renderList(CURRENT_RESULTS);
    });

    performSearch();

    // open hash modal if exists
    if(Z.router && typeof Z.router.openFromCurrentHash === "function"){
      await Z.router.openFromCurrentHash(ALL_ROWS);
    }

    if(Z.modal) Z.modal.setAppStatus(Z.i18n ? Z.i18n.t("ready") : "Prêt");
  }

  Z.searchUI = { init, performSearch };
})();
