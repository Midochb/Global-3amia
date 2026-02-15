/* =========================================================
   HOME i18n + THEME
   ========================================================= */

function detectLang(){
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('ar')) return 'ar';
  if (nav.startsWith('fr')) return 'fr';
  return 'en';
}

const LANG = getPreferredLang();

const I18N_HOME = {
  fr: {
    nav_dict: 'Dictionnaire',
    nav_add: '➕ Ajoute ton mot',
    home_title: 'Dictionnaire collaboratif des dialectes arabes',
    home_subtitle: 'Version bêta. Compare darija, tunisien, algérien, égyptien, levantin, khaliji… reliés à l’arabe classique et aux langues européennes.',
    home_cta_search: 'Commence à chercher',
    home_cta_contribute: 'Ajoute ton mot',
    home_search_ph: 'Rechercher un mot… (ex: wa5a, زادا, برضو)',
    home_tr_help_link: 'Comment lire la translittération ?',
    home_note: "Je vous mets à disposition l’ensemble de mes notes d’apprentissage. L’arabe n’est pas un long fleuve tranquille : il peut y avoir des erreurs ou des approximations. Si c’est le cas, proposez votre version en appuyant sur ‘Ajouter / corriger’ dans les fiches (≈ 30 secondes).",

    // New: story + roadmap
    home_story_title: "Un projet simple, humain, et utile",
    home_story_p1: "J’ai appris l’arabe avec plein de ressources… mais c’était souvent difficile de faire le lien entre arabe classique, dialectes et mots réellement utilisés.",
    home_story_p2: "Du coup, je partage ici mes notes, comme un carnet d’apprentissage ouvert. L’idée n’est pas de ‘faire un business agressif’, mais de construire une ressource vraie, qualitative, et qui s’améliore petit à petit.",
    home_story_p3: "Vous pouvez trouver des erreurs ou des approximations : dans ce cas, cliquez sur ‘Ajouter / corriger’ dans la fiche pour proposer votre version.",

    home_roadmap_title: "À venir (progressivement)",
    home_roadmap_desc: "Zeedna 3amia est le premier module. D’autres ‘Zeedna’ arriveront ensuite, quand ce module sera solide.",
    home_roadmap_item1: "Zeedna English (anglais)",
    home_roadmap_item2: "Zeedna Hollandais (néerlandais)",
    home_roadmap_item3: "Zeedna Español (espagnol)",

    home_how_title: 'Comment ça marche',
    home_step1_title: 'Cherche un mot',
    home_step1_desc: 'Écris en arabe, en translit, ou en FR/EN/NL/DE. Tu vois des suggestions au fur et à mesure.',
    home_step2_title: 'Compare les variantes',
    home_step2_desc: 'Filtre par pays, ouvre une fiche, et découvre les synonymes proches.',
    home_step3_title: 'Ajoute une contribution',
    home_step3_desc: 'Si le mot n\'existe pas, propose-le. C\'est communautaire: chacun ajoute ses variantes régionales.',
    home_why_title: 'Pourquoi Zeedna 3amiat',
    home_why_1: 'Un seul endroit pour les dialectes (et leurs variantes régionales).',
    home_why_2: 'Des traductions reliées au FR/EN/NL/DE + exemples d\'usage.',
    home_why_3: 'Un projet vivant: tu contribues et la base s\'enrichit.',
    home_footer_search: 'Recherche',
    home_footer_contribute: 'Ajoute ton mot'
  },
  en: {
    nav_dict: 'Dictionary',
    nav_add: '➕ Add your word',
    home_title: 'Community Arabic dialect dictionary',
    home_subtitle: 'Beta. Compare Darija, Tunisian, Algerian, Egyptian, Levantine, Gulf… linked to Classical Arabic and European languages.',
    home_cta_search: 'Start searching',
    home_cta_contribute: 'Add your word',
    home_search_ph: 'Search a word… (e.g. wa5a, زادا, برضو)',
    home_tr_help_link: 'How to read transliteration?',
    home_note: 'Starting point: make Arabic dialect understanding easier, especially for people born abroad who want to reconnect with their roots and learn the basics of Classical Arabic.',

    // New: story + roadmap
    home_story_title: "A simple, human, useful project",
    home_story_p1: "I learned Arabic using lots of resources… but it was often hard to connect MSA, dialects, and the words people actually use.",
    home_story_p2: "So I’m sharing my notes as an open learning notebook. The goal isn’t ‘aggressive monetization’, it’s building a true, high‑quality resource that improves step by step.",
    home_story_p3: "If you spot mistakes or approximations, click on ‘Add / fix’ on the word page to suggest your version.",

    home_roadmap_title: "Coming next (gradually)",
    home_roadmap_desc: "Zeedna 3amia is the first module. More ‘Zeedna’ modules will come once this one is solid.",
    home_roadmap_item1: "Zeedna English",
    home_roadmap_item2: "Zeedna Dutch",
    home_roadmap_item3: "Zeedna Spanish",
    home_how_title: 'How it works',
    home_step1_title: 'Search a word',
    home_step1_desc: 'Type Arabic, transliteration, or FR/EN/NL/DE. Suggestions appear as you type.',
    home_step2_title: 'Compare variants',
    home_step2_desc: 'Filter by country, open an entry, and discover close synonyms.',
    home_step3_title: 'Add a contribution',
    home_step3_desc: 'If a word is missing, submit it. It\'s community-driven: add regional variants too.',
    home_why_title: 'Why Zeedna 3amiat',
    home_why_1: 'One place for dialects (including regional variants).',
    home_why_2: 'Translations linked to FR/EN/NL/DE + usage examples.',
    home_why_3: 'A living project: you contribute and the database grows.',
    home_footer_search: 'Search',
    home_footer_contribute: 'Add your word'
  },
  ar: {
    nav_dict: 'القاموس',
    nav_add: '➕ أضف كلمتك',
    home_title: 'قاموس مجتمعي للهجات العربية',
    home_subtitle: 'نسخة تجريبية (بيتا). قارن الدارجة والتونسي والجزائري والمصري والشامي والخليجي… مع ربطها بالعربية الكلاسيكية وباللغات الأوروبية.',
    home_cta_search: 'ابدأ البحث',
    home_cta_contribute: 'أضف كلمتك',
    home_search_ph: 'ابحث عن كلمة… (مثال: wa5a، زادا، برضو)',
    home_tr_help_link: 'كيف نقرأ النقل الصوتي؟',
    home_note: 'الفكرة: تسهيل فهم اللهجات العربية، خصوصاً لمن وُلدوا خارج الوطن ويريدون العودة للجذور وتعلّم أساسيات العربية الكلاسيكية.',
    home_how_title: 'كيف يعمل',
    home_step1_title: 'ابحث عن كلمة',
    home_step1_desc: 'اكتب بالعربية أو باللاتينية أو FR/EN/NL/DE وستظهر اقتراحات أثناء الكتابة.',
    home_step2_title: 'قارن الاختلافات',
    home_step2_desc: 'صفِّ حسب البلد، افتح البطاقة، واكتشف مرادفات قريبة.',
    home_step3_title: 'أضف مساهمة',
    home_step3_desc: 'إذا لم تكن الكلمة موجودة، اقترحها. المشروع مجتمعي: أضف حتى الاختلافات المناطقية.',
    home_why_title: 'لماذا Zeedna 3amiat',
    home_why_1: 'مكان واحد للهجات (مع الاختلافات المناطقية).',
    home_why_2: 'ترجمات مرتبطة بـ FR/EN/NL/DE + أمثلة استعمال.',
    home_why_3: 'مشروع حي: مساهمتك تُنمّي القاعدة.',
    home_footer_search: 'بحث',
    home_footer_contribute: 'أضف كلمتك'
  },

  nl: {
    nav_dict: 'Woordenboek',
    nav_add: '➕ Voeg je woord toe',
    home_title: 'Collaboratief woordenboek van Arabische dialecten',
    home_subtitle: 'Bèta. Vergelijk darija, Tunesisch, Algerijns, Egyptisch, Levantijns, Golf… gekoppeld aan klassiek Arabisch en Europese talen.',
    home_cta_search: 'Begin met zoeken',
    home_cta_contribute: 'Voeg je woord toe',
    home_search_ph: 'Zoek een woord… (bv. wa5a, زادا, برضو)',
    home_tr_help_link: 'Hoe lees je transliteratie?',
    home_note: 'Dit is een open leer-notitieboek. Als je fouten of benaderingen ziet, klik op “Toevoegen / corrigeren” in de woordfiche om jouw versie voor te stellen.',
    home_how_title: 'Hoe werkt het',
    home_step1_title: 'Zoek een woord',
    home_step1_desc: 'Typ Arabisch, transliteratie, of FR/EN/NL/DE. Suggesties verschijnen terwijl je typt.',
    home_step2_title: 'Vergelijk varianten',
    home_step2_desc: 'Filter per land, open een fiche en ontdek nauwe synoniemen.',
    home_step3_title: 'Voeg een bijdrage toe',
    home_step3_desc: 'Ontbreekt het woord? Voeg het toe. Community-driven: voeg ook regionale varianten toe.'
  },
  es: {
    nav_dict: 'Diccionario',
    nav_add: '➕ Añade tu palabra',
    home_title: 'Diccionario colaborativo de dialectos árabes',
    home_subtitle: 'Beta. Compara darija, tunecino, argelino, egipcio, levantino, del Golfo… conectado al árabe clásico y a lenguas europeas.',
    home_cta_search: 'Empezar a buscar',
    home_cta_contribute: 'Añade tu palabra',
    home_search_ph: 'Busca una palabra… (ej.: wa5a, زادا, برضو)',
    home_tr_help_link: '¿Cómo leer la transliteración?',
    home_note: 'Es un cuaderno de aprendizaje abierto. Si ves errores o aproximaciones, pulsa “Añadir / corregir” en la ficha para proponer tu versión.',
    home_how_title: 'Cómo funciona',
    home_step1_title: 'Busca una palabra',
    home_step1_desc: 'Escribe en árabe, transliteración o FR/EN/NL/DE. Verás sugerencias mientras escribes.',
    home_step2_title: 'Compara variantes',
    home_step2_desc: 'Filtra por país, abre una ficha y descubre sinónimos cercanos.',
    home_step3_title: 'Añade una contribución',
    home_step3_desc: 'Si falta una palabra, propónla. Es comunitario: añade también variantes regionales.'
  },
  it: {
    nav_dict: 'Dizionario',
    nav_add: '➕ Aggiungi la tua parola',
    home_title: 'Dizionario collaborativo dei dialetti arabi',
    home_subtitle: 'Beta. Confronta darija, tunisino, algerino, egiziano, levantino, del Golfo… collegati all’arabo classico e alle lingue europee.',
    home_cta_search: 'Inizia a cercare',
    home_cta_contribute: 'Aggiungi la tua parola',
    home_search_ph: 'Cerca una parola… (es.: wa5a, زادا, برضو)',
    home_tr_help_link: 'Come leggere la traslitterazione?',
    home_note: 'È un quaderno di apprendimento aperto. Se noti errori o approssimazioni, clicca su “Aggiungi / correggi” nella scheda per proporre la tua versione.',
    home_how_title: 'Come funziona',
    home_step1_title: 'Cerca una parola',
    home_step1_desc: 'Scrivi in arabo, traslitterazione o FR/EN/NL/DE. Vedrai suggerimenti mentre digiti.',
    home_step2_title: 'Confronta le varianti',
    home_step2_desc: 'Filtra per paese, apri una scheda e scopri sinonimi vicini.',
    home_step3_title: 'Aggiungi un contributo',
    home_step3_desc: 'Se una parola manca, proponila. È community-driven: aggiungi anche varianti regionali.'
  }

};

