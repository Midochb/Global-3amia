/* =========================================================
   ZEEDNA 3AMIAT — I18N (Patch #90)
   ========================================================= */
(function(){
  window.Zeedna = window.Zeedna || {};
  const Z = window.Zeedna;

const I18N = {
  fr: {
    ready: "Prêt",
    loading: "Chargement…",
    ok: (n) => `OK — ${n} entrées`,
    error: "Erreur chargement (ouvre la console)",
    // ✅ On ne recherche plus via EN/NL quand l'UI est en FR (évite les faux matchs)
    search_ph: "Chercher un mot (arabe, translit, FR, arabe classique)...",
    home_search_ph: "Chercher un mot (arabe, translit, FR, arabe classique)...",
    search_btn: "Rechercher",
    all_dialects: "Tous les dialectes",
    modal_close: "Fermer",
    results_count: (n) => `${n} résultat(s)` ,
    no_results: "Ton mot n’est pas encore dispo",
    no_results_cta: "➕ L’ajouter en contribution",
    add_word_btn: "➕ Ajoute ton mot",
    limited_notice: (shown, total) => `Affichage des ${shown} premiers résultats sur ${total}. Affine ta recherche.`
  },
  en: {
    ready: "Ready",
    loading: "Loading…",
    ok: (n) => `OK — ${n} entries`,
    error: "Load error (open console)",
    // ✅ On ne recherche plus via FR/NL quand l'UI est en EN (évite les faux matchs)
    search_ph: "Search a word (Arabic, translit, EN, Classical Arabic)...",
    home_search_ph: "Search a word (Arabic, translit, EN, Classical Arabic)...",
    search_btn: "Search",
    all_dialects: "All dialects",
    modal_close: "Close",
    results_count: (n) => `${n} result(s)` ,
    no_results: "This word isn’t available yet",
    no_results_cta: "➕ Add it as a contribution",
    add_word_btn: "➕ Add your word",
    limited_notice: (shown, total) => `Showing the first ${shown} results out of ${total}. Refine your search.`
  },
  ar: {
    ready: "جاهز",
    loading: "جارٍ التحميل…",
    ok: (n) => `تم — ${n} مدخلة`,
    error: "خطأ في التحميل (افتح وحدة التحكم)",
    // ✅ UI عربي: البحث على العربي/الترانسلِت/العربية الفصحى فقط
    search_ph: "ابحث عن كلمة (عربي، كتابة لاتينية، العربية الكلاسيكية)...",
    home_search_ph: "ابحث عن كلمة (عربي، كتابة لاتينية، العربية الكلاسيكية)...",
    search_btn: "بحث",
    all_dialects: "كل اللهجات",
    modal_close: "إغلاق",
    results_count: (n) => `${n} نتيجة`,
    no_results: "الكلمة غير متوفّرة بعد",
    no_results_cta: "➕ أضِفها كمساهمة",
    add_word_btn: "➕ أضف كلمتك",
    limited_notice: (shown, total) => `عرض أول ${shown} نتيجة من أصل ${total}. حدّد البحث أكثر.`
  },

  nl: {
    ready: "Klaar",
    loading: "Laden…",
    ok: (n) => `OK — ${n} items`,
    error: "Laadfout (open console)",
    search_ph: "Zoek een woord (Arabisch, translit, NL, Klassiek Arabisch)...",
    home_search_ph: "Zoek een woord (Arabisch, translit, NL, Klassiek Arabisch)...",
    search_btn: "Zoeken",
    all_dialects: "Alle dialecten",
    modal_close: "Sluiten",
    results_count: (n) => `${n} resultaat(en)` ,
    no_results: "Dit woord is nog niet beschikbaar",
    no_results_cta: "➕ Voeg het toe als bijdrage",
    add_word_btn: "➕ Voeg je woord toe",
    limited_notice: (shown, total) => `Eerste ${shown} resultaten van ${total}. Verfijn je zoekopdracht.`
  },
  es: {
    ready: "Listo",
    loading: "Cargando…",
    ok: (n) => `OK — ${n} entradas`,
    error: "Error de carga (abre la consola)",
    search_ph: "Buscar una palabra (árabe, translit, ES, árabe clásico)...",
    home_search_ph: "Buscar una palabra (árabe, translit, ES, árabe clásico)...",
    search_btn: "Buscar",
    all_dialects: "Todos los dialectos",
    modal_close: "Cerrar",
    results_count: (n) => `${n} resultado(s)` ,
    no_results: "Esta palabra aún no está disponible",
    no_results_cta: "➕ Añadir como contribución",
    add_word_btn: "➕ Añade tu palabra",
    limited_notice: (shown, total) => `Mostrando los primeros ${shown} resultados de ${total}. Afina tu búsqueda.`
  },
  it: {
    ready: "Pronto",
    loading: "Caricamento…",
    ok: (n) => `OK — ${n} voci`,
    error: "Errore di caricamento (apri la console)",
    search_ph: "Cerca una parola (arabo, translit, IT, arabo classico)...",
    home_search_ph: "Cerca una parola (arabo, translit, IT, arabo classico)...",
    search_btn: "Cerca",
    all_dialects: "Tutti i dialetti",
    modal_close: "Chiudi",
    results_count: (n) => `${n} risultato(i)` ,
    no_results: "Questa parola non è ancora disponibile",
    no_results_cta: "➕ Aggiungila come contributo",
    add_word_btn: "➕ Aggiungi la tua parola",
    limited_notice: (shown, total) => `Mostro i primi ${shown} risultati su ${total}. Affina la ricerca.`
  }

};

function detectLang(){
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("ar")) return "ar";
  if (nav.startsWith("fr")) return "fr";
  return "en";
}

const LANG = getPreferredLang();

// =====================
// Lang-aware meaning/translation
// - Objectif: n'afficher + ne rechercher que la traduction de la langue UI
//   (évite les correspondances parasites via d'autres langues)
// =====================

function getMeaningForLang(row){
  if(!row) return { label: "", value: "" };

  if(LANG === "fr"){
    const v = clean(row.fr);
    return { label: "FR", value: v };
  }

  if(LANG === "en"){
    const v = clean(row.en);
    return { label: "EN", value: v };
  }

  // UI AR : pas de 'traduction' FR/EN affichée.
  // On garde plutôt l'Arabe classique (fu) dans l'UI.
  return { label: "", value: "" };
}

function t(key){
  const pack = I18N[LANG] || I18N.en;
  const fr = I18N.fr;
  return (pack[key] !== undefined) ? pack[key] : (fr[key] !== undefined ? fr[key] : "");
}

function applyI18nStatic(){
  // Elements that may or may not exist depending on the page
  const qEl = document.getElementById('q');
  const dialectEl = document.getElementById('dialect');
  const elClose = document.getElementById('m_close');
  const searchBtn = document.getElementById('searchBtn');

  // html lang/dir
  document.documentElement.lang = LANG;
  document.documentElement.dir = (LANG === "ar") ? "rtl" : "ltr";

  // placeholders (generic)
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const k = el.getAttribute('data-i18n-placeholder');
    const v = t(k);
    if(v) el.setAttribute('placeholder', v);
  });

  // placeholder for search input (fallback)
  if(qEl && !qEl.getAttribute('placeholder')) qEl.setAttribute("placeholder", t("search_ph"));

  // dropdown first option
  if(dialectEl){
    const first = dialectEl.querySelector("option[value='']");
    if(first) first.textContent = t("all_dialects");
  }

  // modal close
  if(elClose) elClose.textContent = t("modal_close");

  // search btn
  if(searchBtn) searchBtn.textContent = t("search_btn");

  // header CTA (add word)
  document.querySelectorAll("[data-i18n=\"add_word_btn\"]").forEach(el => {
    el.textContent = t("add_word_btn");
  });

  // generic data-i18n (e.g., header CTA)
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    const v = t(k);
    if(v) el.textContent = v;
  });
}

  // export
  Z.i18n = { I18N, LANG, detectLang, getMeaningForLang, t, applyI18nStatic };
})();
