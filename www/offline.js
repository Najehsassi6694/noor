/* NOOR — Hors ligne : téléchargement des récitations et du tafsir (Cache Storage),
   et sauvegarde / transfert de la progression vers un autre téléphone. */
"use strict";
(() => {
const AUDIO = "noor-audio-v1", TAF = "noor-tafsir-v1";
const hasCache = () => "caches" in window;
const dlKey = (rec, s) => `${rec}|${s}`;
const dl = () => store.get("dl", {});

/* Source audio : le fichier téléchargé s'il existe, sinon l'adresse en ligne */
async function src(url) {
  if (!hasCache()) return url;
  try { const r = await (await caches.open(AUDIO)).match(url); if (r) return URL.createObjectURL(await r.blob()) } catch { }
  return url;
}
async function downloadSurah(s, onProgress) {
  if (!hasCache()) throw new Error("cache");
  const c = await caches.open(AUDIO), n = Q.s[s - 1].c, rec = S.settings.reciter;
  for (let a = 1; a <= n; a++) {
    const url = audioUrl(s, a);
    if (!(await c.match(url))) {
      let ok = false;
      for (let i = 0; i < 3 && !ok; i++) { try { const r = await fetch(url, { mode: "cors" }); if (r.ok) { await c.put(url, r); ok = true } } catch { } }
      if (!ok) throw new Error("net");
    }
    onProgress?.(a, n);
  }
  const d = dl(); d[dlKey(rec, s)] = Date.now(); store.set("dl", d);
}
const isDownloaded = s => !!dl()[dlKey(S.settings.reciter, s)];
async function clearAll() { if (hasCache()) { await caches.delete(AUDIO); await caches.delete(TAF) } store.set("dl", {}); store.set("tafdl", {}) }

/* Tafsir : en ligne d'abord ; toute réponse est gardée, et resservie sans connexion */
async function cachedJSON(url) {
  try {
    const r = await fetch(url); if (!r.ok) throw 0;
    const body = await r.clone().json();
    if (hasCache()) (await caches.open(TAF)).put(url, r).catch(() => { });
    return body;
  } catch {
    if (hasCache()) { const r = await (await caches.open(TAF)).match(url); if (r) return r.json() }
    throw new Error("offline");
  }
}
async function downloadTafsir(id, s) {
  const c = await caches.open(TAF);
  const j = await fetch(`https://api.quran.com/api/v4/tafsirs/${id}/by_chapter/${s}?per_page=300`).then(r => { if (!r.ok) throw 0; return r.json() });
  for (const x of j.tafsirs || []) {
    const body = { tafsir: { text: x.text, verses: { [x.verse_key]: {} }, resource_id: id } };
    await c.put(`https://api.quran.com/api/v4/tafsirs/${id}/by_ayah/${x.verse_key}`, new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } }));
  }
  const d = store.get("tafdl", {}); d[`${id}|${s}`] = 1; store.set("tafdl", d);
}
async function usage() { try { const e = await navigator.storage.estimate(); return Math.round((e.usage || 0) / 1048576) } catch { return null } }

/* Bouton de téléchargement dans l'en-tête de sourate */
function bannerButton(s) {
  return isDownloaded(s) ? `<button class="pill dl-btn done" data-dl="${s}" disabled>${t("off.ready")}</button>` : `<button class="pill dl-btn" data-dl="${s}">${t("off.download")}</button>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-dl]"); if (!b || b.disabled) return;
  const s = +b.dataset.dl; b.disabled = true;
  try { await downloadSurah(s, (a, n) => { b.textContent = t("off.progress", { a: num(a), n: num(n) }) }); b.textContent = t("off.ready"); b.classList.add("done"); toast(t("off.done")) }
  catch { b.disabled = false; b.textContent = t("off.download"); toast(t("off.error")) }
});

/* Sauvegarde : un code texte qu'on copie, qu'on s'envoie, puis qu'on colle sur l'autre téléphone */
function exportCode() {
  const data = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith("noor:")) data[k] = localStorage.getItem(k) } } catch { }
  return "NOOR1:" + btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, at: new Date().toISOString(), data }))));
}
function importCode(code) {
  const m = String(code).trim().match(/^NOOR1:([A-Za-z0-9+/=]+)$/); if (!m) throw new Error("format");
  const obj = JSON.parse(decodeURIComponent(escape(atob(m[1])))); if (!obj?.data) throw new Error("format");
  for (const [k, v] of Object.entries(obj.data)) if (k.startsWith("noor:")) localStorage.setItem(k, v);
  return obj.at;
}
async function renderSettings() {
  const box = $("#offlineBox"); if (!box) return;
  const n = Object.keys(dl()).length, mb = await usage();
  box.innerHTML = `<div class="eyebrow">${t("off.title")}</div>
    <p class="small muted">${t("off.intro")}</p>
    <p class="small">${t("off.count", { n: num(n) })}${mb !== null ? ` · ${t("off.space", { n: num(mb) })}` : ""}</p>
    ${n ? `<button class="pill" id="offClear">${t("off.clear")}</button>` : ""}`;
  const bk = $("#backupBox");
  bk.innerHTML = `<div class="eyebrow">${t("bk.title")}</div><p class="small muted">${t("bk.intro")}</p>
    <div class="row-btns"><button class="pill gold" id="bkCopy">${t("bk.copy")}</button></div>
    <label class="field"><span>${t("bk.paste")}</span><textarea id="bkIn" rows="3" dir="ltr" placeholder="NOOR1:…"></textarea></label>
    <button class="pill" id="bkRestore">${t("bk.restore")}</button>`;
}
document.addEventListener("click", async e => {
  if (e.target.closest("#offClear")) { if (e.target.dataset.sure) { await clearAll(); toast(t("off.cleared")); renderSettings() } else { e.target.dataset.sure = 1; e.target.textContent = t("off.clear_sure") } }
  if (e.target.closest("#bkCopy")) { const c = exportCode(); try { await navigator.clipboard.writeText(c); toast(t("bk.copied")) } catch { $("#bkIn").value = c; $("#bkIn").select(); toast(t("bk.select")) } }
  if (e.target.closest("#bkRestore")) { try { importCode($("#bkIn").value); toast(t("bk.restored")); setTimeout(() => location.reload(), 900) } catch { toast(t("bk.invalid")) } }
});
window.Offline = { src, downloadSurah, isDownloaded, cachedJSON, downloadTafsir, bannerButton, renderSettings, exportCode, importCode };
})();
