/* NOOR — « Réciter et corriger » : l'utilisateur récite à voix haute, la reconnaissance vocale transcrit,
   et NOOR compare mot à mot avec le verset VÉRIFIÉ (quran.json). Les mots attendus affichés viennent
   toujours du Mushaf ; la transcription ne sert qu'à détecter les mots oubliés, changés ou ajoutés.
   Limite assumée : on vérifie les mots, pas encore la prononciation fine (voyelles, tajweed). */
"use strict";
(() => {
/* ---------- Normalisation de l'arabe pour comparer ---------- */
const MARKS = /[ؐ-ًؚ-ٟۖ-ۭـ࣓-ࣿ]/g;
function normWord(w, dagger) {
  let x = w.replace(/وٰ/g, "ا").replace(/ىٰ/g, "ا")   // صلوٰة → صلاة, موسىٰ → موسا
    .replace(/ٰ/g, dagger ? "ا" : "")                                      // alif suscrit
    .replace(MARKS, "").replace(/[ٱأإآٲٳ]/g, "ا")
    .replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
    .replace(/[ۥۦ]/g, "").replace(/ی/g, "ي").replace(/[^ء-ي]/g, "");
  return x;
}
const variants = w => { const a = normWord(w, false), b = normWord(w, true); return a === b ? [a] : [a, b] };
function lev(a, b) {
  if (a === b) return 0; const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j), cur = new Array(n + 1);
  for (let i = 1; i <= m; i++) { cur[0] = i; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); [prev, cur] = [cur, prev] }
  return prev[n];
}
/* Deux mots sont « égaux » si l'écart est faible par rapport à leur longueur (la reconnaissance vocale
   écrit l'arabe courant : الصلاة pour ٱلصَّلَوٰةَ, etc.). */
function wordCost(expVars, said) {
  let best = 1;
  for (const e of expVars) {
    if (!e && !said) return 0;
    const d = lev(e, said), L = Math.max(e.length, said.length) || 1;
    const tol = L <= 3 ? 0 : L <= 6 ? 1 : 2;
    best = Math.min(best, d <= tol ? d / (L * 2) : 1);
  }
  return best;
}
/* Alignement mot à mot (programmation dynamique) : correct / changé / oublié / en trop. */
function align(expectedAll, saidWords, partial) {
  // les signes de pause isolés (ۛ, ۚ…) ne sont pas des mots à prononcer : on les écarte de la comparaison
  const keep = []; expectedAll.forEach((w, i) => { if (normWord(w, false)) keep.push(i) });
  const r = alignCore(keep.map(i => expectedAll[i]), saidWords, partial);
  r.ops.forEach(o => { if (o.e != null) o.e = keep[o.e] });
  r.reached = r.reached >= keep.length ? expectedAll.length : keep[r.reached];
  r.total = keep.length;
  return r;
}
function alignCore(expected, saidWords, partial) {
  const E = expected.map(variants), R = saidWords, m = E.length, n = R.length;
  const D = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0)), B = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(""));
  for (let i = 1; i <= m; i++) { D[i][0] = i; B[i][0] = "del" }
  for (let j = 1; j <= n; j++) { D[0][j] = j; B[0][j] = "ins" }
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const c = wordCost(E[i - 1], R[j - 1]);
    const sub = D[i - 1][j - 1] + (c < 1 ? c : 1), del = D[i - 1][j] + 1, ins = D[i][j - 1] + 1;
    if (sub <= del && sub <= ins) { D[i][j] = sub; B[i][j] = c < 1 ? "ok" : "sub" } else if (del <= ins) { D[i][j] = del; B[i][j] = "del" } else { D[i][j] = ins; B[i][j] = "ins" }
    // un mot du Mushaf peut être transcrit en deux mots (يَـٰٓأَيُّهَا → يا ايها)
    if (j >= 2) { const c2 = wordCost(E[i - 1], R[j - 2] + R[j - 1]); if (c2 < 1 && D[i - 1][j - 2] + c2 < D[i][j]) { D[i][j] = D[i - 1][j - 2] + c2; B[i][j] = "ok2" } }
  }
  // en cours de récitation : on s'arrête au meilleur point atteint (les mots suivants ne sont pas encore « oubliés »)
  let iEnd = m;
  if (partial) { let best = Infinity; for (let i = 0; i <= m; i++) if (D[i][n] <= best + 1e-9) { best = Math.min(best, D[i][n]); iEnd = i } }
  const ops = []; let i = iEnd, j = n;
  while (i > 0 || j > 0) {
    const b = i > 0 && j > 0 ? B[i][j] : i > 0 ? "del" : "ins";
    if (b === "ok2") { ops.push({ t: "ok", e: i - 1, s: R[j - 2] + " " + R[j - 1] }); i--; j -= 2 }
    else if (b === "ok" || b === "sub") { ops.push({ t: b, e: i - 1, s: R[j - 1] }); i--; j-- }
    else if (b === "del") { ops.push({ t: "del", e: i - 1 }); i-- }
    else { ops.push({ t: "ins", s: R[j - 1], before: i }); j-- }
  }
  ops.reverse();
  return { ops, reached: iEnd };
}
const splitSaid = txt => txt.split(/\s+/).map(w => normWord(w, false)).filter(Boolean);

