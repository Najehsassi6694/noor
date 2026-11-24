/* NOOR — application Coran (Capacitor / PWA), en français, anglais et arabe.
   Règle d'or : le texte coranique affiché vient UNIQUEMENT de data/quran.json (Mushaf Uthmani,
   empreinte SHA-256 vérifiée par sourate). L'IA ne produit que des explications et des références. */
"use strict";
const EXPECTED_SHA = "43b3d84c026268bff6a9adab6ee1e40c3b8b7eae778fa362443d17febbc11763";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const arNum = n => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const num = n => LANG === "ar" ? arNum(n) : String(n);
const pad2 = n => String(n).padStart(2, "0");
const dkey = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const today = () => dkey(new Date());
const store = {
  get(k, d) { try { const v = localStorage.getItem("noor:" + k); return v == null ? d : JSON.parse(v) } catch { return d } },
  set(k, v) { try { localStorage.setItem("noor:" + k, JSON.stringify(v)) } catch { } }
};
/* Mode démonstration (?demo=1&lang=fr&theme=dark) : sert uniquement à produire les captures des stores.
   Rien n'est enregistré ; un état d'exemple est affiché. */
const QS = new URLSearchParams(location.search), DEMO = QS.get("demo") === "1";
if (DEMO) {
  const L = ["fr", "en", "ar"].includes(QS.get("lang")) ? QS.get("lang") : "fr";
  const D = { onboarded: true, settings: { lang: L, trLang: L === "ar" ? "en" : L, theme: QS.get("theme") || "light", taj: QS.get("taj") === "1", city: "makkah" }, last: { s: 18, a: 10 }, days: { [today()]: 8 }, bm: ["2:255", "94:5", "13:28"], memo: { "112:1": 1, "112:2": 1, "112:3": 1, "112:4": 1 }, bits: "f".repeat(260), kstars: 24, klearned: [0, 1, 2, 3, 4, 5] };
  store.get = (k, d) => D[k] ?? d; store.set = () => { };
}
const Native = () => window.Capacitor?.isNativePlatform?.() ? window.Capacitor : null;
const Plugin = n => Native()?.Plugins?.[n] || null;
const pr = k => k.split(":").map(Number);

const navLang = (navigator.language || "fr").slice(0, 2);
const defLang = ["ar", "en", "fr"].includes(navLang) ? navLang : "fr";
let Q, JUZ, MAN, TJ = null, OFF = [], OKS = new Array(114).fill(false);
const S = {
  settings: Object.assign({ lang: defLang, trLang: defLang === "ar" ? "none" : defLang, reciter: "Alafasy/mp3/", repeat: 1, goal: 10, theme: "auto", aiUrl: "", size: 2, mode: "verse", taj: false, city: "tunis", method: "MuslimWorldLeague", madhab: "shafi", notif: false, lat: null, lng: null }, store.get("settings", {})),
  /* adresse du serveur IA de production (www/config.js), si l'utilisateur n'en a pas saisi une autre */
  get aiUrl() { return (this.settings.aiUrl || window.NOOR_CONFIG?.aiUrl || "").trim() },
  bookmarks: store.get("bm", []), memo: store.get("memo", {}), last: store.get("last", { s: 1, a: 1 }), days: store.get("days", {}), tasbih: store.get("tasbih", { day: "", total: 0 }),
};
const saveSettings = () => store.set("settings", S.settings);
let readBits;
function loadBits() { readBits = new Uint8Array(781); const h = store.get("bits", ""); for (let i = 0; i < h.length / 2 && i < 781; i++) readBits[i] = parseInt(h.substr(i * 2, 2), 16) }
function saveBits() { store.set("bits", [...readBits].map(b => b.toString(16).padStart(2, "0")).join("")) }
function readCount() { let n = 0; for (const b of readBits) { let x = b; while (x) { n += x & 1; x >>= 1 } } return n }
const gid = (s, a) => OFF[s - 1] + a - 1;
const valid = (s, a) => Number.isInteger(s) && Number.isInteger(a) && s >= 1 && s <= 114 && a >= 1 && a <= Q.s[s - 1].c;
const okS = s => OKS[s - 1];

/* noms et traductions selon la langue */
const sName = s => LANG === "ar" ? "سورة " + Q.s[s - 1].ar : Q.s[s - 1].tr;
const sMeaning = s => LANG === "fr" ? Q.s[s - 1].fr : LANG === "en" ? Q.s[s - 1].en : Q.s[s - 1].tr;
const trOf = (s, a) => S.settings.trLang === "fr" ? Q.f[s - 1][a - 1] : S.settings.trLang === "en" ? Q.e[s - 1][a - 1] : "";
const locale = () => LANG === "ar" ? "ar" : LANG === "en" ? "en-GB" : "fr-FR";

function toast(m) { const el = $("#toast"); el.textContent = m; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 1900) }
const darkMQ = matchMedia("(prefers-color-scheme: dark)");
const isDark = () => S.settings.theme === "dark" || (S.settings.theme === "auto" && darkMQ.matches);
function applyTheme() {
  const r = document.documentElement;
  r.dataset.theme = S.settings.theme; r.style.setProperty("--ar-size", S.settings.size + "rem");
  r.classList.toggle("is-dark", isDark());
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDark() ? "#16241f" : "#F3EEE3");
  $$(".theme-toggle").forEach(b => b.setAttribute("aria-pressed", isDark()));
  const sel = $("#themeSel"); if (sel) sel.value = S.settings.theme;
}
darkMQ.addEventListener?.("change", applyTheme);
/* Bouton soleil / lune en haut des écrans, avec un dévoilement circulaire depuis le bouton */
const TOGGLE_HTML = `<button class="theme-toggle" type="button" data-i18n-aria="theme.toggle"><span class="tt-track"><svg class="tt-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="tt-moon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg></span><span class="tt-knob"></span></button>`;
/* Sélecteur de langue AR / FR / EN, à côté du bouton clair/sombre */
const LANG_CODES = { ar: "ع", fr: "FR", en: "EN" };
const LANG_NAMES = [["ar", "العربية"], ["fr", "Français"], ["en", "English"]];
const LANG_HTML = `<button class="lang-btn" type="button" aria-haspopup="menu" data-i18n-aria="set.language"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg><b class="lang-code"></b></button>`;
const BOTH = `<span class="top-ctrls">${LANG_HTML}${TOGGLE_HTML}</span>`;
function updateLangButtons() { $$(".lang-code").forEach(b => b.textContent = LANG_CODES[LANG]) }
function openLangMenu(btn) {
  closeLangMenu();
  const m = document.createElement("div"); m.className = "lang-menu"; m.setAttribute("role", "menu");
  m.innerHTML = LANG_NAMES.map(([c, n]) => `<button role="menuitemradio" aria-checked="${c === LANG}" data-setlang="${c}" lang="${c}"><span class="lm-code">${LANG_CODES[c]}</span>${n}<i>${c === LANG ? "✓" : ""}</i></button>`).join("");
  document.body.appendChild(m);
  const r = btn.getBoundingClientRect(), w = m.offsetWidth;
  m.style.top = (r.bottom + 8) + "px";
  m.style.left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8) + "px";
  btn.setAttribute("aria-expanded", "true"); m.querySelector('[aria-checked="true"]')?.focus();
}
function closeLangMenu() { $(".lang-menu")?.remove(); $$(".lang-btn").forEach(b => b.setAttribute("aria-expanded", "false")) }
function mountThemeToggles() {
  const head = $(".home-head"); if (head && !head.querySelector(".theme-toggle")) { const box = document.createElement("div"); box.className = "head-actions"; box.innerHTML = BOTH; head.appendChild(box); box.appendChild($("#goSettings")) }
  $$(".vhead h1").forEach(h => { if (!h.querySelector(".theme-toggle")) h.insertAdjacentHTML("beforeend", BOTH) });
  $$("#v-tafsir .rhead > span:last-child, #v-tajweed .rhead > span:last-child, #v-recite .rhead > span:last-child, #v-discover .rhead > span:last-child").forEach(sp => { sp.outerHTML = BOTH });
  document.addEventListener("click", e => {
    const b = e.target.closest(".theme-toggle"); if (b) return toggleTheme(b);
    const lb = e.target.closest(".lang-btn"); if (lb) return $(".lang-menu") ? closeLangMenu() : openLangMenu(lb);
    const it = e.target.closest("[data-setlang]"); if (it) { const l = it.dataset.setlang; closeLangMenu(); if (l !== LANG) { if (l !== "ar" && S.settings.trLang !== "none") S.settings.trLang = l; setLang(l); toast(LANG_NAMES.find(x => x[0] === l)[1]) } return }
    if (!e.target.closest(".lang-menu")) closeLangMenu();
  });
  addEventListener("keydown", e => { if (e.key === "Escape") closeLangMenu() });
  addEventListener("scroll", closeLangMenu, { passive: true });
  applyI18n(); applyTheme(); updateLangButtons();
}
function toggleTheme(btn) {
  const next = isDark() ? "light" : "dark";
  const swap = () => { S.settings.theme = next; saveSettings(); applyTheme() };
  haptic?.(15);
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return swap();
  const r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(swap).ready.then(() => {
    document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] }, { duration: 520, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" });
  }).catch(() => { });
}
function setLang(l, rerender = true) {
  LANG = l; S.settings.lang = l; saveSettings();
  document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  applyI18n(); updateLangButtons?.();
  $$(".lang-seg button").forEach(b => b.setAttribute("aria-selected", b.dataset.l === l));
  if (!rerender || !Q) return;
  initHomeStatic(); renderSugg(); fillSelects(); renderSrcInfo(); renderQuranList();
  const v = location.hash.slice(1) || "home"; route(v, false);
  if (v === "reader") renderSurah(cur);
  window.Learn?.refresh(); window.Recite?.refresh(); window.Discover?.refresh();
}
applyTheme(); setLang(S.settings.lang, false); mountThemeToggles();

