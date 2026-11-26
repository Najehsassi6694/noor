/* NOOR — Favoris classés (réflexion, à mémoriser, invocation, autre) avec notes personnelles.
   Les notes restent sur l'appareil. */
"use strict";
(() => {
const CATS = ["reflect", "memo", "dua", "other"];
const meta = () => store.get("bmmeta", {});
const saveMeta = m => store.set("bmmeta", m);
let filter = "all";

function editorHTML(k) {
  const m = meta()[k] || { cat: "other", note: "" };
  return `<div class="fav-ed" data-k="${k}"><div class="eyebrow">${t("fav.category")}</div>
    <div class="fav-cats">${CATS.map(c => `<button type="button" class="chip-topic ${m.cat === c ? "on" : ""}" data-cat="${c}">${t("fav.cat_" + c)}</button>`).join("")}</div>
    <label class="field"><span>${t("fav.note")}</span><textarea class="fav-note" rows="3" dir="auto" placeholder="${esc(t("fav.note_ph"))}">${esc(m.note || "")}</textarea></label>
    <button type="button" class="pill gold fav-save">${t("fav.save")}</button></div>`;
}
/* Appelé par la feuille d'actions : ajoute le favori puis ouvre l'éditeur, ou le retire */
function toggle(s, a, slot) {
  const k = s + ":" + a;
  if (S.bookmarks.includes(k)) {
    S.bookmarks = S.bookmarks.filter(x => x !== k); store.set("bm", S.bookmarks);
    const m = meta(); delete m[k]; saveMeta(m); slot.innerHTML = ""; toast(t("toast.fav_del")); return false;
  }
  S.bookmarks = [...S.bookmarks, k]; store.set("bm", S.bookmarks);
  const m = meta(); m[k] = { cat: "other", note: "", t: Date.now() }; saveMeta(m);
  slot.innerHTML = editorHTML(k); toast(t("toast.fav_add")); return true;
}
function listHTML() {
  if (!S.bookmarks.length) return `<p class="muted center" style="margin-top:30px">${t("quran.no_fav")}</p>`;
  const m = meta();
  const items = S.bookmarks.map(k => ({ k, ...(m[k] || { cat: "other", note: "" }) })).filter(x => filter === "all" || x.cat === filter).reverse();
  const counts = Object.fromEntries(CATS.map(c => [c, S.bookmarks.filter(k => (m[k]?.cat || "other") === c).length]));
  let h = `<div class="fav-filter">${["all", ...CATS].map(c => `<button class="chip-topic ${filter === c ? "on" : ""}" data-ffilter="${c}">${t(c === "all" ? "fav.all" : "fav.cat_" + c)} <span class="ref">${num(c === "all" ? S.bookmarks.length : counts[c])}</span></button>`).join("")}</div>`;
  h += items.map(x => { const [s, a] = pr(x.k); if (!valid(s, a)) return ""; return `<div class="fav-item">${miniVerse(s, a)}<div class="fav-meta"><span class="tag extra">${t("fav.cat_" + x.cat)}</span>${x.note ? `<p class="fav-note-view" dir="auto">${esc(x.note)}</p>` : ""}<button class="icon-btn" data-fedit="${x.k}">${t("fav.edit")}</button></div><div class="fav-slot"></div></div>` }).join("") || `<p class="muted center">${t("fav.none_cat")}</p>`;
  return h;
}
function onClick(e, rerender) {
  const f = e.target.closest("[data-ffilter]"); if (f) { filter = f.dataset.ffilter; rerender(); return true }
  const ed = e.target.closest("[data-fedit]"); if (ed) { const slot = ed.closest(".fav-item").querySelector(".fav-slot"); slot.innerHTML = slot.innerHTML ? "" : editorHTML(ed.dataset.fedit); return true }
  const c = e.target.closest("[data-cat]"); if (c) { c.parentElement.querySelectorAll("[data-cat]").forEach(x => x.classList.toggle("on", x === c)); return true }
  const sv = e.target.closest(".fav-save"); if (sv) {
    const box = sv.closest(".fav-ed"), k = box.dataset.k, m = meta();
    m[k] = { ...(m[k] || {}), cat: box.querySelector("[data-cat].on")?.dataset.cat || "other", note: box.querySelector(".fav-note").value.trim().slice(0, 2000), t: m[k]?.t || Date.now() };
    saveMeta(m); toast(t("fav.saved")); box.remove(); rerender?.(); return true;
  }
  return false;
}
window.Fav = { toggle, listHTML, onClick, editorHTML };
})();
