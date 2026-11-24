/* NOOR — « Découvrir le Coran » : une porte d'entrée simple pour les non-musulmans et les débutants.
   Ton neutre et factuel ; les versets cités viennent du Mushaf vérifié (miniVerse), jamais d'un texte écrit ici. */
"use strict";
(() => {
const TXT = {
fr: {
  intro_t: "Le Coran, en quelques mots",
  intro: [
    "Pour les musulmans, le Coran est la parole de Dieu, révélée en arabe au prophète Muhammad sur environ 23 ans, au VIIᵉ siècle.",
    "Il compte 114 chapitres, appelés sourates, eux-mêmes formés de versets (âyât). Les sourates ne sont pas classées par ordre chronologique : la plupart vont des plus longues aux plus courtes.",
    "Il parle de Dieu, de la création, des prophètes (dont Abraham, Moïse, Marie et Jésus), de la morale, de la justice et de la vie après la mort.",
    "Une traduction n'est pas le Coran lui-même : c'est une aide pour comprendre le sens. NOOR affiche toujours le texte arabe original à côté."
  ],
  start_t: "Par où commencer ?",
  start: [[1, "La première sourate, récitée dans chaque prière."], [112, "L'unicité de Dieu, en quatre versets."], [55, "La miséricorde et les bienfaits de la création."], [19, "L'histoire de Marie et de la naissance de Jésus."], [12, "Le récit complet de Joseph et de ses frères."], [49, "Le respect, la fraternité et le bon comportement."], [31, "Les conseils d'un père sage à son fils."]],
  topics_t: "Thèmes souvent recherchés",
  topics: [["Jésus et Marie", "3:45"], ["Pas de contrainte en religion", "2:256"], ["Tous les êtres humains", "49:13"], ["La valeur d'une vie", "5:32"], ["Moïse", "20:9"], ["La création", "3:190"], ["Une miséricorde pour les mondes", "21:107"], ["« À vous votre religion »", "109:6"]],
  gloss_t: "Petit lexique",
  gloss: [["Sourate", "Un chapitre du Coran (114 au total)."], ["Âyah (verset)", "Une phrase ou un passage du Coran ; le mot signifie aussi « signe »."], ["Juz", "Une des 30 parties égales, pratiques pour lire le Coran en un mois."], ["Basmala", "La formule « Au nom de Dieu, le Tout Miséricordieux, le Très Miséricordieux » qui ouvre les sourates (sauf la 9ᵉ)."], ["Tafsir", "L'explication du Coran par les savants."], ["Tajweed", "Les règles de prononciation pour réciter le Coran."], ["Qibla", "La direction de la Kaaba, à La Mecque, vers laquelle les musulmans prient."], ["Hafs", "La transmission (riwaya) de la récitation la plus répandue, utilisée dans NOOR."]],
  ask_t: "Une question ?", ask_d: "Posez-la librement à l'assistant : il répond avec respect et cite ses références, que vous pouvez lire dans le Mushaf.",
  ask_q: ["Qui est Jésus dans le Coran ?", "Que dit le Coran sur les chrétiens et les juifs ?", "Qu'est-ce que le ramadan ?", "Que dit le Coran sur la paix ?"],
  open: "Lire", ask_btn: "Demander à l'assistant"
},
en: {
  intro_t: "The Quran in a few words",
  intro: [
    "For Muslims, the Quran is the word of God, revealed in Arabic to the Prophet Muhammad over about 23 years in the 7th century.",
    "It has 114 chapters called surahs, made of verses (ayat). The surahs are not in chronological order: most run from the longest to the shortest.",
    "It speaks about God, creation, the prophets (including Abraham, Moses, Mary and Jesus), ethics, justice and life after death.",
    "A translation is not the Quran itself: it helps you understand the meaning. NOOR always shows the original Arabic text alongside it."
  ],
  start_t: "Where to start?",
  start: [[1, "The first surah, recited in every prayer."], [112, "The oneness of God, in four verses."], [55, "Mercy and the blessings of creation."], [19, "The story of Mary and the birth of Jesus."], [12, "The full story of Joseph and his brothers."], [49, "Respect, brotherhood and good conduct."], [31, "A wise father's advice to his son."]],
  topics_t: "Popular topics",
  topics: [["Jesus and Mary", "3:45"], ["No compulsion in religion", "2:256"], ["All human beings", "49:13"], ["The value of a life", "5:32"], ["Moses", "20:9"], ["Creation", "3:190"], ["A mercy to the worlds", "21:107"], ["“For you your religion”", "109:6"]],
  gloss_t: "Short glossary",
  gloss: [["Surah", "A chapter of the Quran (114 in total)."], ["Ayah (verse)", "A sentence or passage of the Quran; the word also means “sign”."], ["Juz", "One of 30 equal parts, handy for reading the Quran in a month."], ["Basmala", "The phrase “In the name of God, the Most Gracious, the Most Merciful” that opens the surahs (except the 9th)."], ["Tafsir", "Scholars' explanation of the Quran."], ["Tajweed", "The pronunciation rules for reciting the Quran."], ["Qibla", "The direction of the Kaaba in Mecca, which Muslims face in prayer."], ["Hafs", "The most widespread transmission (riwaya) of the recitation, used in NOOR."]],
  ask_t: "Got a question?", ask_d: "Ask the assistant freely: it answers respectfully and cites references you can read in the Mushaf.",
  ask_q: ["Who is Jesus in the Quran?", "What does the Quran say about Christians and Jews?", "What is Ramadan?", "What does the Quran say about peace?"],
  open: "Read", ask_btn: "Ask the assistant"
},
ar: {
  intro_t: "القرآن في كلمات",
  intro: [
    "القرآن عند المسلمين كلام الله، أُنزل بالعربية على النبي محمد ﷺ على مدى نحو ثلاث وعشرين سنة في القرن السابع الميلادي.",
    "يتكوّن من ١١٤ سورة، وكل سورة من آيات. وترتيب السور ليس بحسب النزول، وأغلبها من الأطول إلى الأقصر.",
    "يتحدث عن الله والخلق والأنبياء (ومنهم إبراهيم وموسى ومريم وعيسى) وعن الأخلاق والعدل والحياة الآخرة.",
    "الترجمة ليست هي القرآن، بل تعين على فهم معناه. ويعرض «نور» دائمًا النص العربي الأصلي إلى جانبها."
  ],
  start_t: "من أين أبدأ؟",
  start: [[1, "أول سورة في المصحف، تُقرأ في كل صلاة."], [112, "توحيد الله في أربع آيات."], [55, "رحمة الله ونِعَمه في الخلق."], [19, "قصة مريم وميلاد عيسى عليهما السلام."], [12, "قصة يوسف عليه السلام وإخوته كاملة."], [49, "الاحترام والأخوّة وحسن الخُلق."], [31, "وصايا لقمان الحكيم لابنه."]],
  topics_t: "موضوعات يكثر البحث عنها",
  topics: [["عيسى ومريم", "3:45"], ["لا إكراه في الدين", "2:256"], ["الناس جميعًا", "49:13"], ["قيمة النفس الإنسانية", "5:32"], ["موسى عليه السلام", "20:9"], ["الخلق", "3:190"], ["رحمة للعالمين", "21:107"], ["«لكم دينكم»", "109:6"]],
  gloss_t: "مفردات مختصرة",
  gloss: [["السورة", "فصل من فصول القرآن، وعددها ١١٤."], ["الآية", "جملة أو مقطع من القرآن، ومن معانيها «العلامة»."], ["الجزء", "واحد من ثلاثين قسمًا متساويًا، ييسّر ختم القرآن في شهر."], ["البسملة", "«بسم الله الرحمن الرحيم» في أول السور إلا سورة التوبة."], ["التفسير", "بيان معاني القرآن عند العلماء."], ["التجويد", "أحكام النطق في تلاوة القرآن."], ["القبلة", "جهة الكعبة في مكة التي يتوجه إليها المسلمون في صلاتهم."], ["حفص", "أشهر روايات القراءة، وهي المعتمدة في «نور»."]],
  ask_t: "عندك سؤال؟", ask_d: "اسأل المساعد بحرية: يجيب باحترام ويذكر المراجع التي يمكنك قراءتها في المصحف.",
  ask_q: ["من هو عيسى في القرآن؟", "ماذا يقول القرآن عن النصارى واليهود؟", "ما هو رمضان؟", "ماذا يقول القرآن عن السلام؟"],
  open: "اقرأ", ask_btn: "اسأل المساعد"
}};
const T = () => TXT[LANG] || TXT.fr;
function render() {
  const x = T(), B = $("#discoverBody");
  B.innerHTML = `
    <article class="card disc-intro"><span class="girih"></span><div class="eyebrow">${esc(x.intro_t)}</div>${x.intro.map(p => `<p>${esc(p)}</p>`).join("")}</article>
    <div class="list-label">${esc(x.start_t)}</div>
    <div class="disc-start">${x.start.map(([n, why]) => `<button class="card ds" data-open="${n}"><span class="snum"><i>${num(n)}</i></span><span class="ds-txt"><b>${esc(LANG === "ar" ? "سورة " + Q.s[n - 1].ar : Q.s[n - 1].tr + " — " + sMeaning(n))}</b><span>${esc(why)}</span></span><span class="ds-ar" lang="ar">${esc(Q.s[n - 1].ar)}</span></button>`).join("")}</div>
    <div class="list-label">${esc(x.topics_t)}</div>
    <div class="disc-topics">${x.topics.map(([lab, ref]) => `<button class="chip-topic" data-ref="${ref}">${esc(lab)} <span class="ref">${ref}</span></button>`).join("")}</div>
    <div id="discVerse"></div>
    <div class="list-label">${esc(x.gloss_t)}</div>
    <div class="card gloss">${x.gloss.map(([k, v]) => `<div class="gl"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join("")}</div>
    <div class="card disc-ask needs-ai"><b>${esc(x.ask_t)}</b><p class="muted small">${esc(x.ask_d)}</p><div class="sugg">${x.ask_q.map(q => `<button type="button" data-ask="${esc(q)}">${esc(q)}</button>`).join("")}</div></div>`;
}
function init() {
  $("#discoverBody").onclick = e => {
    const o = e.target.closest("[data-open]"); if (o) return openSurah(+o.dataset.open);
    const r = e.target.closest("[data-ref]"); if (r) {
      const [s, a] = pr(r.dataset.ref);
      $$(".chip-topic").forEach(c => c.classList.toggle("on", c === r));
      $("#discVerse").innerHTML = miniVerse(s, a); $("#discVerse").scrollIntoView({ behavior: "smooth", block: "nearest" }); return;
    }
    const mv = e.target.closest(".mini-verse"); if (mv) return openSurah(+mv.dataset.s, +mv.dataset.a);
    const q = e.target.closest("[data-ask]"); if (q) { route("ai"); $("#askIn").value = q.dataset.ask; $("#composer").requestSubmit() }
  };
}
let ready = false;
window.Discover = { init() { init(); ready = true }, show() { if (ready) render() }, refresh() { if (ready && location.hash.slice(1) === "discover") render() } };
})();