/* ================= Démarrage ================= */
(async function boot() {
  try {
    [Q, JUZ, MAN] = await Promise.all(["data/quran.json", "data/juz.json", "data/manifest.json"].map(u => fetch(u).then(r => r.json())));
  } catch (e) { $("#splash").innerHTML = "<p style='padding:24px;text-align:center'>NOOR — erreur de chargement / loading error / خطأ في التحميل</p>"; return }
  let o = 0; Q.s.forEach((s, i) => { OFF[i] = o; o += s.c });
  loadBits();
  $("#app").hidden = false;
  initNav(); initHome(); initQuran(); initReader(); initAI(); initMore(); initPlayer(); initSheet();
  await verifyIntegrity();
  initHomeStatic(); renderQuranList();   // redessine ce qui dépend du texte vérifié (verset du jour, listes)
  if (S.settings.taj) await loadTajweed();
  window.Learn?.init(); window.Recite?.init(); window.Discover?.init(); updateAiState();
  route(location.hash.slice(1) || "home", false);
  if (!store.get("onboarded", false)) {
    $("#onboard").hidden = false;
    $("#obLang").onclick = e => { const b = e.target.closest("button"); if (b) { S.settings.trLang = b.dataset.l === "ar" ? "none" : b.dataset.l; setLang(b.dataset.l) } };
    $("#obStart").onclick = () => { store.set("onboarded", true); $("#onboard").hidden = true };
    $("#obDiscover").onclick = () => { store.set("onboarded", true); $("#onboard").hidden = true; route("discover") };
  }
  setTimeout(() => { $("#splash").classList.add("out"); setTimeout(() => $("#splash").remove(), 450) }, 450);
})();

/* Intégrité : chaque sourate est comparée à son empreinte SHA-256 du manifeste.
   Une sourate qui ne correspond pas n'est jamais affichée (échec fermé). */
async function sha256Hex(str) {
  const bytes = new TextEncoder().encode(str);
  if (window.crypto?.subtle) return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(x => x.toString(16).padStart(2, "0")).join("");
  // Repli en JavaScript pur (pages servies en http sur le réseau local)
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const l = bytes.length, n = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(n); m.set(bytes); m[l] = 0x80;
  const dv = new DataView(m.buffer); dv.setUint32(n - 4, l * 8 >>> 0); dv.setUint32(n - 8, Math.floor(l / 0x20000000));
  const w = new Uint32Array(64), r = (x, k) => (x >>> k) | (x << (32 - k));
  for (let o = 0; o < n; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) { const a = w[i - 15], b = w[i - 2]; w[i] = (w[i - 16] + (r(a, 7) ^ r(a, 18) ^ (a >>> 3)) + w[i - 7] + (r(b, 17) ^ r(b, 19) ^ (b >>> 10))) | 0 }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, "0")).join("");
}
async function verifyIntegrity() {
  const el = $("#integ");
  try {
    const NL = "\n";
    const hs = await Promise.all(Q.a.map(v => sha256Hex(v.join(NL))));
    hs.forEach((h, i) => OKS[i] = h === MAN.sha256.surahs[i]);
    const all = await sha256Hex(Q.a.map(x => x.join(NL)).join(NL));
    if (MAN.sha256.corpus !== EXPECTED_SHA || all !== EXPECTED_SHA) OKS.fill(false);
    verifyIntegrity.ok = OKS.every(Boolean) && Q.a.flat().length === 6236;
  } catch { OKS.fill(false); verifyIntegrity.ok = null }
  renderSrcInfo();
}
function renderSrcInfo() {
  const el = $("#integ"); if (!MAN) return;
  const ok = verifyIntegrity.ok;
  el.textContent = ok === null ? t("set.verify_fail") : ok ? t("set.verify_ok") : t("set.verify_bad", { n: OKS.filter(x => !x).length });
  el.style.color = ok ? "var(--accent)" : "#c0392b";
  const e = MAN.edition, trs = (MAN.translations || [MAN.translation]).map(x => `${x.author} (${x.language})`).join(", ");
  $("#srcInfo").innerHTML = t("set.src", { script: esc(e.script), riwaya: esc(e.riwaya), num: esc(e.numbering), prov: esc(e.provider), date: esc(e.retrieved), tr: esc(trs), rev: MAN.reviewer ? esc(MAN.reviewer) : t("set.reviewer_none") });
}

/* ================= Tajweed : couleurs posées sur le texte vérifié ================= */
async function loadTajweed() { if (!TJ) { try { TJ = await fetch("data/tajweed.json").then(r => r.json()) } catch { TJ = null } } return TJ }
/* Rend les mots d'un verset ; avec taj=true, colore les lettres selon les plages, sans jamais changer les caractères. */
function wordsHTML(s, a, taj, only) {
  const txt = Q.a[s - 1][a - 1], spans = taj && TJ ? TJ.verses[s + ":" + a] : null;
  let out = "", pos = 0;
  for (const w of txt.split(" ")) {
    const ws = pos, we = pos + w.length; let inner = "";
    if (spans) {
      let p = ws;
      for (let i = 0; i < spans.length; i += 3) {
        const x = spans[i], y = spans[i + 1], rule = TJ.rules[spans[i + 2]];
        if (y <= ws || x >= we) continue;
        if (only && !only.includes(rule)) continue;
        const xs = Math.max(x, ws), ys = Math.min(y, we);
        if (xs > p) inner += esc(txt.slice(p, xs));
        inner += `<span class="tj tj-${rule}" data-rule="${rule}">${esc(txt.slice(xs, ys))}</span>`; p = ys;
      }
      if (p < we) inner += esc(txt.slice(p, we));
    } else inner = esc(w);
    out += `<span class="w">${inner}</span> `; pos = we + 1;
  }
  return out.trim();
}