/* ---------- Reconnaissance vocale (plugin natif sur Android/iOS, Web Speech dans le navigateur) ---------- */
const Speech = {
  native: () => window.Capacitor?.isNativePlatform?.() && window.Capacitor.Plugins?.SpeechRecognition,
  web: () => window.SpeechRecognition || window.webkitSpeechRecognition,
  async available() {
    const P = this.native(); if (P) { try { return (await P.available()).available } catch { return false } }
    return !!this.web();
  },
  async start(onText, onEnd) {
    this.stop();
    const P = this.native();
    if (P) {
      const perm = await P.requestPermissions().catch(() => ({}));
      if (perm.speechRecognition && perm.speechRecognition !== "granted") throw { code: "denied" };
      this.h1 = await P.addListener("partialResults", d => { const t = d.matches?.[0]; if (t) onText(t, false) });
      this.h2 = await P.addListener("listeningState", d => { if (d.status === "stopped") onEnd() });
      this.mode = "native";
      const r = await P.start({ language: "ar-SA", maxResults: 1, partialResults: true, popup: false });
      if (r?.matches?.[0]) onText(r.matches[0], true);
      return;
    }
    const R = this.web(); if (!R) throw { code: "unsupported" };
    const rec = new R(); rec.lang = "ar-SA"; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    let finalTxt = "";
    rec.onresult = e => { let interim = ""; for (let k = e.resultIndex; k < e.results.length; k++) { const r = e.results[k]; if (r.isFinal) finalTxt += " " + r[0].transcript; else interim += " " + r[0].transcript } onText((finalTxt + " " + interim).trim(), false) };
    rec.onerror = e => { this.err = e.error };
    rec.onend = () => onEnd(this.err);
    this.err = null; this.rec = rec; this.mode = "web"; rec.start();
  },
  stop() {
    if (this.mode === "native") { const P = this.native(); P?.stop().catch(() => { }); this.h1?.remove?.(); this.h2?.remove?.(); }
    if (this.mode === "web") { try { this.rec.stop() } catch { } }
    this.mode = null;
  }
};

