/* NOOR — Asmāʾ Allāh al-Ḥusnā : les 99 noms (liste rapportée par at-Tirmidhī).
   Chaque verset cité vient de quran.json VÉRIFIÉ (contrôlé par scripts/build-names.mjs). */
"use strict";
(() => {
let D = null, cur = null, mode = "list", card = 0;
async function load() { if (D) return true; try { D = await fetch("data/names.json").then(r => r.json()) } catch { return false } return true }
const mean = n => LANG === "fr" ? n.fr : LANG === "en" ? n.en : n.arm;
const dayName = () => D?.names[Math.floor(Date.now() / 864e5) % 99];
const say = txt => window.Learn?.speak ? window.Learn.speak(txt) : null;
const speakBtn = (n) => `<button class="pill" data-say="${n.n}" aria-label="${t("names.listen")}">🔊 ${t("names.listen")}</button>`;
function detail(n) {
  let v = "";
  if (n.ref) { const [s, a] = pr(n.ref); v = `<div class="list-label">${t("names.in_quran")}</div>` + miniVerse(s, a) }
  else v = `<p class="muted small">${t("names.no_verse")}</p>`;
  return `<button class="pill" id="nBack">← ${t("names.all")}</button>
    <div class="card center name-card"><span class="n-num">${num(n.n)}</span><div class="n-ar" lang="ar">${esc(n.ar)}</div><b class="n-tr">${esc(n.tr)}</b><b class="n-mean" dir="auto">${esc(mean(n))}</b>
    ${LANG !== "ar" ? `<p class="muted small" lang="ar" dir="rtl">${esc(n.arm)}</p>` : ""}
    <div class="row-btns center">${speakBtn(n)}<button class="pill" data-nnav="-1">‹</button><button class="pill" data-nnav="1">›</button></div></div>${v}`;
}
function render() {
  const B = $("#namesBody");
  if (!D) { B.innerHTML = `<p class="muted">…</p>`; return }
  if (cur) { B.innerHTML = detail(D.names[cur - 1]); return }
  const seg = m => `<div class="seg small"><button data-nm="list" aria-selected="${m === "list"}">${t("vocab.list")}</button><button data-nm="cards" aria-selected="${m === "cards"}">${t("vocab.cards")}</button></div>`;
  const known = store.get("nknown", {});
  if (mode === "cards") {
    const n = D.names[card % 99];
    B.innerHTML = seg("cards") + `<div class="card center name-card"><p class="muted small">${num(card % 99 + 1)} / ${num(99)} · ${t("names.known", { n: num(Object.keys(known).length) })}</p><div class="n-ar" lang="ar">${esc(n.ar)}</div>
      <div id="nReveal" hidden><b class="n-tr">${esc(n.tr)}</b><b class="n-mean" dir="auto">${esc(mean(n))}</b></div>
      <div class="row-btns center">${speakBtn(n)}<button class="btn-primary" id="nShow">${t("vocab.show")}</button></div>
      <div class="row-btns center" id="nRate" hidden><button class="pill" data-nrate="again">${t("vocab.again")}</button><button class="pill gold" data-nrate="good">${t("vocab.good")}</button></div></div>`;
    return;
  }
  B.innerHTML = seg("list") + `<p class="muted small">${t("names.intro")}</p>
    <div class="names-grid">${D.names.map(n => `<button class="name-item ${known[n.n] ? "known" : ""}" data-n="${n.n}"><span class="v-rank">${num(n.n)}</span><span class="ni-ar" lang="ar">${esc(n.ar)}</span><span class="ni-tr">${esc(n.tr)}</span><span class="ni-m" dir="auto">${esc(mean(n))}</span></button>`).join("")}</div>
    <p class="small muted">${t("names.source")}</p>`;
}
function homeCard() {
  const el = $("#nameCard"); if (!el) return;
  if (!D) { load().then(ok => ok && homeCard()); return }
  const n = dayName();
  el.hidden = false; el.dataset.n = n.n;
  el.innerHTML = `<span class="eyebrow">${t("names.of_day")}</span><span class="n-ar" lang="ar">${esc(n.ar)}</span><span><b>${esc(n.tr)}</b> · <span dir="auto">${esc(mean(n))}</span></span>`;
}
function open(n) { cur = n || null; route("names") }
function init() {
  $("#nameCard")?.addEventListener("click", e => open(+e.currentTarget.dataset.n));
  $("#namesBody").onclick = e => {
    const sy = e.target.closest("[data-say]"); if (sy) { say(D.names[+sy.dataset.say - 1].ar); return }
    const it = e.target.closest("[data-n]"); if (it) { cur = +it.dataset.n; render(); scrollTo(0, 0); return }
    if (e.target.closest("#nBack")) { cur = null; render(); return }
    const nv = e.target.closest("[data-nnav]"); if (nv) { cur = (cur - 1 + +nv.dataset.nnav + 99) % 99 + 1; render(); return }
    const m = e.target.closest("[data-nm]"); if (m) { mode = m.dataset.nm; render(); return }
    if (e.target.closest("#nShow")) { $("#nReveal").hidden = false; $("#nRate").hidden = false; e.target.hidden = true; return }
    const rt = e.target.closest("[data-nrate]"); if (rt) { const n = D.names[card % 99], k = store.get("nknown", {}); if (rt.dataset.nrate === "good") k[n.n] = 1; else delete k[n.n]; store.set("nknown", k); card++; render(); return }
    const mv = e.target.closest(".mini-verse"); if (mv) openSurah(+mv.dataset.s, +mv.dataset.a);
  };
}
window.Names = { init, open, homeCard, async show() { await load(); render() }, refresh() { homeCard(); if (D && !$("#v-names").hidden) render() } };
})();