/* ================= Navigation ================= */
const VIEWS = ["home", "quran", "reader", "learn", "discover", "tafsir", "tajweed", "kids", "recite", "ai", "more"];
const TAB_OF = { reader: "quran", tafsir: "learn", tajweed: "learn", kids: "learn", recite: "learn", discover: "learn" };
function initNav() {
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-go]"); if (b) { route(b.dataset.go); if (b.dataset.tab) setQuranTab(b.dataset.tab); if (b.dataset.sub) setMoreTab(b.dataset.sub); return }
    const bk = e.target.closest("[data-back]"); if (bk) history.length > 1 ? history.back() : route(bk.dataset.back);
  });
  addEventListener("popstate", () => route(location.hash.slice(1) || "home", false));
}
function route(v, push = true) {
  if (!VIEWS.includes(v)) v = "home";
  VIEWS.forEach(x => $("#v-" + x).hidden = x !== v);
  const tab = TAB_OF[v] || v;
  $$(".tabbar button").forEach(b => b.dataset.go === tab ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"));
  document.body.classList.toggle("composer-on", v === "ai");
  if (push && location.hash.slice(1) !== v) history.pushState(null, "", "#" + v);
  if (v === "home") renderHome();
  if (v === "more") renderMoreTab();
  if (["tafsir", "tajweed", "kids"].includes(v)) window.Learn?.show(v);
  if (v === "recite") window.Recite?.show(); else window.Recite?.leave();
  if (v === "reader" && Q && !$("#reader").children.length) renderSurah(S.last.s, S.last.a);
  if (v === "discover") window.Discover?.show();
  if (v !== "reader") scrollTo(0, 0);
}

/* ================= Accueil ================= */
const VOTD = ["2:255", "94:5", "13:28", "39:53", "65:3", "2:153", "3:139", "2:186", "40:60", "50:16", "93:5", "49:13", "3:190", "112:1", "21:87", "14:7", "16:97", "20:114", "33:41", "57:4", "64:11", "67:2", "2:45", "3:159", "2:152", "29:69", "8:46", "31:17", "25:63", "2:286", "17:82", "18:46", "55:60", "62:10", "73:20"];
const DUAS = ["1:6", "2:127", "2:201", "2:250", "2:286", "3:8", "3:16", "3:53", "3:147", "3:191", "3:193", "7:23", "10:85", "14:40", "14:41", "17:24", "18:10", "20:25", "20:114", "23:118", "25:65", "25:74", "28:24", "59:10", "60:4", "66:8"];
const votdKey = () => VOTD[Math.floor(Date.now() / 864e5) % VOTD.length];
function initHome() {
  const [s, a] = pr(votdKey());
  $("#votdPlay").onclick = () => Player.start(s, a, { single: true });
  $("#votdOpen").onclick = () => openSurah(s, a);
  $("#votdTafsir").onclick = () => window.Learn?.openTafsir(s, a);
  $("#votdExplain").onclick = () => explainVerse(s, a, $("#votdAi"));
  $("#continueCard").onclick = e => { if (e.target.closest("#contPlay")) { e.stopPropagation(); Player.start(S.last.s, S.last.a) } else openSurah(S.last.s, S.last.a) };
  $("#goSettings").onclick = () => { route("more"); setMoreTab("settings") };
  $("#prayerCard").onclick = () => { route("more"); setMoreTab("prayer") };
  $("#duaList").onclick = e => { const b = e.target.closest(".dua"); if (b) { const [s, a] = pr(b.dataset.k); openSheet(s, a) } };
  initHomeStatic();
  setInterval(() => { if (!$("#v-home").hidden) renderPrayerCard() }, 30000);
}
function initHomeStatic() {
  const d = new Date(); let hijri = "";
  try { hijri = new Intl.DateTimeFormat(locale() + "-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(d) } catch { }
  $("#hdate").textContent = d.toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" }) + (hijri ? " · " + hijri : "");
  const k = votdKey(), [s, a] = pr(k);
  $("#votdRef").textContent = `${sName(s)} ${k}`;
  $("#votdAr").textContent = okS(s) ? Q.a[s - 1][a - 1] : "—";
  $("#votdTr").textContent = trOf(s, a); $("#votdTr").hidden = !trOf(s, a);
  const showAll = initHomeStatic.allDuas;
  $("#duaMore").textContent = showAll ? t("home.duas_less") : t("home.duas_all", { n: num(DUAS.length) });
  $("#duaMore").onclick = () => { initHomeStatic.allDuas = !initHomeStatic.allDuas; initHomeStatic() };
  $("#duaList").innerHTML = (showAll ? DUAS : DUAS.slice(0, 5)).map(k => { const [s, a] = pr(k); const tx = trOf(s, a) || Q.a[s - 1][a - 1]; return `<button class="dua" data-k="${k}"><span class="t"><b class="ref">${k}</b> <span dir="auto">${esc(tx.length > 72 ? tx.slice(0, 72) + "…" : tx)}</span></span></button>` }).join("");
}
function renderHome() {
  const h = new Date().getHours();
  $("#hello").textContent = t(h < 5 ? "home.night" : h < 12 ? "home.morning" : h < 18 ? "home.afternoon" : "home.evening");
  const { s, a } = S.last, su = Q.s[s - 1];
  $("#contTitle").textContent = LANG === "ar" ? sName(s) : `${num(su.n)}. ${su.tr}`;
  $("#contSub").textContent = `${t("home.verse_of", { a: num(a), c: num(su.c) })} · ${sMeaning(s)}`;
  $("#contAr").textContent = su.ar;
  const n = S.days[today()] || 0, g = +S.settings.goal;
  $("#ringWird").style.setProperty("--v", Math.min(1, n / g)); $("#ringWirdTxt").textContent = `${num(Math.min(n, 999))}/${num(g)}`;
  $("#goalTxt").textContent = n >= g ? t("home.wird_done") : t("home.wird_sub");
  const read = readCount(), pc = read / 6236;
  $("#ringKhatm").style.setProperty("--v", pc); $("#ringKhatmTxt").textContent = num(pc * 100 >= 1 ? Math.round(pc * 100) : pc * 100 >= 0.1 ? (pc * 100).toFixed(1) : 0) + "%";
  $("#khatmSmall").textContent = t("home.khatm_sub", { n: num(read) });
  renderPrayerCard();
}

/* ================= Liste du Coran ================= */
let quranTab = "surahs", arIdx = null;
const norm = x => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’`]/g, "'");
const normAr = x => x.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "").replace(/[ٱأإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
function initQuran() {
  $$("#v-quran .seg button").forEach(b => b.onclick = () => setQuranTab(b.dataset.t));
  let tm; $("#qSearch").oninput = () => { clearTimeout(tm); tm = setTimeout(renderQuranList, 180) };
  $("#quranList").onclick = e => { const b = e.target.closest("[data-s]"); if (b) openSurah(+b.dataset.s, +(b.dataset.a || 0)) };
  renderQuranList();
}
function setQuranTab(x) { quranTab = x; $$("#v-quran .seg button").forEach(b => b.setAttribute("aria-selected", b.dataset.t === x)); renderQuranList() }
function surahRow(s) {
  return `<button class="sitem" data-s="${s.n}"><span class="snum"><i>${num(s.n)}</i></span><span class="sname"><b>${esc(LANG === "ar" ? s.ar : s.tr)}${isSurahRead(s.n) ? `<span class="done">${t("quran.read")}</span>` : ""}</b><small>${esc(sMeaning(s.n))} · ${t("quran.n_verses", { n: num(s.c) })} · ${t(s.p === "makkah" ? "quran.makki" : "quran.madani")}</small></span><span class="sar">${esc(s.ar)}</span></button>`;
}
function miniVerse(s, a, extra = "") {
  if (!okS(s)) return `<div class="blocked">${s}:${a} — ${t("quran.blocked_mini")}</div>`;
  const tr = extra || esc(trOf(s, a));
  return `<button class="mini-verse" data-s="${s}" data-a="${a}"><span class="eyebrow"><span class="ref">${s}:${a}</span>${esc(sName(s))}</span><span class="ar" lang="ar" dir="rtl">${esc(Q.a[s - 1][a - 1])}</span>${tr ? `<span class="tr" dir="auto">${tr}</span>` : ""}<span class="src">${t("quran.verified")}</span></button>`;
}
function renderQuranList() {
  const box = $("#quranList"), raw = $("#qSearch").value.trim();
  if (raw) {
    const ref = raw.match(/^(\d{1,3})\s*[:.]\s*(\d{1,3})$/); let h = "";
    if (ref && valid(+ref[1], +ref[2])) h += `<div class="list-label">${t("quran.ref")}</div>` + miniVerse(+ref[1], +ref[2]);
    const q = norm(raw), qa = normAr(raw);
    const ss = Q.s.filter(s => norm(`${s.n} ${s.tr} ${s.fr} ${s.en}`).includes(q) || normAr(s.ar).includes(qa));
    if (ss.length) h += `<div class="list-label">${t("quran.surahs")}</div>` + ss.map(surahRow).join("");
    if (raw.length >= 3 && !ref) {
      const isAr = /[؀-ۿ]/.test(raw); if (isAr && !arIdx) arIdx = Q.a.map(v => v.map(normAr));
      const hits = [];
      for (let i = 0; i < 114 && hits.length < 80; i++) for (let j = 0; j < Q.s[i].c && hits.length < 80; j++)
        if (isAr ? arIdx[i][j].includes(qa) : (norm(Q.f[i][j]).includes(q) || norm(Q.e[i][j]).includes(q))) hits.push([i + 1, j + 1]);
      if (hits.length) h += `<div class="list-label">${t("quran.results", { n: hits.length >= 80 ? "80+" : num(hits.length), q: esc(raw) })}</div>` + hits.map(([s, a]) => miniVerse(s, a)).join("");
    }
    box.innerHTML = h || `<p class="muted center" style="margin-top:30px">${t("quran.none")}</p>`; return;
  }
  if (quranTab === "surahs") box.innerHTML = Q.s.map(surahRow).join("");
  else if (quranTab === "juz") box.innerHTML = JUZ.map(([s, a], i) => `<button class="sitem" data-s="${s}" data-a="${a}"><span class="snum"><i>${num(i + 1)}</i></span><span class="sname"><b>${t("quran.juz", { n: num(i + 1) })}</b><small>${t("quran.juz_start", { s: esc(sName(s)), r: `${s}:${a}` })}</small></span><span class="sar">الجزء ${arNum(i + 1)}</span></button>`).join("");
  else box.innerHTML = S.bookmarks.length ? S.bookmarks.map(k => { const [s, a] = pr(k); return valid(s, a) ? miniVerse(s, a) : "" }).join("") : `<p class="muted center" style="margin-top:30px">${t("quran.no_fav")}</p>`;
}
function isSurahRead(n) { const s = Q.s[n - 1]; for (let a = 1; a <= s.c; a++) { const g = gid(n, a); if (!(readBits[g >> 3] & (1 << (g & 7)))) return false } return true }

/* ================= Lecteur ================= */
let cur = 1, observer;
function initReader() {
  $("#rBack").onclick = () => history.length > 1 ? history.back() : route("quran");
  $("#rOpts").onclick = () => $("#ropts").hidden = !$("#ropts").hidden;
  $("#oSize").value = S.settings.size; $("#oTaj").checked = S.settings.taj;
  $$("#ropts .seg button").forEach(b => { b.setAttribute("aria-selected", b.dataset.mode === S.settings.mode); b.onclick = () => { S.settings.mode = b.dataset.mode; saveSettings(); $$("#ropts .seg button").forEach(x => x.setAttribute("aria-selected", x === b)); renderSurah(cur) } });
  $("#oTr").onchange = e => { $("#reader").classList.toggle("hide-tr", !e.target.checked) };
  $("#oTaj").onchange = async e => { S.settings.taj = e.target.checked; saveSettings(); if (S.settings.taj) await loadTajweed(); const y = scrollY; renderSurah(cur); scrollTo(0, y) };
  $("#oHifz").onchange = e => { $("#reader").classList.toggle("hifz", e.target.checked); $$("#reader .w").forEach(w => w.classList.remove("shown")) };
  $("#oSize").oninput = e => { S.settings.size = +e.target.value; saveSettings(); applyTheme() };
  $("#oSumm").onclick = () => { $("#ropts").hidden = true; summarizeSurah() };
  $("#reader").onclick = e => {
    const w = e.target.closest(".hifz .w"); if (w) { w.classList.add("shown"); return }
    const nx = e.target.closest("[data-next]"); if (nx) { openSurah(+nx.dataset.next); return }
    const pl = e.target.closest("[data-play-surah]"); if (pl) { Player.start(cur, 1); return }
    const m = e.target.closest("[data-v]"); if (m) { const [s, a] = pr(m.dataset.v); openSheet(s, a) }
  };
  /* Un verset compte comme « lu » s'il reste au moins 1,5 s à l'écran (bien visible, ou remplissant l'écran s'il est très long). */
  const dwell = new Map();
  observer = new IntersectionObserver(en => {
    for (const x of en) {
      const el = x.target, seen = x.isIntersecting && (x.intersectionRatio > .6 || x.intersectionRect.height > (x.rootBounds?.height || innerHeight) * .5);
      if (seen && !dwell.has(el)) dwell.set(el, setTimeout(() => { dwell.delete(el); if (!$("#v-reader").hidden) markRead(+el.dataset.s, +el.dataset.a) }, 1500));
      else if (!seen && dwell.has(el)) { clearTimeout(dwell.get(el)); dwell.delete(el) }
    }
  }, { threshold: [0, .3, .6, 1] });
  observer.reset = () => { dwell.forEach(clearTimeout); dwell.clear() };
}
function openSurah(s, a = 0) { route("reader"); renderSurah(s, a) }
function renderSurah(n, focusA = 0) {
  cur = n; const s = Q.s[n - 1], R = $("#reader"), taj = S.settings.taj && !!TJ;
  $("#rTitle").textContent = LANG === "ar" ? sName(n) : `${s.n}. ${s.tr}`;
  $("#rSub").textContent = `${sMeaning(n)} · ${t("quran.n_verses", { n: num(s.c) })}`;
  $("#oTr").checked = S.settings.trLang !== "none"; $("#oTr").disabled = S.settings.trLang === "none";
  R.classList.toggle("hide-tr", S.settings.trLang === "none");
  R.classList.toggle("taj-on", taj);
  observer.disconnect(); observer.reset?.();
  if (!okS(n)) { R.innerHTML = `<div class="blocked" style="margin-top:20px">${t("reader.blocked")}</div>`; return }
  let h = `<div class="s-banner"><span class="girih"></span><div class="arn" lang="ar">سُورَةُ ${esc(s.ar)}</div><h2>${esc(LANG === "ar" ? s.tr : s.tr + " — " + sMeaning(n))}</h2><p>${t("quran.n_verses", { n: num(s.c) })} · ${t(s.p === "makkah" ? "reader.mecca" : "reader.medina")}</p><div class="row-btns center"><button class="pill gold" data-play-surah>${t("reader.listen_surah")}</button></div></div><div id="sAi" class="ai-slot"></div>`;
  if (n !== 1 && n !== 9) h += `<div class="basmala" lang="ar">${taj ? wordsHTML(1, 1, true) : esc(Q.a[0][0])}</div>`;
  if (S.settings.mode === "mushaf") {
    h += `<div class="mushaf" lang="ar">` + Q.a[n - 1].map((_, i) => `<span class="mv" id="v${n}-${i + 1}" data-v="${n}:${i + 1}" data-s="${n}" data-a="${i + 1}">${wordsHTML(n, i + 1, taj)}<span class="end">﴿${arNum(i + 1)}﴾</span></span> `).join("") + `</div>`;
  } else {
    for (let a = 1; a <= s.c; a++) {
      const k = n + ":" + a, tr = trOf(n, a);
      h += `<article class="verse" id="v${n}-${a}" data-s="${n}" data-a="${a}">
        <div class="vbar"><span class="vnum">${k}</span>${S.bookmarks.includes(k) ? '<span class="vmark">★</span>' : ""}${S.memo[k] ? `<span class="vmark">${t("reader.memorized")}</span>` : ""}<button class="vmore" data-v="${k}" aria-label="${esc(t("reader.actions", { k }))}">⋯</button></div>
        <div class="ar" lang="ar" dir="rtl">${wordsHTML(n, a, taj)}<span class="end">﴿${arNum(a)}﴾</span></div>
        ${tr ? `<p class="tr" dir="auto">${esc(tr)}</p>` : ""}</article>`;
    }
  }
  if (n < 114) h += `<button class="next-surah" data-next="${n + 1}">${t("reader.next", { s: esc(sName(n + 1)) })}</button>`;
  R.innerHTML = h;
  R.querySelectorAll("[data-a]").forEach(el => observer.observe(el));
  if (focusA > 1) { const el = $(`#v${n}-${focusA}`); if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash") } } else scrollTo(0, 0);
  S.last = { s: n, a: focusA || 1 }; store.set("last", S.last);
  Player.highlight();
}
let saveT;
function markRead(s, a) {
  S.last = { s, a }; const g = gid(s, a), key = "rd:" + today();
  if (!markRead.day || markRead.day.k !== key) markRead.day = { k: key, set: new Set(store.get(key, [])) };
  if (!markRead.day.set.has(g)) {
    markRead.day.set.add(g); S.days[today()] = markRead.day.set.size; readBits[g >> 3] |= 1 << (g & 7);
    clearTimeout(saveT); saveT = setTimeout(() => {
      store.set(key, [...markRead.day.set]); store.set("last", S.last); saveBits();
      const keys = Object.keys(S.days).sort(); while (keys.length > 60) delete S.days[keys.shift()]; store.set("days", S.days);
    }, 600);
  } else { clearTimeout(saveT); saveT = setTimeout(() => store.set("last", S.last), 600) }
}

/* ================= Feuille d'actions ================= */
let sheetRef = null;
function initSheet() {
  $("#sheetBg").onclick = closeSheet;
  $("#sheet").onclick = e => {
    const b = e.target.closest("[data-sa]"); if (!b || !sheetRef) return;
    const [s, a] = sheetRef, k = s + ":" + a;
    switch (b.dataset.sa) {
      case "play": closeSheet(); Player.start(s, a); break;
      case "repeat": closeSheet(); Player.start(s, a, { single: true, repeat: Math.max(3, +S.settings.repeat) }); toast(t("toast.repeat")); break;
      case "tafsir": closeSheet(); window.Learn?.openTafsir(s, a); break;
      case "recite": closeSheet(); window.Recite?.open(s, a); break;
      case "bm": S.bookmarks = S.bookmarks.includes(k) ? S.bookmarks.filter(x => x !== k) : [...S.bookmarks, k]; store.set("bm", S.bookmarks); updateSheetIcons(); refreshVerseMarks(s); toast(t(S.bookmarks.includes(k) ? "toast.fav_add" : "toast.fav_del")); break;
      case "memo": if (S.memo[k]) delete S.memo[k]; else S.memo[k] = Date.now(); store.set("memo", S.memo); updateSheetIcons(); refreshVerseMarks(s); break;
      case "copy": copyText(verseText(s, a)); break;
      case "share": shareVerse(s, a); break;
      case "explain": explainVerse(s, a, $("#shAi")); break;
    }
  };
  addEventListener("keydown", e => { if (e.key === "Escape") closeSheet() });
}
function openSheet(s, a) {
  sheetRef = [s, a];
  $("#shRef").textContent = `${s}:${a}`; $("#shName").textContent = `${sName(s)} · ${sMeaning(s)}`;
  $("#shAi").innerHTML = ""; updateSheetIcons();
  $("#sheet").hidden = $("#sheetBg").hidden = false;
}
function closeSheet() { $("#sheet").hidden = $("#sheetBg").hidden = true }
function updateSheetIcons() { const k = sheetRef.join(":"); $("#shBmIc").textContent = S.bookmarks.includes(k) ? "★" : "☆"; $("#shMemoIc").textContent = S.memo[k] ? "✓" : "○" }
function refreshVerseMarks(s) { if (cur === s && !$("#v-reader").hidden && S.settings.mode === "verse") { const y = scrollY; renderSurah(s); scrollTo(0, y) } }
const verseText = (s, a) => `${Q.a[s - 1][a - 1]}${trOf(s, a) ? `\n\n« ${trOf(s, a)} »` : ""}\n— ${sName(s)} (${s}:${a})`;
async function copyText(x) { try { await navigator.clipboard.writeText(x); toast(t("toast.copied")) } catch { toast(t("toast.copy_fail")) } }
async function shareVerse(s, a) { const x = verseText(s, a); try { const sh = Plugin("Share"); if (sh) await sh.share({ text: x }); else if (navigator.share) await navigator.share({ text: x }); else copyText(x) } catch { } }

/* ================= Audio ================= */
const RECITERS = [["Alafasy/mp3/", "Mishary Rashid Alafasy"], ["AbdulBaset/Murattal/mp3/", "Abdul Basit · Murattal"], ["AbdulBaset/Mujawwad/mp3/", "Abdul Basit · Mujawwad"], ["Sudais/mp3/", "Abdur-Rahman As-Sudais"], ["Shatri/mp3/", "Abu Bakr Ash-Shatri"], ["Minshawi/Murattal/mp3/", "Al-Minshawi · Murattal"], ["//mirrors.quranicaudio.com/everyayah/Husary_64kbps/", "Mahmoud Al-Husary"], ["//mirrors.quranicaudio.com/everyayah/Husary_Muallim_128kbps/", "Al-Husary · Muallim"], ["Shuraym/mp3/", "Saud Ash-Shuraim"], ["Rifai/mp3/", "Hani Ar-Rifai"]];
const audioUrl = (s, a, rec) => { const p = rec || S.settings.reciter, f = String(s).padStart(3, "0") + String(a).padStart(3, "0") + ".mp3"; return (p.startsWith("//") ? "https:" + p : "https://verses.quran.com/" + p) + f };
const recName = r => (RECITERS.find(x => x[0] === r) || [, "NOOR"])[1];
const Player = {
  el: new Audio(), s: 0, a: 0, rep: 1, left: 1, single: false, on: false, rec: null, onEnd: null, onVerse: null,
  start(s, a, o = {}) { this.s = s; this.a = a; this.single = !!o.single; this.rep = o.repeat || +S.settings.repeat; this.left = this.rep; this.rec = o.reciter || null; this.onEnd = o.onEnd || null; this.onVerse = o.onVerse || null; this.play() },
  play() {
    if (!okS(this.s)) return;
    this.el.src = audioUrl(this.s, this.a, this.rec); this.on = true;
    this.el.play().catch(() => { toast(t("toast.audio")); this.setUI() });
    this.setUI(); this.highlight(); this.media(); this.onVerse?.(this.s, this.a);
  },
  toggle() { if (this.el.paused) this.el.play().catch(() => { }); else this.el.pause() },
  next() { if (this.a < Q.s[this.s - 1].c) { this.a++; this.left = this.rep; this.play() } else { const cb = this.onEnd; this.stop(); cb?.() } },
  prev() { if (this.a > 1) { this.a--; this.left = this.rep; this.play() } },
  ended() {
    if (--this.left > 0) { this.el.currentTime = 0; this.el.play(); this.setUI(); return }
    if (this.single) { this.left = this.rep; this.setUI(); return }
    markRead(this.s, this.a); this.next();
  },
  stop() { this.el.pause(); this.on = false; $("#player").hidden = true; this.highlight() },
  setUI() {
    $("#player").hidden = !this.on;
    $("#pTitle").textContent = `${sName(this.s)} · ${this.s}:${this.a}`;
    $("#pSub").textContent = recName(this.rec || S.settings.reciter) + (this.rep > 1 ? " · " + t("player.rep", { i: num(this.rep - this.left + 1), n: num(this.rep) }) : "");
    $("#pIcon").innerHTML = this.el.paused ? '<path d="M7 5v14l12-7z"/>' : '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';
  },
  highlight() {
    $$(".playing").forEach(e => e.classList.remove("playing"));
    if (!this.on) return;
    const el = $(`#v${this.s}-${this.a}`) || $(`#kv${this.s}-${this.a}`);
    if (el && !el.closest("[hidden]")) { el.classList.add("playing"); el.scrollIntoView({ block: "center", behavior: "smooth" }) }
  },
  media() {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: `${sName(this.s)} ${this.s}:${this.a}`, artist: recName(this.rec || S.settings.reciter), album: "NOOR" });
      navigator.mediaSession.setActionHandler("nexttrack", () => this.next()); navigator.mediaSession.setActionHandler("previoustrack", () => this.prev());
    } catch { }
  }
};
window.Player = Player;
function initPlayer() {
  const el = Player.el; el.preload = "auto";
  el.onended = () => Player.ended(); el.onplay = el.onpause = () => Player.setUI();
  $("#pPlay").onclick = () => Player.toggle(); $("#pNext").onclick = () => Player.next(); $("#pPrev").onclick = () => Player.prev(); $("#pClose").onclick = () => Player.stop();
}

