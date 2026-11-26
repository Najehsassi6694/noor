/* NOOR — Révision et auto-test, avec répétition espacée (méthode des boîtes de Leitner).
   Les choix affichés sont des extraits des versets VÉRIFIÉS ; aucune phrase n'est inventée. */
"use strict";
(() => {
const GAPS = [0, 1, 2, 4, 8, 16, 32];   // jours avant la prochaine révision, selon la boîte
const srs = () => store.get("srs", {});
const W = (s, a) => Q.a[s - 1][a - 1].trim().split(/\s+/);
const head = (s, a, n = 5) => { const w = W(s, a); return w.slice(0, n).join(" ") + (w.length > n ? " …" : "") };
const tail = (s, a, from) => W(s, a).slice(from).join(" ");
const shuffle = x => { for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[x[i], x[j]] = [x[j], x[i]] } return x };
let R = { pool: [], q: null, n: 0, ok: 0, total: 10, surah: 0 };

function poolFrom() {
  if (R.surah) return [...Array(Q.s[R.surah - 1].c).keys()].map(i => `${R.surah}:${i + 1}`);
  return Object.keys(S.memo);
}
function due(keys) { const d = srs(), now = today(); return keys.filter(k => !d[k] || d[k].due <= now) }
function makeQuestion(k) {
  const [s, a] = pr(k), c = Q.s[s - 1].c, w = W(s, a);
  const canNext = a < c && c >= 4, canEnd = w.length >= 6;
  const type = canNext && (!canEnd || Math.random() < .5) ? "next" : canEnd ? "end" : "next";
  if (type === "next" && canNext) {
    const others = shuffle([...Array(c).keys()].map(i => i + 1).filter(x => x !== a + 1 && x !== a)).slice(0, 2);
    const opts = shuffle([a + 1, ...others]).map(x => ({ v: x, txt: head(s, x), ok: x === a + 1 }));
    return { k, s, a, type, prompt: Q.a[s - 1][a - 1], opts };
  }
  const cut = Math.max(2, Math.floor(w.length / 2)), right = tail(s, a, cut);
  // fins de verset d'autres versets de la même sourate (ou voisines) de longueur proche
  const cands = []; for (let x = 1; x <= c; x++) if (x !== a && W(s, x).length >= 4) cands.push(x);
  const wrong = shuffle(cands).slice(0, 2).map(x => { const ww = W(s, x); return ww.slice(Math.floor(ww.length / 2)).join(" ") }).filter(t2 => t2 !== right);
  const opts = shuffle([{ txt: right, ok: true }, ...wrong.map(t2 => ({ txt: t2, ok: false }))]);
  return { k, s, a, type: "end", prompt: w.slice(0, cut).join(" ") + " …", opts };
}
function grade(k, ok) {
  const d = srs(), cur = d[k] || { box: 0 };
  const box = ok ? Math.min(GAPS.length - 1, cur.box + 1) : 1;
  const next = new Date(); next.setDate(next.getDate() + GAPS[box]);
  d[k] = { box, due: dkey(next) }; store.set("srs", d);
}
function render() {
  const B = $("#reviseBody");
  if (!R.q) {
    const keys = poolFrom(), d = due(keys), memoN = Object.keys(S.memo).length;
    B.innerHTML = `<div class="card"><p>${t("rev.intro")}</p>
      <label class="field"><span>${t("rev.source")}</span><select id="revSrc"><option value="0">${t("rev.memorized", { n: num(memoN) })}</option>${Q.s.map(s => `<option value="${s.n}" ${R.surah === s.n ? "selected" : ""}>${num(s.n)}. ${esc(LANG === "ar" ? s.ar : s.tr)}</option>`).join("")}</select></label>
      <div class="rev-stats"><span><b>${num(d.length)}</b> ${t("rev.due")}</span><span><b>${num(keys.length)}</b> ${t("rev.total")}</span></div>
      ${keys.length ? `<button class="btn-primary" id="revStart">${t("rev.start")}</button>` : `<p class="muted small">${t("rev.empty")}</p>`}</div>`;
    $("#revSrc").value = R.surah;
    return;
  }
  if (R.q === "end") {
    B.innerHTML = `<div class="card center rev-end"><div class="big">${num(R.ok)}/${num(R.n)}</div><p>${t(R.ok === R.n ? "rev.perfect" : "rev.done")}</p><button class="btn-primary" id="revAgain">${t("rev.again")}</button></div>`;
    return;
  }
  const q = R.q;
  B.innerHTML = `<div class="rev-prog"><i style="width:${R.n / R.total * 100}%"></i></div>
    <div class="card rev-q"><div class="eyebrow"><span class="ref">${q.k}</span>${esc(sName(q.s))} · ${num(R.n + 1)}/${num(R.total)}</div>
      <p class="rev-ask">${t(q.type === "next" ? "rev.q_next" : "rev.q_end")}</p>
      <p class="ar rev-verse" lang="ar" dir="rtl">${esc(q.prompt)}</p></div>
    <div class="rev-opts">${q.opts.map((o, i) => `<button class="rev-opt" data-i="${i}" lang="ar" dir="rtl">${esc(o.txt)}</button>`).join("")}</div>
    <div id="revFb"></div>`;
}
function next() {
  if (R.n >= R.total || !R.pool.length) { R.q = "end"; render(); return }
  R.q = makeQuestion(R.pool.shift()); render();
}
function start() {
  const keys = poolFrom(), d = due(keys);
  R.pool = shuffle(d.length >= 3 ? d : keys).slice(0, 10); R.total = R.pool.length; R.n = 0; R.ok = 0; next();
}
function init() {
  $("#reviseBody").onclick = e => {
    if (e.target.closest("#revStart") || e.target.closest("#revAgain")) { R.q = null; return start() }
    const b = e.target.closest(".rev-opt"); if (!b || b.disabled) return;
    const q = R.q, o = q.opts[+b.dataset.i];
    $$(".rev-opt").forEach((x, i) => { x.disabled = true; if (q.opts[i].ok) x.classList.add("right") });
    if (!o.ok) b.classList.add("wrong");
    R.n++; if (o.ok) R.ok++; grade(q.k, o.ok); haptic(o.ok ? 30 : 90);
    const target = q.type === "next" ? `${q.s}:${q.a + 1}` : q.k;
    $("#revFb").innerHTML = `<div class="rev-fb ${o.ok ? "ok" : "ko"}">${t(o.ok ? "rev.right" : "rev.wrong")}</div>${miniVerse(...pr(target))}<button class="btn-primary" id="revNext">${t(R.n >= R.total ? "rev.finish" : "rev.next")}</button>`;
    $("#revNext").onclick = next;
    $("#revFb").querySelector(".mini-verse").onclick = () => openSurah(...pr(target));
  };
  $("#reviseBody").onchange = e => { if (e.target.id === "revSrc") { R.surah = +e.target.value; render() } };
}
window.Revise = { init, show() { if (!R.q || R.q === "end") { R.q = null; render() } }, refresh() { if (!$("#v-revise").hidden) render() } };
})();
