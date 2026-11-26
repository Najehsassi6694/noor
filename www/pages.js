/* NOOR — Mushaf par pages (604 pages × 15 lignes, mise en page de Médine).
   data/pages.json ne contient que des POSITIONS (page, ligne, plages de mots) ; le texte vient de quran.json vérifié. */
"use strict";
(() => {
let P = null, VM = null, cur = 1, dwellT = null;
async function load() {
  if (P) return true;
  try { const d = await fetch("data/pages.json").then(r => r.json()); P = d.pages; VM = new Map(d.verses.map(v => [v[0] + ":" + v[1], v])) } catch { return false }
  return true;
}
const pageOf = (s, a) => VM?.get(s + ":" + a)?.[2] || 1;
const words = (s, a) => Q.a[s - 1][a - 1].trim().split(/\s+/);

function lineHTML(segs) {
  return segs.map(([s, a, f, t]) => {
    const w = words(s, a), end = t === w.length - 1;
    const txt = S.settings.taj && TJ ? null : w.slice(f, t + 1).map(esc).join(" ");
    let inner = txt;
    if (inner === null) { // tajweed : on reprend le rendu coloré du verset et on garde les mots de la plage
      const tmp = document.createElement("div"); tmp.innerHTML = wordsHTML(s, a, true);
      inner = [...tmp.querySelectorAll(".w")].slice(f, t + 1).map(x => x.innerHTML).join(" ");
    }
    return `<span class="pk" data-k="${s}:${a}">${inner}${end ? `<span class="end">﴿${arNum(a)}﴾</span>` : ""}</span>`;
  }).join(" ");
}
function render() {
  const p = P[cur - 1], box = $("#mpage");
  const firstSeg = Object.values(p.lines)[0]?.[0] || [1, 1];
  const surahOnPage = firstSeg[0];
  // lignes d'en-tête : avant le premier verset d'une sourate qui commence sur la page
  const special = {};
  for (const s of p.starts) {
    const L = +Object.entries(p.lines).find(([, segs]) => segs.some(x => x[0] === s && x[1] === 1 && x[2] === 0))?.[0];
    if (!L) continue;
    if (s === 1 || s === 9) special[L - 1] = { type: "head", s };
    else { special[L - 1] = { type: "basm" }; special[L - 2] = { type: "head", s } }
  }
  let h = "";
  for (let l = 1; l <= 15; l++) {
    if (p.lines[l]) {
      const segs = p.lines[l], blocked = segs.some(([s]) => !okS(s));
      const short = cur <= 2 || (l === 15 && false);
      h += blocked ? `<div class="pline blocked-line">—</div>` : `<div class="pline${short ? " center" : ""}">${lineHTML(segs)}</div>`;
    } else if (special[l]?.type === "head") h += `<div class="pline phead"><span lang="ar">سُورَةُ ${esc(Q.s[special[l].s - 1].ar)}</span></div>`;
    else if (special[l]?.type === "basm") h += `<div class="pline pbasm">${esc(Q.a[0][0])}</div>`;
    else if (cur > 2) h += `<div class="pline empty"></div>`;
  }
  box.innerHTML = h;
  box.classList.toggle("first", cur <= 2);
  $("#pgTop").textContent = `${t("quran.juz", { n: num(p.juz) })} · ${t("page.hizb", { n: num(p.hizb) })}`;
  $("#pgSurah").textContent = sName(surahOnPage);
  $("#pgNum").textContent = arNum(cur);
  $("#pgInput").value = cur;
  $("#pgTitle").textContent = t("page.page", { n: num(cur) });
  fit(); document.fonts?.ready.then(fit); setTimeout(fit, 300);
  store.set("page", cur);
  Player.highlight();
  // une page restée 10 s à l'écran compte comme lue
  clearTimeout(dwellT);
  dwellT = setTimeout(() => { if (!$("#v-page").hidden) for (const segs of Object.values(p.lines)) for (const [s, a, f, t2] of segs) if (t2 === words(s, a).length - 1) markRead(s, a) }, 10000);
}
/* Chaque ligne doit tenir sur la largeur de la page : on réduit la police si besoin */
function fit() {
  // si une ligne déborde, on réduit sa police dans la proportion du débordement (deux passes pour affiner)
  $$("#mpage .pline").forEach(l => {
    l.style.fontSize = "";
    for (let pass = 0; pass < 2; pass++) {
      const have = l.clientWidth, need = l.scrollWidth;
      if (need <= have + 1) break;
      const cur = parseFloat(getComputedStyle(l).fontSize);
      l.style.fontSize = (cur * have / need * 0.985).toFixed(2) + "px";
    }
  });
}
function go(n) { cur = Math.min(604, Math.max(1, n)); render(); $("#v-page").scrollTo?.(0, 0); scrollTo(0, 0) }
let busy = false;
async function open(n) {
  if (busy) return; busy = true;
  try {
    if ($("#v-page").hidden) route("page");
    if (!(await load())) { $("#mpage").innerHTML = `<div class="blocked">${t("tafsir.offline")}</div>`; return }
    go(n || store.get("page", 1));
  } finally { busy = false }
}
function init() {
  $("#pgPrev").onclick = () => go(cur - 1); $("#pgNext").onclick = () => go(cur + 1);
  $("#pgInput").onchange = e => go(+e.target.value || 1);
  $("#mpage").onclick = e => { const k = e.target.closest(".pk"); if (k) { const [s, a] = pr(k.dataset.k); openSheet(s, a) } };
  // glisser : comme un Mushaf imprimé, glisser vers la droite tourne vers la page suivante
  let x0 = null;
  $("#mpage").addEventListener("touchstart", e => { x0 = e.touches[0].clientX }, { passive: true });
  $("#mpage").addEventListener("touchend", e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 60) go(cur + (dx > 0 ? 1 : -1)); x0 = null });
  addEventListener("resize", () => { if (!$("#v-page").hidden) fit() });
  addEventListener("keydown", e => { if ($("#v-page").hidden) return; if (e.key === "ArrowLeft") go(cur + 1); if (e.key === "ArrowRight") go(cur - 1) });
}
window.Pages = { init, open, pageOf: (s, a) => VM ? pageOf(s, a) : null, load, refresh() { if (P && !$("#v-page").hidden) render() } };
})();