/* ================= IA (avec garde-fous) ================= */
const AR_RUN = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿][؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿\s‌‍]*/g;
/* En arabe, l'IA écrit en arabe : on ne retire alors que les passages portant des signes de vocalisation coranique (harakat). */
const AR_QURANIC = /[؀-ۿ\s]*[ً-ْٰۖ-ۭ][؀-ۿً-ْٰۖ-ۭ\s]*/g;
function renderAI(text) {
  let x = esc(text);
  x = LANG === "ar" ? x.replace(AR_QURANIC, m => /[ً-ْٰۖ-ۭ].*[ً-ْٰۖ-ۭ].*[ً-ْٰۖ-ۭ]/.test(m) ? ` <span class="cut">${t("ai.removed")}</span> ` : m)
    : x.replace(AR_RUN, `<span class="cut">${t("ai.removed")}</span> `);
  x = x.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/^#+\s*/gm, "").replace(/^[-•]\s+/gm, "• ");
  x = x.replace(/\b(\d{1,3}):(\d{1,3})(-\d{1,3})?\b/g, (m, s, a) => valid(+s, +a) ? `<button class="refbtn" data-ref="${+s}:${+a}">${m}</button>` : `${m} <span class="cut">${t("ai.bad_ref")}</span>`);
  return x.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
}
const refsIn = x => { const o = []; for (const m of x.matchAll(/\b(\d{1,3}):(\d{1,3})\b/g)) { const k = `${+m[1]}:${+m[2]}`; if (valid(+m[1], +m[2]) && !o.includes(k)) o.push(k) } return o };
document.addEventListener("click", e => { const r = e.target.closest(".refbtn"); if (r) { const [s, a] = pr(r.dataset.ref); closeSheet(); openSurah(s, a) } });
function aiBox(slot, label) {
  slot.innerHTML = `<div class="aiout"><div class="aitag"><span>${esc(t("ai.label", { x: label }))}</span><span>${t("ai.not_quran")}</span></div><div class="aitext" dir="auto"><p class="typing muted">${t("ai.thinking")}</p></div></div>`;
  return slot.querySelector(".aitext");
}
async function callAI(body) {
  const url = S.aiUrl.replace(/\/+$/, "");
  if (!url) throw { code: "no_server" };
  const r = await fetch(url + "/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, lang: LANG }) });
  if (r.status === 429) throw { code: "rate_limited" };
  if (!r.ok) throw { code: "server" };
  return r.json();
}
const aiError = e => `<p>${t(e?.code === "no_server" ? "ai.no_server" : e?.code === "rate_limited" ? "ai.rate" : "ai.error")}</p>`;
const ctx = (s, a) => { const L = []; for (let i = Math.max(1, a - 2); i <= Math.min(Q.s[s - 1].c, a + 2); i++) L.push(`(${s}:${i})${i === a ? " [*]" : ""} ${Q.e[s - 1][i - 1]}`); return L.join("\n") };
async function explainVerse(s, a, slot) {
  const out = aiBox(slot, t("ai.explain_of", { k: `${s}:${a}` }));
  try { const r = await callAI({ task: "explain", prompt: `Verse (${s}:${a}), surah ${Q.s[s - 1].tr}. Saheeh International translation of the verse [*] and its immediate context:\n${ctx(s, a)}\n\nGive: the general meaning, the lessons, the context of revelation only if it is established, and 1 to 3 related verses by reference.` }); out.innerHTML = renderAI(r.text || "") } catch (e) { out.innerHTML = aiError(e) }
}
async function summarizeSurah() {
  const s = Q.s[cur - 1], out = aiBox($("#sAi"), t("ai.summary_of", { s: sName(cur) }));
  try { const r = await callAI({ task: "summary", prompt: `Present surah ${s.n} ${s.tr} (${s.en}), ${s.c} verses, revealed in ${s.p === "makkah" ? "Mecca" : "Medina"}. Give its main themes with, for each, the verse range as (surah:verse), then 2 practical lessons.` }); out.innerHTML = renderAI(r.text || "") } catch (e) { out.innerHTML = aiError(e) }
}
let aiMode = "ask"; const hist = [];
function initAI() {
  $$("#v-ai .seg button").forEach(b => b.onclick = () => { aiMode = b.dataset.a; $$("#v-ai .seg button").forEach(x => x.setAttribute("aria-selected", x === b)); renderSugg() });
  renderSugg();
  $("#sugg").onclick = e => { const b = e.target.closest("button"); if (b) { $("#askIn").value = b.textContent; $("#composer").requestSubmit() } };
  const ta = $("#askIn"); ta.oninput = () => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 120) + "px" };
  ta.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#composer").requestSubmit() } };
  $("#chat").onclick = e => { const m = e.target.closest(".mini-verse"); if (m) openSurah(+m.dataset.s, +m.dataset.a) };
  $("#composer").onsubmit = async e => {
    e.preventDefault(); const q = ta.value.trim(); if (!q) return;
    ta.value = ""; ta.style.height = "auto"; $("#sugg").hidden = true;
    const wrap = document.createElement("div"); wrap.className = "turn"; wrap.innerHTML = `<div class="bubble-me" dir="auto"></div><div class="slot"></div><div class="refs"></div>`;
    wrap.firstChild.textContent = q; $("#chat").appendChild(wrap);
    const out = aiBox(wrap.querySelector(".slot"), aiMode === "ask" ? t("ai.answer") : t("ai.theme", { q }));
    wrap.scrollIntoView({ block: "start", behavior: "smooth" });
    try {
      if (aiMode === "ask") {
        const prev = hist.slice(-3).map(h => `Previous question: ${h.q}\nPrevious answer: ${h.a}`).join("\n\n");
        const r = await callAI({ task: "ask", prompt: (prev ? prev + "\n\n" : "") + "Question: " + q });
        out.innerHTML = renderAI(r.text || ""); hist.push({ q, a: r.text || "" });
        const refs = refsIn(r.text || "").slice(0, 5);
        if (refs.length) wrap.querySelector(".refs").innerHTML = `<p class="muted small" style="margin:10px 0 0">${t("ai.cited")}</p>` + refs.map(k => { const [s, a] = pr(k); return miniVerse(s, a) }).join("");
      } else {
        const r = await callAI({ task: "theme", prompt: q });
        const items = (Array.isArray(r?.json?.versets) ? r.json.versets : []).map(x => { const m = String(x.ref || "").match(/^(\d{1,3}):(\d{1,3})$/); return m && valid(+m[1], +m[2]) ? { s: +m[1], a: +m[2], why: String(x.pourquoi || "") } : null }).filter(Boolean);
        out.innerHTML = renderAI(String(r?.json?.intro || "")) + `<p class="small muted">${t("ai.refs_ok", { n: num(items.length) })}</p>`;
        wrap.querySelector(".refs").innerHTML = items.map(it => miniVerse(it.s, it.a) + `<p class="small muted" style="margin:4px 4px 0" dir="auto">✦ ${esc(it.why)}</p>`).join("");
      }
    } catch (err) { out.innerHTML = aiError(err) }
  };
}
const aiOn = () => !!S.aiUrl;
function updateAiState() { document.body.classList.toggle("no-ai", !aiOn()); renderSugg() }
function renderSugg() {
  $("#askIn").placeholder = t(aiMode === "ask" ? "ai.ph_ask" : "ai.ph_theme");
  const setup = $("#aiSetup");
  if (!aiOn()) {
    if (!setup) $("#chat").insertAdjacentHTML("beforebegin", `<div class="card ai-setup" id="aiSetup"><b>${t("ai.setup_t")}</b><p>${t("ai.setup_d")}</p><button class="pill gold" data-go="more" data-sub="settings">${t("ai.setup_btn")}</button></div>`);
    else setup.innerHTML = `<b>${t("ai.setup_t")}</b><p>${t("ai.setup_d")}</p><button class="pill gold" data-go="more" data-sub="settings">${t("ai.setup_btn")}</button>`;
    $("#sugg").hidden = true; return;
  }
  setup?.remove();
  if ($("#chat").children.length) return;
  $("#sugg").hidden = false; $("#sugg").innerHTML = t(aiMode === "ask" ? "ai.sugg_ask" : "ai.sugg_theme").map(x => `<button type="button" dir="auto">${esc(x)}</button>`).join("");
}