/* ---------- Écran ---------- */
const R = { s: 1, a: 1, hide: false, listening: false, said: "", result: null, streak: 0 };
const words = (s, a) => Q.a[s - 1][a - 1].trim().split(/\s+/);
function verseWordsHTML(s, a, res) {
  const W = words(s, a), state = new Array(W.length).fill(""), said = {};
  if (res) for (const op of res.ops) { if (op.t === "ok") state[op.e] = "ok"; else if (op.t === "sub") { state[op.e] = "bad"; said[op.e] = op.s } else if (op.t === "del" && res.final) state[op.e] = "miss" }
  const cur = res && !res.final ? res.reached : -1;
  return W.map((w, i) => `<span class="rw ${state[i]} ${i === cur ? "next" : ""} ${R.hide && !state[i] ? "veil" : ""}">${esc(w)}</span>`).join(" ");
}
function render() {
  const { s, a } = R; const B = $("#reciteBody");
  if (!okS(s)) { B.innerHTML = `<div class="blocked">${t("reader.blocked")}</div>`; return }
  $("#rcSurah").value = s; $("#rcAyah").value = a; $("#rcAyah").max = Q.s[s - 1].c;
  $("#rcRef").textContent = `${sName(s)} · ${s}:${a}`;
  const res = R.result, W = words(s, a);
  let fb = "";
  if (res?.final) {
    const ok = res.ops.filter(o => o.t === "ok").length, errs = res.ops.filter(o => o.t !== "ok");
    if (!errs.length) fb = `<div class="rc-ok">✓ ${t("recite.perfect")}</div>`;
    else fb = `<div class="rc-score">${t("recite.score", { ok: num(ok), n: num(W.length) })}</div><ul class="rc-errs">` + errs.slice(0, 8).map(o =>
      o.t === "del" ? `<li><span class="tag miss">${t("recite.missed")}</span> <span class="ar-i" lang="ar">${esc(W[o.e])}</span></li>`
      : o.t === "sub" ? `<li><span class="tag bad">${t("recite.wrong")}</span> <span class="ar-i" lang="ar">${esc(W[o.e])}</span> <small>${t("recite.heard", { w: esc(o.s) })}</small></li>`
      : `<li><span class="tag extra">${t("recite.extra")}</span> <small lang="ar">${esc(o.s)}</small></li>`).join("") + `</ul>`;
  }
  B.innerHTML = `<div class="card rc-card">
      <div class="eyebrow"><span class="ref">${s}:${a}</span>${esc(sName(s))}<label class="tog rc-hide"><input type="checkbox" id="rcHide" ${R.hide ? "checked" : ""}> ${t("recite.hide")}</label></div>
      <p class="ar rc-verse" lang="ar" dir="rtl">${verseWordsHTML(s, a, res)}<span class="end">﴿${arNum(a)}﴾</span></p>
      ${trOf(s, a) && !R.hide ? `<p class="tr" dir="auto">${esc(trOf(s, a))}</p>` : ""}
    </div>
    <div class="rc-mic-wrap">
      <button class="rc-mic ${R.listening ? "on" : ""}" id="rcMic" aria-label="${esc(t(R.listening ? "recite.stop" : "recite.start"))}"><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>
      <p class="muted small center" id="rcStatus">${R.listening ? t("recite.listening") : res?.final ? "" : t("recite.hint")}</p>
      ${R.listening || R.said ? `<p class="rc-heard" lang="ar" dir="rtl">${esc(R.said)}</p>` : ""}
    </div>
    ${fb}
    <div class="row-btns center">
      <button class="pill" id="rcListen">${t("recite.listen")}</button>
      ${res?.final ? `<button class="pill" id="rcRetry">${t("recite.retry")}</button>` : ""}
      <button class="pill gold" id="rcNext">${t("recite.next")}</button>
    </div>
    <p class="disclaimer">${t("recite.note")}</p>`;
}
function judge(final) {
  const exp = words(R.s, R.a), said = splitSaid(R.said);
  const res = align(exp, said, !final); res.final = final;
  R.result = res;
  // auto-validation : tous les mots du verset reconnus → on termine
  if (!final && res.reached === exp.length && res.ops.every(o => o.t === "ok")) { finish(); return }
  render();
}
async function startListening() {
  if (!(await Speech.available())) { toast(t("recite.unsupported")); return }
  Player.stop?.();
  R.said = ""; R.result = null; R.listening = true; render();
  try {
    await Speech.start(txt => { R.said = txt; if (R.listening) judge(false) }, err => {
      if (!R.listening) return;
      if (err === "not-allowed" || err === "service-not-allowed") { R.listening = false; toast(t("recite.denied")); render(); return }
      finish();
    });
  } catch (e) { R.listening = false; toast(t(e?.code === "denied" ? "recite.denied" : "recite.unsupported")); render() }
}
function finish() {
  if (!R.listening && R.result?.final) return;
  R.listening = false; Speech.stop();
  if (!R.said.trim()) { R.result = null; render(); toast(t("recite.nothing")); return }
  judge(true);
  const ok = R.result.ops.every(o => o.t === "ok");
  if (ok) { haptic(60); R.streak++; markRead(R.s, R.a) }
}
function go(d) {
  let { s, a } = R; a += d;
  if (a < 1) { if (s === 1) return; s--; a = Q.s[s - 1].c } else if (a > Q.s[s - 1].c) { if (s === 114) return; s++; a = 1 }
  R.s = s; R.a = a; R.said = ""; R.result = null; Speech.stop(); R.listening = false; render();
}
function fill() { $("#rcSurah").innerHTML = Q.s.map(s => `<option value="${s.n}">${num(s.n)}. ${esc(LANG === "ar" ? s.ar : s.tr)}</option>`).join("") }
function init() {
  fill();
  $("#rcSurah").onchange = () => { R.s = +$("#rcSurah").value; R.a = 1; R.said = ""; R.result = null; render() };
  $("#rcAyah").onchange = () => { R.a = Math.min(Math.max(1, +$("#rcAyah").value || 1), Q.s[R.s - 1].c); R.said = ""; R.result = null; render() };
  $("#reciteBody").onclick = e => {
    if (e.target.closest("#rcMic")) return R.listening ? finish() : startListening();
    if (e.target.closest("#rcListen")) return Player.start(R.s, R.a, { single: true, repeat: 1 });
    if (e.target.closest("#rcRetry")) { R.said = ""; R.result = null; return startListening() }
    if (e.target.closest("#rcNext")) return go(1);
    if (e.target.closest(".rw.veil")) { e.target.closest(".rw").classList.remove("veil"); return }
  };
  $("#reciteBody").onchange = e => { if (e.target.id === "rcHide") { R.hide = e.target.checked; render() } };
}
let ready = false;
window.Recite = {
  init() { init(); ready = true },
  show() { if (!ready) return; if (!R.started) { R.s = S.last.s; R.a = S.last.a; R.started = true } render() },
  open(s, a) { R.s = s; R.a = a; R.started = true; R.said = ""; R.result = null; route("recite") },
  refresh() { if (!ready) return; fill(); if (location.hash.slice(1) === "recite") render() },
  leave() { if (R.listening) { R.listening = false; Speech.stop() } },
  _align: align, _norm: normWord, _split: splitSaid, _state: R, _judge: judge
};
})();