function t(key){
  const pack = I18N_HOME[LANG] || I18N_HOME.en;
  const fr = I18N_HOME.fr;
  return (pack[key] ?? fr[key] ?? '');
}

function applyHomeI18n(){
  document.documentElement.lang = LANG;
  document.documentElement.dir = (LANG === 'ar') ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(!key) return;
    const val = t(key);
    if(val) el.textContent = val;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if(!key) return;
    const val = t(key);
    if(val) el.setAttribute('placeholder', val);
  });
}

// Theme toggle (same behavior as other pages)
function applyTheme(mode){
  document.body.setAttribute('data-theme', mode);
  try { localStorage.setItem('zeedna_theme', mode); } catch(e){}
}

function initThemeToggle(){
  const btn = document.getElementById('themeToggle');
  if(!btn) return;

  let saved = 'dark';
  try { saved = localStorage.getItem('zeedna_theme') || 'dark'; } catch(e){}
  if(saved !== 'light') saved = 'dark';

  applyTheme(saved);
  btn.textContent = (saved === 'light') ? '☀️' : '🌙';

  btn.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme') || 'dark';
    const next = (current === 'light') ? 'dark' : 'light';
    applyTheme(next);
    btn.textContent = (next === 'light') ? '☀️' : '🌙';
  });
}

applyHomeI18n();
initThemeToggle();


// Lang switcher
document.addEventListener('DOMContentLoaded', () => {
  // Language selector on the homepage
  try { mountLangSwitcher(document.querySelector('#langSwitcher')); } catch(e) {}
});
