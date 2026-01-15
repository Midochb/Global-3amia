// ====== CONFIG ======
const API_URL = "https://script.google.com/macros/s/AKfycbzcmKMgG60WxkU52UzO3CsMOd6Ncq5KHO979GDifZgqf7YcUukdkeDOARraVkreFW-i/exec";

// ====== THEME (reprise logique) ======
function applyTheme(mode){
  document.body.setAttribute("data-theme", mode);
  try { localStorage.setItem("zeedna_theme", mode); } catch(e){}
}
function initThemeToggle(){
  const btn = document.getElementById("themeToggle");
  if(!btn) return;
  let saved = "dark";
  try { saved = localStorage.getItem("zeedna_theme") || "dark"; } catch(e){}
  if(saved !== "light") saved = "dark";
  applyTheme(saved);
  btn.textContent = (saved === "light") ? "☀️" : "🌙";
  btn.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "dark";
    const next = (current === "light") ? "dark" : "light";
    applyTheme(next);
    btn.textContent = (next === "light") ? "☀️" : "🌙";
  });
}

// ====== HOME CLICK ======
function initHomeBtn(){
  const homeBtn = document.getElementById("homeBtn");
  if(!homeBtn) return;
  const goHome = () => { window.location.href = "/"; };
  homeBtn.addEventListener("click", goHome);
  homeBtn.addEventListener("keydown", (e) => { if(e.key === "Enter") goHome(); });
}

// ====== I18N (FR/EN/AR) ======
const I18N = {
  fr: {
    subtitle: "Contribuer",
    title: "Proposer un mot",
    hint: "Astuce : si plusieurs sens, sépare avec des virgules (ex : beaucoup, énormément, vachement).",
    word_ar: "Mot (arabe)",
    trad_fr: "Traduction (FR)",
    example: "Exemple",
    dialect: "Dialecte / pays",
    city: "Ville / région",
    send: "Envoyer",
    sending: "Envoi…",
    ok: "Merci ! Contribution envoyée ✅",
    err: "Erreur d’envoi. Réessaie plus tard."
  },
  en: {
    subtitle: "Contribute",
    title: "Submit a word",
    hint: "Tip: if multiple meanings, separate with commas (e.g., a lot, plenty, loads).",
    word_ar: "Word (Arabic)",
    trad_fr: "Translation (FR field)",
    example: "Example",
    dialect: "Dialect / country",
    city: "City / region",
    send: "Send",
    sending: "Sending…",
    ok: "Thanks! Submitted ✅",
    err: "Submission error. Try again later."
  },
  ar: {
    subtitle: "ساهم",
    title: "اقترح كلمة",
    hint: "ملاحظة: إذا كانت هناك معانٍ متعددة، افصلها بفواصل (،).",
    word_ar: "الكلمة (بالعربية)",
    trad_fr: "المعنى (بالفرنسية)",
    example: "مثال",
    dialect: "اللهجة / البلد",
    city: "المدينة / المنطقة",
    send: "إرسال",
    sending: "جارٍ الإرسال…",
    ok: "شكرًا! تم الإرسال ✅",
    err: "حدث خطأ. حاول لاحقًا."
  }
};

function pickLang(){
  const nav = (navigator.language || "fr").toLowerCase();
  if(nav.startsWith("ar")) return "ar";
  if(nav.startsWith("en")) return "en";
  return "fr";
}

function applyLang(lang){
  const t = I18N[lang] || I18N.fr;

  const map = [
    ["t_subtitle","subtitle"],
    ["t_title","title"],
    ["t_hint","hint"],
    ["t_word_ar_lab","word_ar"],
    ["t_trad_fr_lab","trad_fr"],
    ["t_example_lab","example"],
    ["t_dialect_lab","dialect"],
    ["t_city_lab","city"]
  ];

  map.forEach(([id,key]) => {
    const el = document.getElementById(id);
    if(el) el.textContent = t[key];
  });

  const btn = document.getElementById("submitBtn");
  if(btn) btn.textContent = t.send;

  // RTL en arabe
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === "ar") ? "rtl" : "ltr";
}

// ====== FORM SUBMIT ======
const formStartTs = Date.now();

function val(s){ return (s ?? "").toString().trim(); }

async function submitContribution(payload){
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });
  if(!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  if(!data || data.ok !== true) throw new Error(data?.error || "unknown");
  return data;
}

function initForm(){
  const form = document.getElementById("contribForm");
  const msg = document.getElementById("msg");
  const btn = document.getElementById("submitBtn");
  const lang = pickLang();
  const t = I18N[lang] || I18N.fr;

  if(!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if(msg) msg.textContent = "";

    // Anti-spam #1: honeypot
    const website = val(document.getElementById("website")?.value);
    if(website){
      if(msg) msg.textContent = "—";
      return;
    }

    // Anti-spam #2: temps mini (3s)
    const elapsed = Date.now() - formStartTs;
    if(elapsed < 3000){
      if(msg) msg.textContent = "Merci de patienter 2 secondes et réessayer.";
      return;
    }

    const word_ar = val(document.getElementById("word_ar")?.value);
    const trad_fr = val(document.getElementById("trad_fr")?.value);
    const example = val(document.getElementById("example")?.value);
    const dialect = val(document.getElementById("dialect")?.value);
    const city = val(document.getElementById("city")?.value);

    // Validations basiques
    if(!word_ar || !trad_fr || !example || !dialect || !city){
      if(msg) msg.textContent = "Merci de remplir tous les champs.";
      return;
    }

    if(btn){ btn.disabled = true; btn.textContent = t.sending; }

    try{
      await submitContribution({
        word_ar,
        trad_fr,
        example,
        dialect,
        city,
        ui_lang: lang,
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      });

      if(msg) msg.textContent = t.ok;
      form.reset();
    }catch(err){
      console.error(err);
      if(msg) msg.textContent = t.err;
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = t.send; }
    }
  });
}

// ====== START ======
initThemeToggle();
initHomeBtn();
applyLang(pickLang());
initForm();