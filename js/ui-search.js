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

  let ALL_ROWS = [];
  let CURRENT_RESULTS = [];

  function setCount(n){
    if(!countEl) return;
    const pack = (Z.i18n && Z.i18n.I18N) ? (Z.i18n.I18N[Z.i18n.LANG] || Z.i18n.I18N.en) : null;
    countEl.textContent = (pack && typeof pack.results_count === "function") ? pack.results_count(n) : `${n}`;
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
    const li = document.createElement("li");
    li.className = "result-card";
    li.tabIndex = 0;

    const title = document.createElement("div");
    title.className = "rc-title";
    title.textContent = clean(row.mot_arabe) || clean(row.transliteration) || "—";

    const sub = document.createElement("div");
    sub.className = "rc-sub";
    const m = Z.i18n ? Z.i18n.getMeaningForLang(row) : {value: clean(row.fr||row.en)};
    sub.textContent = clean(m.value);

    const meta = document.createElement("div");
    meta.className = "rc-meta";
    meta.textContent = [clean(row.pays), clean(row.region)].filter(Boolean).join(" · ");

    li.appendChild(title);
    li.appendChild(sub);
    li.appendChild(meta);

    li.addEventListener("click", ()=>{
      if(Z.modal) Z.modal.openModal(row, ALL_ROWS);
      if(Z.router) location.hash = Z.router.buildHashForRow(row);
    });
    li.addEventListener("keydown",(e)=>{ if(e.key==="Enter") li.click(); });

    return li;
  }

  function renderList(rows){
    if(!resultsEl) return;
    resultsEl.innerHTML = "";
    rows.forEach(r=> resultsEl.appendChild(renderCard(r)));
    setCount(rows.length);
  }

  function applyFilters(rows, q, dialect){
    const needle = clean(q).toLowerCase();
    const dia = dialect || "";

    return rows.filter(r=>{
      if(dia){
        const d = clean(r.dialecte || r.pays || r.region);
        if(d !== dia) return false;
      }
      if(!needle) return true;

      const m = Z.i18n ? Z.i18n.getMeaningForLang(r) : {value: clean(r.fr||r.en)};
      const fields = [
        r.arabe, r.phonetique, r.fr, r.en, r.fusha,
        m.value
      ].map(v=>clean(v).toLowerCase());

      return fields.some(v=>v.includes(needle));
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

    CURRENT_RESULTS = applyFilters(ALL_ROWS, q, dialect);
    renderList(CURRENT_RESULTS);
    writeSearchParams(q, dialect);
  }

  function onInput(){
    if(!qEl) return;
    const needle = clean(qEl.value).toLowerCase();
    if(!needle){ clearSuggestions(); return; }
    const matches = ALL_ROWS.filter(r=>{
      const v = clean(r.mot_arabe||r.transliteration||r.fr||r.en).toLowerCase();
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

    performSearch();

    // open hash modal if exists
    if(Z.router && typeof Z.router.openFromCurrentHash === "function"){
      await Z.router.openFromCurrentHash(ALL_ROWS);
    }

    if(Z.modal) Z.modal.setAppStatus(Z.i18n ? Z.i18n.t("ready") : "Prêt");
  }

  Z.searchUI = { init, performSearch };
})();
