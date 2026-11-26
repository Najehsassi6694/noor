/* NOOR — Plan de khatm : finir le Coran en N jours, avec le wird (pages) du jour. */
"use strict";
(() => {
const DURATIONS = [7, 10, 15, 20, 30, 40, 60, 90];
const plan = () => store.get("khatm", null);
const save = p => store.set("khatm", p);
const dayIndex = p => Math.floor((new Date(today()) - new Date(p.start)) / 864e5);
function rangeFor(p, d) { const per = 604 / p.days; const a = Math.round(d * per) + 1, b = Math.round((d + 1) * per); return [Math.min(a, 604), Math.min(b, 604)] }
function status() {
  const p = plan(); if (!p) return null;
  const d = Math.min(dayIndex(p), p.days - 1), [a, b] = rangeFor(p, d), done = new Set(p.done || []);
  const behind = [...Array(Math.max(0, d)).keys()].filter(i => !done.has(i)).length;
  return { p, d, a, b, done, behind, finished: done.size >= p.days };
}
function homeCard() {
  const c = $("#khatmCard"); if (!c) return;
  const st = status();
  if (!st) { c.hidden = true; return }
  c.hidden = false;
  c.innerHTML = st.finished
    ? `<span class="eyebrow">${t("khatm.title")}</span><b class="kc-t">${t("khatm.finished")}</b>`
    : `<span class="eyebrow">${t("khatm.today", { d: num(st.d + 1), n: num(st.p.days) })}</span><b class="kc-t">${t("khatm.pages", { a: num(st.a), b: num(st.b) })}</b><span class="kc-s">${st.behind ? t("khatm.behind", { n: num(st.behind) }) : t("khatm.on_track")}</span><span class="goal"><span class="goal-bar"><i style="width:${st.done.size / st.p.days * 100}%"></i></span></span>`;
}
function render() {
  const B = $("#khatmBody"), st = status();
  if (!st) {
    B.innerHTML = `<div class="card"><p>${t("khatm.intro")}</p><div class="eyebrow">${t("khatm.choose")}</div>
      <div class="kh-durs">${DURATIONS.map(d => `<button class="kh-dur" data-days="${d}"><b>${num(d)}</b><span>${t("khatm.days")}</span><small>${t("khatm.per_day", { n: num(Math.ceil(604 / d)) })}</small></button>`).join("")}</div>
      <p class="small muted">${t("khatm.ramadan")}</p></div>`;
    return;
  }
  const { p, d, done } = st;
  let rows = "";
  for (let i = 0; i < p.days; i++) {
    const [a, b] = rangeFor(p, i), date = new Date(new Date(p.start).getTime() + i * 864e5);
    rows += `<div class="kh-row ${done.has(i) ? "done" : ""} ${i === d ? "now" : ""}"><button class="kh-check" data-day="${i}" aria-pressed="${done.has(i)}" aria-label="${esc(t("khatm.mark"))}">${done.has(i) ? "✓" : num(i + 1)}</button><span class="kh-txt"><b>${t("khatm.pages", { a: num(a), b: num(b) })}</b><small>${date.toLocaleDateString(locale(), { weekday: "short", day: "numeric", month: "short" })}</small></span><button class="pill" data-read="${a}">${t("khatm.read")}</button></div>`;
  }
  B.innerHTML = `<div class="card kh-sum"><div class="ring" style="--v:${done.size / p.days}"><span>${num(done.size)}/${num(p.days)}</span></div><div><b>${st.finished ? t("khatm.finished") : t("khatm.today", { d: num(d + 1), n: num(p.days) })}</b><span class="muted small">${st.behind ? t("khatm.behind", { n: num(st.behind) }) : t("khatm.on_track")}</span></div></div>
    <div class="kh-list">${rows}</div>
    <button class="pill" id="khReset">${t("khatm.reset")}</button>`;
}
function init() {
  $("#khatmBody").onclick = e => {
    const d = e.target.closest("[data-days]"); if (d) { save({ start: today(), days: +d.dataset.days, done: [] }); render(); homeCard(); return }
    const c = e.target.closest("[data-day]"); if (c) { const p = plan(), i = +c.dataset.day, s = new Set(p.done); s.has(i) ? s.delete(i) : s.add(i); p.done = [...s]; save(p); render(); homeCard(); if (s.has(i)) haptic(30); return }
    const r = e.target.closest("[data-read]"); if (r) return window.Pages.open(+r.dataset.read);
    if (e.target.closest("#khReset")) { if (e.target.dataset.confirm) { store.set("khatm", null); render(); homeCard() } else { e.target.dataset.confirm = 1; e.target.textContent = t("khatm.reset_sure") } }
  };
  $("#khatmCard")?.addEventListener("click", () => { const st = status(); if (st && !st.finished) window.Pages.open(st.a); else route("khatm") });
}
window.Khatm = { init, render, homeCard };
})();
