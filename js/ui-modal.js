/* =========================================================
   ZEEDNA 3AMIAT — MODAL (Patch #90)
   ========================================================= */
(function(){
  window.Zeedna = window.Zeedna || {};
  const Z = window.Zeedna;

  const elModal = document.getElementById("modal");
  const elBackdrop = document.getElementById("backdrop");
  const elClose = document.getElementById("m_close");

  const elWord = document.getElementById("m_word");
  const elTranslit = document.getElementById("m_translit");
  const elMeta = document.getElementById("m_meta");
  const elKV = document.getElementById("m_kv");
  const elSyn = document.getElementById("m_syn");

  function setAppStatus(msg){
    const el = document.getElementById("status");
    if(!el) return;
    el.textContent = msg || "";
  }

  function safeDirRTL(el, isArabic){
    if(!el) return;
    el.dir = isArabic ? "rtl" : "ltr";
  }

  function clearHash(){
    if(location.hash){
      history.replaceState({}, "", location.pathname + location.search);
    }
  }

  function closeModal(){
    if(!elModal || !elBackdrop) return;
    elBackdrop.style.display = "none";
    elModal.style.display = "none";
    elBackdrop.setAttribute("aria-hidden","true");
    elModal.setAttribute("aria-hidden","true");
    clearHash();
  }

  function renderSynonyms(row, rows){
    if(!elSyn) return;
    elSyn.innerHTML = "";

    // Use meaning in UI language (FR or EN). AR UI doesn't show translation-based synonyms.
    const m = Z.i18n ? Z.i18n.getMeaningForLang(row) : {value: clean(row.fr || row.en)};
    const meaning = clean(m.value);
    if(!meaning) return;

    const key = normalizeMeaning(meaning);

    const list = (rows||[])
      .filter(r => r !== row)
      .filter(r => {
        const mm = Z.i18n ? Z.i18n.getMeaningForLang(r) : {value: clean(r.fr || r.en)};
        return normalizeMeaning(clean(mm.value)) === key;
      })
      .slice(0, 30);

    list.forEach(r=>{
      const a = document.createElement("a");
      a.className = "syn-item";
      a.href = (Z.router && Z.router.wordPageUrlForRow) ? Z.router.wordPageUrlForRow(r) : "#";
      a.textContent = `${clean(r.arabe) || clean(r.phonetique)} — ${clean(r.pays || r.region)}`;
      elSyn.appendChild(a);
    });
  }

  function openModal(row, rows){
    if(!elModal || !elBackdrop) return;

    if(elWord) elWord.textContent = clean(row.mot_arabe) || "—";
    if(elTranslit) elTranslit.textContent = clean(row.transliteration);
    safeDirRTL(elWord, true);

    // Meta block (small badges)
    if(elMeta){
      const parts = [];
      if(clean(row.pays)) parts.push(clean(row.pays));
      if(clean(row.region)) parts.push(clean(row.region));
      if(clean(row.dialecte)) parts.push(clean(row.dialecte));
      elMeta.textContent = parts.filter(Boolean).join(" · ");
    }

    // Key/Value list (meaning + fusha)
    if(elKV){
      elKV.innerHTML = "";
      const frag = document.createDocumentFragment();

      const meaning = Z.i18n ? Z.i18n.getMeaningForLang(row) : {label:"FR", value: clean(row.fr)};
      if(meaning && clean(meaning.value)){
        const div = document.createElement("div");
        div.className = "kv-row";
        div.innerHTML = `<div class="kv-k">${meaning.label || ""}</div><div class="kv-v"></div>`;
        div.querySelector(".kv-v").textContent = clean(meaning.value);
        frag.appendChild(div);
      }

      if(clean(row.fu)){
        const div = document.createElement("div");
        div.className = "kv-row";
        div.innerHTML = `<div class="kv-k">F</div><div class="kv-v" dir="rtl"></div>`;
        div.querySelector(".kv-v").textContent = clean(row.fu);
        frag.appendChild(div);
      }

      elKV.appendChild(frag);
    }

    renderSynonyms(row, rows);

    elBackdrop.style.display = "block";
    elModal.style.display = "block";
    elBackdrop.setAttribute("aria-hidden","false");
    elModal.setAttribute("aria-hidden","false");
  }

  // Bindings
  if(elClose) elClose.addEventListener("click", closeModal);
  if(elBackdrop) elBackdrop.addEventListener("click", closeModal);
  window.addEventListener("keydown", (e)=>{ if(e.key === "Escape") closeModal(); });

  Z.modal = { openModal, closeModal, renderSynonyms, setAppStatus };
})();
