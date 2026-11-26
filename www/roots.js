/* NOOR — Vocabulaire par racines (Quranic Arabic Corpus) avec fiches de révision.
   Les exemples sont des versets VÉRIFIÉS dans lesquels le mot est surligné, sans modifier le texte. */
"use strict";
(() => {
// Sens général des 100 racines les plus fréquentes : [français, anglais, arabe]
const M = {
"أله":["Dieu, divinité","God, deity","الألوهية والعبادة"],"قول":["dire, parole","to say, speech","القول والكلام"],"كون":["être, exister","to be, to exist","الكون والوجود"],"ربب":["Seigneur, prendre soin, éduquer","Lord, to nurture","الربوبية والتربية"],"أمن":["foi, sécurité, confiance","faith, safety, trust","الإيمان والأمان"],"علم":["savoir, science","knowledge","العلم والمعرفة"],"قوم":["se lever, peuple, droiture","to stand, people, uprightness","القيام والقوم والاستقامة"],"أيي":["signe, verset","sign, verse","الآية والعلامة"],"أتي":["venir, donner","to come, to give","المجيء والإيتاء"],"كفر":["renier, couvrir, mécréance","to deny, to cover, disbelief","الكفر والجحود"],
"بين":["clarté, entre, expliquer","clarity, between, to explain","البيان والوضوح"],"شيأ":["chose, vouloir","thing, to will","الشيء والمشيئة"],"رسل":["envoyer, messager","to send, messenger","الإرسال والرسول"],"يوم":["jour","day","اليوم"],"أرض":["terre","earth, land","الأرض"],"سمو":["ciel, élévation, nom","sky, height, name","السماء والعلو والاسم"],"كلل":["tout, chaque","all, every","الكلّ والشمول"],"عذب":["châtiment, tourment","punishment, torment","العذاب"],"عمل":["agir, œuvre","to do, deed","العمل"],"جعل":["faire, rendre, placer","to make, to place","الجعل والتصيير"],
"رحم":["miséricorde, liens de parenté","mercy, kinship","الرحمة والرحم"],"أنس":["être humain, familiarité","human, intimacy","الإنس والأُنس"],"رأي":["voir, avis","to see, opinion","الرؤية والرأي"],"كتب":["écrire, livre, prescrire","to write, book, to ordain","الكتابة والكتاب"],"هدي":["guider, bonne direction","guidance","الهداية"],"ظلم":["injustice, ténèbres","injustice, darkness","الظلم والظلمة"],"نفس":["âme, soi","soul, self","النفس"],"قبل":["avant, accepter, en face","before, to accept","القبول والقَبل"],"نزل":["descendre, révéler","to descend, to reveal","النزول والتنزيل"],"ذكر":["rappel, se souvenir, mâle","remembrance, male","الذكر والتذكّر"],
"حقق":["vérité, droit","truth, right","الحق"],"كذب":["mensonge, démentir","lie, to deny","الكذب والتكذيب"],"جيأ":["venir, apporter","to come, to bring","المجيء"],"عبد":["adorer, serviteur","to worship, servant","العبادة والعبودية"],"أخذ":["prendre, saisir","to take, to seize","الأخذ"],"خلق":["créer, création, caractère","to create, character","الخلق"],"وقي":["se préserver, piété (taqwa)","to guard, God-consciousness","الوقاية والتقوى"],"أخر":["autre, dernier, retarder","other, last, to delay","الآخرة والتأخير"],"أمر":["ordre, affaire","command, matter","الأمر"],"بعد":["après, éloignement","after, distance","البَعد والبُعد"],
"غفر":["pardonner","to forgive","المغفرة"],"ولي":["proche, allié, protecteur","ally, guardian","الولاية والقرب"],"دعو":["appeler, invoquer","to call, to supplicate","الدعاء والدعوة"],"حكم":["juger, sagesse","judgement, wisdom","الحكم والحكمة"],"ملك":["royauté, posséder","kingship, to own","المُلك والمِلك"],"جنن":["caché, jardin, djinn","hidden, garden, jinn","الجنة والجن والستر"],"عند":["auprès de","with, near","العِندية"],"خير":["bien, meilleur","good, better","الخير"],"نور":["lumière","light","النور"],"حسن":["beauté, bien faire","beauty, excellence","الحُسن والإحسان"],
"ضلل":["s'égarer","to go astray","الضلال"],"حيي":["vie, pudeur","life, modesty","الحياة والحياء"],"سمع":["entendre","to hear","السمع"],"بني":["fils, construire","son, to build","البنوّة والبناء"],"خرج":["sortir","to go out","الخروج"],"صلح":["vertu, réformer","righteousness, to reform","الصلاح والإصلاح"],"سبل":["chemin, voie","path, way","السبيل"],"تبع":["suivre","to follow","الاتّباع"],"قتل":["tuer, combattre","to kill, to fight","القتل والقتال"],"مثل":["exemple, semblable","example, likeness","المَثَل والمِثل"],
"قلب":["cœur, retourner","heart, to turn","القلب والتقلّب"],"شرك":["associer","to associate partners","الشرك والمشاركة"],"كثر":["beaucoup, abondance","many, abundance","الكثرة"],"سوأ":["mal, mauvais","evil, bad","السوء"],"موت":["mort","death","الموت"],"كبر":["grandeur, orgueil","greatness, arrogance","الكِبَر والكِبْر"],"شهد":["témoigner, être présent","to witness","الشهادة"],"نبأ":["nouvelle, prophète","news, prophet","النبأ والنبوة"],"بعض":["une partie","some, part","البعض"],"نصر":["secourir, victoire","help, victory","النصر"],
"صدق":["vérité, sincérité, aumône","truth, sincerity, charity","الصدق والصدقة"],"غير":["autre, changer","other, to change","الغيرية والتغيير"],"وعد":["promesse","promise","الوعد"],"بصر":["voir, clairvoyance","sight, insight","البصر والبصيرة"],"رود":["vouloir","to want, to intend","الإرادة"],"لقي":["rencontrer, jeter","to meet, to cast","اللقاء والإلقاء"],"دون":["en dessous, hormis","below, other than","الدون"],"نعم":["bienfait, grâce","blessing, favour","النعمة"],"سلم":["paix, soumission (islam)","peace, submission","السلام والإسلام"],"دنو":["proximité, ce bas monde","nearness, worldly life","الدنو والدنيا"],
"قدر":["mesure, pouvoir, destin","measure, power, decree","القدر والقدرة"],"نذر":["avertir","to warn","الإنذار"],"جمع":["rassembler","to gather","الجمع"],"نظر":["regarder, attendre","to look, to wait","النظر"],"سأل":["demander","to ask","السؤال"],"طوع":["obéir","to obey","الطاعة"],"عظم":["immense, os","great, bone","العظمة"],"خلف":["succéder, derrière, divergence","to succeed, behind, to differ","الخلافة والاختلاف"],"أهل":["famille, gens","family, people","الأهل"],"دخل":["entrer","to enter","الدخول"],
"أول":["premier, interprétation","first, interpretation","الأوّلية والتأويل"],"خوف":["peur","fear","الخوف"],"رزق":["subsistance","provision","الرزق"],"بشر":["être humain, bonne nouvelle","human, glad tidings","البشر والبشارة"],"يدي":["main","hand","اليد"],"عزز":["puissance, honneur","might, honour","العزة"],"جزي":["rétribuer","to recompense","الجزاء"],"أمم":["nation, mère","nation, mother","الأمة والأم"],"أبو":["père","father","الأبوّة"],"نهر":["fleuve","river","النهر"]
};
let D = null, cur = null, mode = "list", card = 0;
const meaning = r => M[r] ? M[r][LANG === "fr" ? 0 : LANG === "en" ? 1 : 2] : "";
async function load() { if (D) return true; try { D = await fetch("data/roots.json").then(r => r.json()) } catch { return false } return true }
const spaced = r => [...r].join(" ");
function exampleHTML([s, a, w]) {
  if (!okS(s)) return "";
  const toks = Q.a[s - 1][a - 1].trim().split(/\s+/);
  return `<button class="mini-verse" data-s="${s}" data-a="${a}"><span class="eyebrow"><span class="ref">${s}:${a}</span>${esc(sName(s))}</span><span class="ar" lang="ar" dir="rtl">${toks.map((x, i) => i === w ? `<mark class="root-hit">${esc(x)}</mark>` : esc(x)).join(" ")}</span>${trOf(s, a) ? `<span class="tr" dir="auto">${esc(trOf(s, a))}</span>` : ""}</button>`;
}
function render() {
  const B = $("#vocabBody");
  if (!D) { B.innerHTML = `<p class="muted">…</p>`; return }
  const list = D.roots.filter(r => M[r.r]);
  if (cur) {
    const r = D.roots.find(x => x.r === cur);
    B.innerHTML = `<button class="pill" id="vBack">← ${t("vocab.all")}</button>
      <div class="card center vocab-card"><div class="v-root" lang="ar">${spaced(r.r)}</div><b class="v-mean" dir="auto">${esc(meaning(r.r) || "—")}</b><p class="muted small">${t("vocab.count", { n: num(r.c) })}</p>
      <div class="v-lemmas">${r.l.map(([lm, c]) => `<span class="chip-topic"><span lang="ar">${esc(lm)}</span> <span class="ref">${num(c)}</span></span>`).join("")}</div></div>
      <div class="list-label">${t("vocab.examples")}</div>${r.o.slice(0, 6).map(exampleHTML).join("")}`;
    return;
  }
  if (mode === "cards") {
    const r = list[card % list.length];
    B.innerHTML = `<div class="seg small"><button data-vm="list" aria-selected="false">${t("vocab.list")}</button><button data-vm="cards" aria-selected="true">${t("vocab.cards")}</button></div>
      <div class="card center vocab-flash"><p class="muted small">${num(card % list.length + 1)} / ${num(list.length)}</p><div class="v-root" lang="ar">${spaced(r.r)}</div>
      <div id="vReveal" hidden><b class="v-mean" dir="auto">${esc(meaning(r.r))}</b><p class="muted small">${t("vocab.count", { n: num(r.c) })} · <span lang="ar">${esc(r.l[0]?.[0] || "")}</span></p></div>
      <button class="btn-primary" id="vShow">${t("vocab.show")}</button>
      <div class="row-btns center" id="vRate" hidden><button class="pill" data-rate="again">${t("vocab.again")}</button><button class="pill gold" data-rate="good">${t("vocab.good")}</button></div></div>`;
    return;
  }
  const known = store.get("vknown", {});
  B.innerHTML = `<div class="seg small"><button data-vm="list" aria-selected="true">${t("vocab.list")}</button><button data-vm="cards" aria-selected="false">${t("vocab.cards")}</button></div>
    <p class="muted small">${t("vocab.intro", { n: num(D.total) })}</p>
    <div class="vocab-grid">${list.map((r, i) => `<button class="vocab-item ${known[r.r] ? "known" : ""}" data-root="${r.r}"><span class="v-rank">${num(i + 1)}</span><span class="v-r" lang="ar">${spaced(r.r)}</span><span class="v-m" dir="auto">${esc(meaning(r.r))}</span><span class="v-c">${num(r.c)}×</span></button>`).join("")}</div>
    <p class="small muted">${esc(D.source)}</p>`;
}
function init() {
  $("#vocabBody").onclick = e => {
    const it = e.target.closest("[data-root]"); if (it) { cur = it.dataset.root; render(); scrollTo(0, 0); return }
    if (e.target.closest("#vBack")) { cur = null; render(); return }
    const vm = e.target.closest("[data-vm]"); if (vm) { mode = vm.dataset.vm; render(); return }
    if (e.target.closest("#vShow")) { $("#vReveal").hidden = false; $("#vRate").hidden = false; e.target.hidden = true; return }
    const rt = e.target.closest("[data-rate]"); if (rt) { const list = D.roots.filter(r => M[r.r]), r = list[card % list.length], k = store.get("vknown", {}); if (rt.dataset.rate === "good") k[r.r] = 1; else delete k[r.r]; store.set("vknown", k); card++; render(); return }
    const mv = e.target.closest(".mini-verse"); if (mv) openSurah(+mv.dataset.s, +mv.dataset.a);
  };
}
window.Vocab = { init, async show() { await load(); render() }, refresh() { if (D && !$("#v-vocab").hidden) render() } };
})();