/* ================= Prières, Qibla, Tasbih, Progrès, Réglages ================= */
const CITIES = { tunis: ["Tunis", "تونس", 36.8065, 10.1815], sfax: ["Sfax", "صفاقس", 34.7406, 10.7603], sousse: ["Sousse", "سوسة", 35.8256, 10.6084], alger: ["Alger / Algiers", "الجزائر", 36.7538, 3.0588], oran: ["Oran", "وهران", 35.6971, -0.6308], casablanca: ["Casablanca", "الدار البيضاء", 33.5731, -7.5898], rabat: ["Rabat", "الرباط", 34.0209, -6.8416], tripoli: ["Tripoli", "طرابلس", 32.8872, 13.1913], caire: ["Le Caire / Cairo", "القاهرة", 30.0444, 31.2357], paris: ["Paris", "باريس", 48.8566, 2.3522], lyon: ["Lyon", "ليون", 45.764, 4.8357], marseille: ["Marseille", "مرسيليا", 43.2965, 5.3698], bruxelles: ["Bruxelles / Brussels", "بروكسل", 50.8503, 4.3517], geneve: ["Genève / Geneva", "جنيف", 46.2044, 6.1432], londres: ["Londres / London", "لندن", 51.5074, -0.1278], montreal: ["Montréal", "مونتريال", 45.5017, -73.5673], newyork: ["New York", "نيويورك", 40.7128, -74.006], dakar: ["Dakar", "داكار", 14.7167, -17.4677], abidjan: ["Abidjan", "أبيدجان", 5.36, -4.0083], makkah: ["La Mecque / Makkah", "مكة المكرمة", 21.4225, 39.8262], madinah: ["Médine / Madinah", "المدينة المنورة", 24.4672, 39.6111], istanbul: ["Istanbul", "إسطنبول", 41.0082, 28.9784], dubai: ["Dubaï / Dubai", "دبي", 25.2048, 55.2708], jakarta: ["Jakarta", "جاكرتا", -6.2088, 106.8456] };
const METHODS = { MuslimWorldLeague: ["Ligue islamique mondiale", "Muslim World League", "رابطة العالم الإسلامي"], Egyptian: ["Égypte", "Egyptian", "الهيئة المصرية"], UmmAlQura: ["Umm al-Qura", "Umm al-Qura", "أم القرى"], Karachi: ["Karachi", "Karachi", "كراتشي"], Dubai: ["Dubaï", "Dubai", "دبي"], Kuwait: ["Koweït", "Kuwait", "الكويت"], Qatar: ["Qatar", "Qatar", "قطر"], Turkey: ["Turquie (Diyanet)", "Turkey (Diyanet)", "تركيا"], NorthAmerica: ["Amérique du Nord (ISNA)", "North America (ISNA)", "أمريكا الشمالية"], MoonsightingCommittee: ["Moonsighting Committee", "Moonsighting Committee", "لجنة رؤية الهلال"], Singapore: ["Singapour", "Singapore", "سنغافورة"], Tehran: ["Téhéran", "Tehran", "طهران"] };
const LI = () => LANG === "fr" ? 0 : LANG === "en" ? 1 : 2;
/* « La Mecque / Makkah » : nom français avant la barre, nom anglais après */
const cityName = c => { if (LANG === "ar") return c[1]; const [fr, en] = c[0].split(" / "); return LANG === "en" ? (en || fr) : fr };
function coords() {
  if (S.settings.city === "gps" && S.settings.lat != null) return [t("prayer.my_pos"), S.settings.lat, S.settings.lng];
  const c = CITIES[S.settings.city] || CITIES.tunis; return [cityName(c), c[2], c[3]];
}
function prayerTimes(date = new Date()) {
  if (!window.adhan) return null;
  const [, lat, lng] = coords(), c = new adhan.Coordinates(lat, lng);
  const p = (adhan.CalculationMethod[S.settings.method] || adhan.CalculationMethod.MuslimWorldLeague)();
  p.madhab = S.settings.madhab === "hanafi" ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  if (Math.abs(lat) > 48) p.highLatitudeRule = adhan.HighLatitudeRule.recommended(c);
  return new adhan.PrayerTimes(c, date, p);
}
const fmt = d => d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
const PKEYS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
function nextPrayer() {
  const now = new Date(), tt = prayerTimes(now); if (!tt) return null;
  for (const k of ["fajr", "dhuhr", "asr", "maghrib", "isha"]) if (tt[k] > now) return [k, tt[k]];
  const tm = new Date(now); tm.setDate(tm.getDate() + 1); return ["fajr", prayerTimes(tm).fajr];
}
function renderPrayerCard() {
  const n = nextPrayer(); if (!n) return;
  $("#pcCity").textContent = coords()[0]; $("#pcName").textContent = t("pn." + n[0]); $("#pcTime").textContent = fmt(n[1]);
  const m = Math.max(0, Math.round((n[1] - new Date()) / 60000));
  $("#pcCount").textContent = t("home.in", { t: m >= 60 ? t("home.hm", { h: num(Math.floor(m / 60)), m: num(pad2(m % 60)) }) : t("home.m", { m: num(m) }) });
}
function renderPrayer() {
  const tt = prayerTimes(), n = nextPrayer(); $("#ptCity").textContent = coords()[0];
  $("#ptList").innerHTML = PKEYS.map(k => `<div class="pt ${n && n[0] === k && n[1].toDateString() === new Date().toDateString() ? "next" : ""}"><b data-next="${t("prayer.next_tag")}">${t("pn." + k)}</b><span>${fmt(tt[k])}</span></div>`).join("");
}
let moreTab = "prayer";
function setMoreTab(x) { moreTab = x; $$("#v-more .seg button").forEach(b => b.setAttribute("aria-selected", b.dataset.m === x)); $$("#v-more .sub").forEach(el => el.hidden = el.id !== "m-" + x); renderMoreTab() }
function renderMoreTab() { if (moreTab === "prayer") renderPrayer(); if (moreTab === "qibla") renderQibla(); if (moreTab === "progress") renderProgress(); if (moreTab === "tasbih") window.renderTasbih?.() }
function fillSelects() {
  const city = $("#citySel");
  city.innerHTML = (S.settings.lat != null ? `<option value="gps">📍 ${esc(t("prayer.my_pos"))} (${S.settings.lat}, ${S.settings.lng})</option>` : "") + Object.entries(CITIES).map(([k, v]) => `<option value="${k}">${esc(cityName(v))}</option>`).join("");
  city.value = S.settings.city;
  $("#methodSel").innerHTML = Object.entries(METHODS).map(([k, v]) => `<option value="${k}">${v[LI()]}</option>`).join(""); $("#methodSel").value = S.settings.method;
  $("#repeatSel").innerHTML = [1, 3, 5, 10].map(n => `<option value="${n}">${t("set.times", { n: num(n) })}</option>`).join(""); $("#repeatSel").value = S.settings.repeat;
  $("#langSel").value = LANG; $("#trSel").value = S.settings.trLang;
}
function initMore() {
  $$("#v-more .seg button").forEach(b => b.onclick = () => setMoreTab(b.dataset.m));
  fillSelects();
  $("#madhabSel").value = S.settings.madhab;
  const onP = () => { S.settings.city = $("#citySel").value; S.settings.method = $("#methodSel").value; S.settings.madhab = $("#madhabSel").value; saveSettings(); renderPrayer(); scheduleNotifs() };
  $("#citySel").onchange = $("#methodSel").onchange = $("#madhabSel").onchange = onP;
  $("#locBtn").onclick = () => {
    if (!navigator.geolocation) return toast(t("prayer.loc_unavail"));
    toast(t("prayer.locating"));
    navigator.geolocation.getCurrentPosition(p => {
      S.settings.lat = +p.coords.latitude.toFixed(4); S.settings.lng = +p.coords.longitude.toFixed(4); S.settings.city = "gps"; saveSettings();
      fillSelects(); renderPrayer(); scheduleNotifs(); toast(t("prayer.loc_saved"));
    }, () => toast(t("prayer.loc_denied")), { timeout: 15000 });
  };
  $("#compassBtn").onclick = startCompass;
  // Tasbih
  const DHIKR = [["SubhanAllah", "سبحان الله"], ["Alhamdulillah", "الحمد لله"], ["Allahu Akbar", "الله أكبر"], ["La ilaha illa Allah", "لا إله إلا الله"], ["Astaghfirullah", "أستغفر الله"]];
  let dk = 0, count = 0, target = 33;
  const dName = d => LANG === "ar" ? d[1] : d[0];
  const drawSeg = () => $("#dhikrSeg").innerHTML = DHIKR.map((d, i) => `<button data-i="${i}" aria-selected="${i === dk}">${dName(d)}</button>`).join("");
  $("#dhikrSeg").onclick = e => { const b = e.target.closest("button"); if (!b) return; dk = +b.dataset.i; count = 0; drawSeg(); renderTasbih() };
  $("#tasbihBtn").onclick = () => {
    count++; if (S.tasbih.day !== today()) S.tasbih = { day: today(), total: 0 }; S.tasbih.total++; store.set("tasbih", S.tasbih);
    haptic(count % target === 0 ? 300 : 15); if (count % target === 0) toast(`${num(target)} × ${dName(DHIKR[dk])} ✓`); renderTasbih();
  };
  $("#tReset").onclick = () => { count = 0; renderTasbih() };
  $("#tTargetBtn").onclick = () => { target = target === 33 ? 99 : target === 99 ? 100 : 33; renderTasbih() };
  window.renderTasbih = () => { drawSeg(); $("#tCount").textContent = num(count); $("#tTarget").textContent = "/ " + num(target); $("#tTargetBtn").textContent = t("tasbih.target", { n: num(target) }); $("#tToday").textContent = num(S.tasbih.day === today() ? S.tasbih.total : 0) };
  // Réglages
  $("#reciterSel").innerHTML = RECITERS.map(([v, n]) => `<option value="${v}">${n}</option>`).join("");
  $("#reciterSel").value = S.settings.reciter; $("#goalSel").value = S.settings.goal; $("#themeSel").value = S.settings.theme; $("#aiUrl").value = S.settings.aiUrl; if (window.NOOR_CONFIG?.aiUrl) $("#aiUrl").placeholder = window.NOOR_CONFIG.aiUrl;
  $("#langSel").onchange = e => setLang(e.target.value);
  $("#trSel").onchange = e => { S.settings.trLang = e.target.value; saveSettings(); initHomeStatic() };
  $("#reciterSel").onchange = e => { S.settings.reciter = e.target.value; saveSettings(); toast(t("set.reciter_changed")) };
  $("#repeatSel").onchange = e => { S.settings.repeat = +e.target.value; saveSettings() };
  $("#goalSel").onchange = e => { S.settings.goal = +e.target.value; saveSettings() };
  $("#themeSel").onchange = e => { S.settings.theme = e.target.value; saveSettings(); applyTheme() };
  $("#aiUrl").onchange = e => { S.settings.aiUrl = e.target.value.trim(); saveSettings(); updateAiState(); toast(t("set.ai_saved")) };
  if (Plugin("LocalNotifications")) {
    $("#m-settings .card").insertAdjacentHTML("beforeend", `<label class="tog" style="margin-top:14px"><input type="checkbox" id="notifChk" ${S.settings.notif ? "checked" : ""}> <span data-i18n="prayer.notif">${t("prayer.notif")}</span></label>`);
    $("#notifChk").onchange = async e => { S.settings.notif = e.target.checked; saveSettings(); await scheduleNotifs(true) };
    scheduleNotifs();
  }
}
function haptic(ms) { const h = Plugin("Haptics"); if (h) h.impact({ style: ms > 100 ? "HEAVY" : "LIGHT" }).catch(() => { }); else navigator.vibrate?.(ms) }
async function scheduleNotifs(ask) {
  const LN = Plugin("LocalNotifications"); if (!LN) return;
  try {
    const pending = await LN.getPending(); if (pending.notifications.length) await LN.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    if (!S.settings.notif) return;
    if (ask) { const p = await LN.requestPermissions(); if (p.display !== "granted") { toast(t("prayer.notif_denied")); return } }
    const list = []; let id = 1;
    for (let d = 0; d < 7; d++) {
      const day = new Date(); day.setDate(day.getDate() + d); const tt = prayerTimes(day);
      for (const k of ["fajr", "dhuhr", "asr", "maghrib", "isha"]) if (tt[k] > new Date()) list.push({ id: id++, title: t("prayer.notif_title", { p: t("pn." + k), t: fmt(tt[k]) }), body: t("prayer.notif_body", { c: coords()[0] }), schedule: { at: tt[k], allowWhileIdle: true } });
    }
    await LN.schedule({ notifications: list });
  } catch { }
}
function renderQibla() {
  if (!window.adhan) return;
  const [name, lat, lng] = coords(), q = adhan.Qibla(new adhan.Coordinates(lat, lng));
  $("#qDeg").textContent = num(Math.round(q)) + "°"; $("#qHint").textContent = t("qibla.hint", { c: name });
  $("#needle").style.transform = `rotate(${q}deg)`;
}
async function startCompass() {
  try { if (typeof DeviceOrientationEvent?.requestPermission === "function" && await DeviceOrientationEvent.requestPermission() !== "granted") return toast(t("qibla.denied")) } catch { }
  let got = false;
  const on = e => {
    const h = e.webkitCompassHeading ?? (e.absolute || e.type === "deviceorientationabsolute" ? 360 - e.alpha : null);
    if (h == null || isNaN(h)) return; got = true;
    $("#dial").style.transform = `rotate(${-h}deg)`; $("#compassBtn").textContent = t("qibla.active");
  };
  addEventListener("deviceorientationabsolute", on); addEventListener("deviceorientation", on);
  setTimeout(() => { if (!got) toast(t("qibla.none")) }, 2500);
}
function renderProgress() {
  const read = readCount(), mem = Object.keys(S.memo).length;
  let streak = 0; for (let d = new Date(); ; d.setDate(d.getDate() - 1)) { const k = dkey(d); if (S.days[k]) streak++; else if (streak || k !== today()) break; if (streak > 365) break }
  $("#stats").innerHTML = [[S.days[today()] || 0, "progress.today"], [streak, "progress.streak"], [mem, "progress.memo"], [S.bookmarks.length, "progress.fav"]].map(([n, l]) => `<div class="stat"><b>${num(n)}</b><span>${t(l)}</span></div>`).join("");
  const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push([d, S.days[dkey(d)] || 0]) }
  const mx = Math.max(+S.settings.goal, ...days.map(d => d[1]));
  $("#week").innerHTML = days.map(([d, n]) => `<div><span>${num(n)}</span><i style="height:${Math.max(3, n / mx * 80)}%"></i>${d.toLocaleDateString(locale(), { weekday: "narrow" })}</div>`).join("");
  $("#khatmBar").style.width = (read / 6236 * 100) + "%"; $("#khatmTxt").textContent = t("progress.khatm_txt", { n: num(read), p: num((read / 62.36).toFixed(1)) });
}
