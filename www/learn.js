/* NOOR — écrans « Apprendre » : Tafsir, Tajweed et Little Noor (enfants).
   Tafsir : textes des commentaires reproduits tels quels depuis Quran.com, avec leur source.
   Tajweed : couleurs posées sur le texte vérifié (data/tajweed.json), jamais un autre texte.
   Enfants : lettres, jeu et petites sourates ; les versets viennent toujours de quran.json. */
"use strict";
(() => {
const TAFSIRS = [
  [16, "ar", "التفسير الميسر", "Al-Muyassar"], [91, "ar", "تفسير السعدي", "As-Saʿdī"], [14, "ar", "تفسير ابن كثير", "Ibn Kathīr"], [15, "ar", "تفسير الطبري", "Aṭ-Ṭabarī"],
  [90, "ar", "تفسير القرطبي", "Al-Qurṭubī"], [94, "ar", "تفسير البغوي", "Al-Baghawī"], [93, "ar", "التفسير الوسيط (طنطاوي)", "Al-Wasīṭ (Ṭanṭāwī)"],
  [169, "en", "ابن كثير (مختصر، بالإنجليزية)", "Ibn Kathir (abridged)"], [168, "en", "معارف القرآن (بالإنجليزية)", "Ma'arif al-Qur'an"], [817, "en", "تذكير القرآن (بالإنجليزية)", "Tazkirul Quran"]];
const tfName = x => LANG === "ar" ? x[2] : `${x[3]} — ${x[1] === "ar" ? (LANG === "fr" ? "arabe" : "Arabic") : (LANG === "fr" ? "anglais" : "English")}`;
const KIDS_SURAHS = [1, 112, 113, 114, 108, 103, 110, 111, 105, 106, 107, 109, 97, 95, 94, 93, 99, 100, 101, 102, 104];
const MUALLIM = "//mirrors.quranicaudio.com/everyayah/Husary_Muallim_128kbps/";
const LETTERS = [["ا", "Alif", "ألف"], ["ب", "Bā", "باء"], ["ت", "Tā", "تاء"], ["ث", "Thā", "ثاء"], ["ج", "Jīm", "جيم"], ["ح", "Ḥā", "حاء"], ["خ", "Khā", "خاء"], ["د", "Dāl", "دال"], ["ذ", "Dhāl", "ذال"], ["ر", "Rā", "راء"], ["ز", "Zāy", "زاي"], ["س", "Sīn", "سين"], ["ش", "Shīn", "شين"], ["ص", "Ṣād", "صاد"], ["ض", "Ḍād", "ضاد"], ["ط", "Ṭā", "طاء"], ["ظ", "Ẓā", "ظاء"], ["ع", "ʿAyn", "عين"], ["غ", "Ghayn", "غين"], ["ف", "Fā", "فاء"], ["ق", "Qāf", "قاف"], ["ك", "Kāf", "كاف"], ["ل", "Lām", "لام"], ["م", "Mīm", "ميم"], ["ن", "Nūn", "نون"], ["ه", "Hā", "هاء"], ["و", "Wāw", "واو"], ["ي", "Yā", "ياء"]];
const NON_JOIN = "ادذرزو", ZWJ = "‍";
const LESSONS = [["noon", ["idgham_ghunnah", "idgham_wo_ghunnah", "iqlab", "ikhafa"]], ["meem", ["ikhafa_shafawi", "idgham_shafawi"]], ["ghunna", ["ghunnah"]], ["qalqala", ["qalaqah"]], ["madd", ["madda_normal", "madda_obligatory", "madda_permissible", "madda_necessary"]], ["silent", ["ham_wasl", "laam_shamsiyah", "slnt"]]];
const LEGEND = ["ghunnah", "ikhafa", "idgham_ghunnah", "idgham_wo_ghunnah", "iqlab", "ikhafa_shafawi", "idgham_shafawi", "qalaqah", "madda_normal", "madda_permissible", "madda_obligatory", "madda_necessary", "ham_wasl", "laam_shamsiyah", "slnt"];

/* ---------- Tafsir ---------- */
let tf = { s: 1, a: 1, src: null }, tfCache = new Map(), tfReq = 0;
function defaultTafsir() { return LANG === "en" ? 169 : 16 }
function fillTafsirControls() {
  $("#tfSurah").innerHTML = Q.s.map(s => `<option value="${s.n}">${num(s.n)}. ${esc(LANG === "ar" ? s.ar : s.tr)}</option>`).join("");
  $("#tfSrc").innerHTML = TAFSIRS.map(x => `<option value="${x[0]}">${esc(tfName(x))}</option>`).join("");
}
function initTafsir() {
  fillTafsirControls();
  tf.src = store.get("tfsrc", null) || defaultTafsir();
  $("#tfSurah").onchange = () => { tf.s = +$("#tfSurah").value; tf.a = 1; loadTafsir() };
  $("#tfAyah").onchange = () => { const a = Math.min(Math.max(1, +$("#tfAyah").value || 1), Q.s[tf.s - 1].c); tf.a = a; loadTafsir() };
  $("#tfSrc").onchange = () => { tf.src = +$("#tfSrc").value; store.set("tfsrc", tf.src); loadTafsir() };
  $("#tfPrev").onclick = () => step(-1); $("#tfNext").onclick = () => step(1);
  $("#tfVerse").onclick = e => { if (e.target.closest(".mini-verse")) openSurah(tf.s, tf.a) };
}
function step(d) {
  let { s, a } = tf; a += d;
  if (a < 1) { if (s === 1) return; s--; a = Q.s[s - 1].c } else if (a > Q.s[s - 1].c) { if (s === 114) return; s++; a = 1 }
  tf.s = s; tf.a = a; loadTafsir();
}
/* Nettoie le HTML du tafsir : seules quelques balises de mise en forme sont gardées, sans attribut ; le texte est recopié tel quel. */
function cleanHTML(html) {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const ALLOW = { P: "p", H1: "h3", H2: "h3", H3: "h3", H4: "h4", B: "b", STRONG: "b", I: "i", EM: "i", BR: "br", UL: "ul", OL: "ol", LI: "li", SPAN: "span", DIV: "p", BLOCKQUOTE: "blockquote" };
  const out = document.createElement("div");
  (function walk(src, dst) {
    for (const n of src.childNodes) {
      if (n.nodeType === 3) dst.appendChild(document.createTextNode(n.nodeValue));
      else if (n.nodeType === 1) { const tag = ALLOW[n.tagName]; if (n.tagName === "SCRIPT" || n.tagName === "STYLE") continue; const el = tag ? document.createElement(tag) : document.createDocumentFragment(); walk(n, el); dst.appendChild(el) }
    }
  })(doc.body.firstChild, out);
  return out;
}
async function loadTafsir() {
  const { s, a } = tf, src = TAFSIRS.find(x => x[0] === tf.src) || TAFSIRS[0];
  $("#tfSurah").value = s; $("#tfAyah").value = a; $("#tfAyah").max = Q.s[s - 1].c; $("#tfSrc").value = src[0];
  $("#tfRef").textContent = `${sName(s)} · ${s}:${a}`;
  $("#tfVerse").innerHTML = miniVerse(s, a); $("#tfAi").innerHTML = "";
  const body = $("#tfBody"); body.dir = src[1] === "ar" ? "rtl" : "ltr"; body.lang = src[1];
  body.innerHTML = `<p class="muted">${t("tafsir.loading")}</p>`;
  const key = `${src[0]}:${s}:${a}`, my = ++tfReq;
  try {
    let data = tfCache.get(key);
    if (!data) {
      const url = `https://api.quran.com/api/v4/tafsirs/${src[0]}/by_ayah/${s}:${a}`;
      data = (window.Offline ? await window.Offline.cachedJSON(url) : await fetch(url).then(r => { if (!r.ok) throw 0; return r.json() })).tafsir; tfCache.set(key, data);
    }
    if (my !== tfReq) return;
    const keys = Object.keys(data.verses || {}), clean = cleanHTML(data.text || "");
    body.innerHTML = "";
    if (keys.length > 1) body.insertAdjacentHTML("beforeend", `<p class="tf-group" dir="auto">${t("tafsir.group", { r: `${keys[0]} – ${keys[keys.length - 1]}` })}</p>`);
    body.appendChild(clean);
    body.insertAdjacentHTML("beforeend", `<p class="src tf-src" dir="auto">◆ ${esc(t("tafsir.src", { n: src[1] === "ar" ? src[2] : src[3] }))}</p>`);
    const tdl = store.get("tafdl", {})[`${src[0]}|${s}`];
    if (window.Offline) body.insertAdjacentHTML("beforeend", `<button class="pill" id="tfDl" ${tdl ? "disabled" : ""}>${t(tdl ? "off.taf_ready" : "off.taf_download")}</button>`);
    $("#tfDl")?.addEventListener("click", async ev => { const b = ev.currentTarget; b.disabled = true; b.textContent = "…"; try { await window.Offline.downloadTafsir(src[0], s); b.textContent = t("off.taf_ready"); toast(t("off.done")) } catch { b.disabled = false; b.textContent = t("off.taf_download"); toast(t("off.error")) } });
    if (LANG === "fr") body.insertAdjacentHTML("beforeend", `<p class="small muted" dir="auto">${t("tafsir.no_fr")}</p>`);
    if (LANG !== src[1]) body.insertAdjacentHTML("beforeend", `<button class="pill ai needs-ai" id="tfSum">${t("tafsir.ai_sum")}</button>`);
    $("#tfSum")?.addEventListener("click", () => summarizeTafsir(clean.textContent, src, s, a));
  } catch {
    if (my !== tfReq) return;
    body.innerHTML = `<p>${t("tafsir.offline")}</p><button class="pill" id="tfRetry">${t("tafsir.retry")}</button>`;
    $("#tfRetry").onclick = loadTafsir;
  }
}
async function summarizeTafsir(text, src, s, a) {
  const out = aiBox($("#tfAi"), t("ai.tafsir_sum"));
  try {
    const r = await callAI({ task: "tafsir", prompt: `Faithfully summarise the following tafsir passage (${src[3]}) on verse (${s}:${a}). Do not add opinions that are not in the text, do not quote Quranic verses, refer to verses only as (surah:verse). Passage:\n\n${text.slice(0, 7000)}` });
    out.innerHTML = renderAI(r.text || "");
  } catch (e) { out.innerHTML = aiError(e) }
}
function openTafsir(s, a) { tf.s = s; tf.a = a; route("tafsir") }

/* ---------- Tajweed ---------- */
const bdiAr = h => LANG === "ar" ? h : h.replace(/[؀-ۿ](?:[؀-ۿs]*[؀-ۿ])?/g, m => `<bdi lang="ar" class="arl">${m}</bdi>`);
function examplesFor(rules, max = 3) {
  const out = [];
  for (let s = 78; s <= 114 && out.length < max; s++) for (let a = 1; a <= Q.s[s - 1].c && out.length < max; a++) {
    if (!okS(s)) continue;
    const sp = TJ?.verses[s + ":" + a]; if (!sp || Q.a[s - 1][a - 1].length > 70) continue;
    let has = false; for (let i = 2; i < sp.length; i += 3) if (rules.includes(TJ.rules[sp[i]])) { has = true; break }
    if (has && !out.some(([x]) => x === s)) out.push([s, a]);
  }
  return out;
}
async function renderTajweed() {
  const B = $("#tajweedBody");
  B.innerHTML = `<p class="muted">…</p>`;
  await loadTajweed();
  if (!TJ) { B.innerHTML = `<div class="blocked">${t("tafsir.offline")}</div>`; return }
  let h = `<div class="card"><div class="eyebrow">${t("tajweed.legend")}</div><div class="legend">${LEGEND.map(r => `<span class="lg"><i class="sw tjbg-${r}"></i>${esc(t("rule." + r))}</span>`).join("")}</div>
    <label class="tog" style="margin-top:12px"><input type="checkbox" id="tjReader" ${S.settings.taj ? "checked" : ""}> <span>${t("reader.tajweed")} · ${t("nav.quran")}</span></label>
    <p class="small muted" style="margin-bottom:0">${t("tajweed.note")}</p></div>
    <div class="list-label">${t("tajweed.lessons")}</div>`;
  LESSONS.forEach(([id, rules], i) => {
    const ex = examplesFor(rules);
    h += `<details class="card lesson" ${i === 0 ? "open" : ""}><summary><span class="ln">${num(i + 1)}</span><b>${t(`lesson.${id}.t`)}</b></summary>
      <div class="lesson-body"><p dir="auto">${bdiAr(t(`lesson.${id}.b`))}</p>
      <div class="legend">${rules.map(r => `<span class="lg"><i class="sw tjbg-${r}"></i>${esc(t("rule." + r))}</span>`).join("")}</div>
      <div class="eyebrow" style="margin-top:12px">${t("tajweed.examples")}</div>
      ${ex.map(([s, a]) => `<button class="mini-verse taj-ex" data-s="${s}" data-a="${a}"><span class="eyebrow"><span class="ref">${s}:${a}</span>${esc(sName(s))}</span><span class="ar" lang="ar" dir="rtl">${wordsHTML(s, a, true, rules)}</span><span class="src">${t("tajweed.show")}</span></button>`).join("")}
      </div></details>`;
  });
  B.innerHTML = h;
  $("#tjReader").onchange = async e => { S.settings.taj = e.target.checked; saveSettings(); $("#oTaj").checked = S.settings.taj };
  B.onclick = async e => { const m = e.target.closest(".taj-ex"); if (m) { S.settings.taj = true; saveSettings(); $("#oTaj").checked = true; openSurah(+m.dataset.s, +m.dataset.a) } };
}

/* ---------- Little Noor ---------- */
const K = { tab: "letters", stars: store.get("kstars", 0), learned: new Set(store.get("klearned", [])), game: null };
const saveK = () => { store.set("kstars", K.stars); store.set("klearned", [...K.learned]); $("#kStars").textContent = "★ " + num(K.stars) };
const addStars = n => { K.stars += n; saveK(); haptic(40) };
const lName = L => LANG === "ar" ? L[2] : L[1];
/* Prononciation des lettres : synthèse vocale native sur Android/iOS (la WebView n'en a pas),
   sinon celle du navigateur. Les voix du navigateur arrivent parfois en retard : on les attend. */
let arVoice = null;
function pickVoice() { try { arVoice = speechSynthesis.getVoices().find(v => v.lang?.toLowerCase().startsWith("ar")) || null } catch { } }
if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.addEventListener?.("voiceschanged", pickVoice) }
async function speakAr(text) {
  const TTS = window.Capacitor?.isNativePlatform?.() && window.Capacitor.Plugins?.TextToSpeech;
  if (TTS) { try { await TTS.stop().catch(() => { }); await TTS.speak({ text, lang: "ar-SA", rate: 0.8 }); return } catch { toast(t("kids.no_voice")); return } }
  try {
    if (!("speechSynthesis" in window)) throw 0;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = "ar-SA"; u.rate = .8;
    if (!arVoice) pickVoice(); if (arVoice) u.voice = arVoice;
    speechSynthesis.speak(u);
  } catch { toast(t("kids.no_voice")) }
}
function forms(ch) { return NON_JOIN.includes(ch) ? [ch, ch, ZWJ + ch, ZWJ + ch] : [ch, ch + ZWJ, ZWJ + ch + ZWJ, ZWJ + ch] }
function renderKids() {
  saveK();
  $$("#kTabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.k === K.tab));
  const B = $("#kBody");
  if (K.tab === "letters") {
    B.innerHTML = `<p class="muted small center">${t("kids.intro")}</p><div class="kgrid">${LETTERS.map((L, i) => `<button class="ktile ${K.learned.has(i) ? "on" : ""}" data-l="${i}"><span lang="ar">${L[0]}</span><small>${esc(lName(L))}</small></button>`).join("")}</div><div id="kLetter"></div>`;
  } else if (K.tab === "game") newRound();
  else {
    B.innerHTML = `<p class="muted small center">${t("kids.short")}</p><div class="kslist">${KIDS_SURAHS.map(n => `<button class="kscard" data-ks="${n}"><span class="ks-ar" lang="ar">${esc(Q.s[n - 1].ar)}</span><b>${esc(LANG === "ar" ? "سورة " + Q.s[n - 1].ar : Q.s[n - 1].tr)}</b><small>${t("quran.n_verses", { n: num(Q.s[n - 1].c) })}</small></button>`).join("")}</div><div id="kSurah"></div>`;
  }
}
function showLetter(i) {
  const L = LETTERS[i], F = forms(L[0]), names = t("kids.forms");
  $("#kLetter").innerHTML = `<div class="card kletter"><div class="kbig" lang="ar">${L[0]}</div><b class="kname">${esc(L[1])} · <span lang="ar">${L[2]}</span></b>
    <div class="kforms">${F.map((f, j) => `<span><i lang="ar">${f}</i><small>${names[j]}</small></span>`).join("")}</div>
    <div class="row-btns center"><button class="pill gold" data-say="${i}">${t("kids.listen")}</button><button class="pill" data-learn="${i}">${t("kids.learned")}</button></div></div>`;
  $("#kLetter").scrollIntoView({ behavior: "smooth", block: "nearest" });
  speakAr(L[2]);
}
function newRound() {
  const pool = [...LETTERS.keys()], target = pool[Math.floor(Math.random() * pool.length)];
  const opts = new Set([target]); while (opts.size < 4) opts.add(pool[Math.floor(Math.random() * pool.length)]);
  K.game = { target, opts: [...opts].sort(() => Math.random() - .5) };
  $("#kBody").innerHTML = `<div class="card kgame center"><div class="eyebrow" style="justify-content:center">${t("kids.find")}</div><div class="kq">${esc(lName(LETTERS[target]))}</div><button class="pill" data-say="${target}">${t("kids.listen")}</button>
    <div class="kopts">${K.game.opts.map(i => `<button class="kopt" data-pick="${i}" lang="ar">${LETTERS[i][0]}</button>`).join("")}</div><p class="kmsg" id="kMsg"></p></div>`;
  speakAr(LETTERS[target][2]);
}
function openKidsSurah(n) {
  const box = $("#kSurah");
  box.innerHTML = `<div class="card ksurah"><div class="s-banner"><span class="girih"></span><div class="arn" lang="ar">سُورَةُ ${esc(Q.s[n - 1].ar)}</div><h2>${esc(LANG === "ar" ? "" : Q.s[n - 1].tr)}</h2><div class="row-btns center"><button class="pill gold" data-kplay="${n}">${t("kids.listen_surah")}</button></div></div>
    ${okS(n) ? Q.a[n - 1].map((v, i) => `<div class="kverse" id="kv${n}-${i + 1}" data-s="${n}" data-a="${i + 1}"><span class="vnum">${num(i + 1)}</span><p class="ar" lang="ar" dir="rtl">${esc(v)}<span class="end">﴿${arNum(i + 1)}﴾</span></p>${trOf(n, i + 1) ? `<p class="tr" dir="auto">${esc(trOf(n, i + 1))}</p>` : ""}</div>`).join("") : `<div class="blocked">${t("reader.blocked")}</div>`}</div>`;
  box.scrollIntoView({ behavior: "smooth" });
}
function initKids() {
  $("#kTabs").onclick = e => { const b = e.target.closest("button"); if (b) { K.tab = b.dataset.k; renderKids() } };
  $("#kBody").onclick = e => {
    const tl = e.target.closest("[data-l]"); if (tl) return showLetter(+tl.dataset.l);
    const sy = e.target.closest("[data-say]"); if (sy) return speakAr(LETTERS[+sy.dataset.say][2]);
    const ln = e.target.closest("[data-learn]"); if (ln) { const i = +ln.dataset.learn; if (!K.learned.has(i)) { K.learned.add(i); addStars(1) } toast(t("kids.bravo")); $(`.ktile[data-l="${i}"]`)?.classList.add("on"); return }
    const pk = e.target.closest("[data-pick]"); if (pk) {
      if (+pk.dataset.pick === K.game.target) { pk.classList.add("right"); $("#kMsg").textContent = t("kids.bravo"); addStars(1); setTimeout(newRound, 900) }
      else { pk.classList.remove("wrong"); void pk.offsetWidth; pk.classList.add("wrong"); $("#kMsg").textContent = t("kids.again"); haptic(80) }
      return;
    }
    const ks = e.target.closest("[data-ks]"); if (ks) return openKidsSurah(+ks.dataset.ks);
    const kp = e.target.closest("[data-kplay]"); if (kp) { const n = +kp.dataset.kplay; Player.start(n, 1, { reciter: MUALLIM, repeat: 2, onEnd: () => { addStars(3); toast(t("kids.surah_done")) } }) }
  };
}

/* ---------- Branchement ---------- */
let ready = false;
window.Learn = {
  speak: speakAr,
  init() { initTafsir(); initKids(); ready = true },
  show(v) { if (!ready) return; if (v === "tafsir") loadTafsir(); if (v === "tajweed") renderTajweed(); if (v === "kids") renderKids() },
  openTafsir,
  refresh() { if (!ready) return; fillTafsirControls(); const v = location.hash.slice(1); if (["tafsir", "tajweed", "kids"].includes(v)) this.show(v) }
};
})();
