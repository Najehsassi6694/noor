// Construit www/data/pages.json : la mise en page du Mushaf de Médine (604 pages × 15 lignes),
// à partir des positions des mots fournies par Quran.com. Seule la POSITION est reprise :
// le texte affiché reste celui de quran.json (vérifié). Chaque verset est contrôlé mot à mot.
// Usage : node scripts/build-pages.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const CACHE = join(ROOT, "build", "pages-cache"); mkdirSync(CACHE, { recursive: true });
const Q = JSON.parse(readFileSync(join(ROOT, "www/data/quran.json"), "utf8"));
const isWordToken = t => /[ء-يٱ-ۓۥۦ]/.test(t);

async function chapter(n) {
  const f = join(CACHE, `${n}.json`);
  if (existsSync(f)) return JSON.parse(readFileSync(f, "utf8"));
  const out = [];
  for (let page = 1; ; page++) {
    const url = `https://api.quran.com/api/v4/verses/by_chapter/${n}?words=true&word_fields=page_number,line_number&fields=page_number,juz_number,hizb_number,rub_el_hizb_number&per_page=50&page=${page}`;
    let j;
    for (let tries = 0; ; tries++) {
      const r = await fetch(url).catch(() => null);
      if (r?.ok) { j = await r.json(); break }
      if (tries >= 8) throw new Error(url + " " + r?.status);
      await new Promise(res => setTimeout(res, 2000 * (tries + 1)));   // le serveur limite le débit : on attend
    }
    await new Promise(res => setTimeout(res, 400));
    out.push(...j.verses);
    if (!j.pagination?.next_page) break;
  }
  writeFileSync(f, JSON.stringify(out)); return out;
}

const pages = Array.from({ length: 605 }, () => ({ lines: {}, juz: 0, hizb: 0, starts: [] }));
const verseMeta = []; let bad = 0;
for (let s = 1; s <= 114; s++) {
  const vs = await chapter(s);
  if (vs.length !== Q.s[s - 1].c) throw new Error(`sourate ${s}: ${vs.length} versets`);
  for (const v of vs) {
    const a = v.verse_number, ours = Q.a[s - 1][a - 1].trim().split(/\s+/);
    let api = v.words.filter(w => w.char_type_name === "word");
    // nos « mots » : chaque jeton contenant une lettre ; un signe de pause isolé rejoint le mot précédent
    let idx = []; ours.forEach((t, i) => { if (isWordToken(t)) idx.push(i) });
    if (idx.length !== api.length) {
      // le Mushaf réunit parfois deux de nos jetons en un seul mot : on aligne sur le texte de chaque mot
      const r = await fetch(`https://api.quran.com/api/v4/verses/by_key/${s}:${a}?words=true&word_fields=text_uthmani,page_number,line_number`).then(x => x.json());
      api = r.verse.words.filter(w => w.char_type_name === "word");
      const strip = x => x.replace(/[^ء-يٱ]/g, "");   // lettres seules, pour comparer les positions
      idx = []; let i = 0;
      for (const w of api) {
        while (i < ours.length && !isWordToken(ours[i])) i++;
        idx.push(i); let acc = ours[i++];
        while (i < ours.length && strip(acc) !== strip(w.text_uthmani) && strip(w.text_uthmani).startsWith(strip(acc + ours[i]))) acc += ours[i++];
        if (strip(acc) !== strip(w.text_uthmani)) { idx = null; break }
      }
      if (!idx) { bad++; console.warn(`écart ${s}:${a}`); continue }
      console.log(`\n${s}:${a} aligné sur le texte des mots`);
    }
    const p0 = api[0].page_number;
    if (a === 1) pages[p0].starts.push(s);
    pages[p0].juz ||= v.juz_number; pages[p0].hizb ||= v.hizb_number;
    verseMeta.push([s, a, v.page_number, v.juz_number, v.hizb_number, v.rub_el_hizb_number]);
    // regroupe les jetons par (page, ligne) : [s, a, premier jeton, dernier jeton]
    let cur = null;
    api.forEach((w, k) => {
      // un signe placé avant le premier mot (۞ début de quart de hizb) appartient au premier mot
      const from = k === 0 ? 0 : idx[k], to = k + 1 < idx.length ? idx[k + 1] - 1 : ours.length - 1;
      const key = `${w.page_number}:${w.line_number}`;
      if (cur && cur.key === key) cur.seg[3] = to;
      else { cur = { key, seg: [s, a, from, to] }; (pages[w.page_number].lines[w.line_number] ||= []).push(cur.seg) }
    });
  }
  process.stdout.write(`\r${s}/114`);
}
if (bad) { console.error(`\n${bad} versets ne s'alignent pas : arrêt`); process.exit(1) }
const outPages = pages.slice(1).map((p, i) => ({ n: i + 1, juz: p.juz, hizb: p.hizb, starts: p.starts, lines: Object.fromEntries(Object.entries(p.lines).map(([l, segs]) => [l, segs])) }));
// contrôle : chaque verset est couvert entièrement, dans l'ordre
const seen = new Map();
for (const p of outPages) for (const segs of Object.values(p.lines)) for (const [s, a, f, t] of segs) { const k = s + ":" + a; const prev = seen.get(k) ?? -1; if (f !== prev + 1) throw new Error("trou " + k); seen.set(k, t) }
for (let s = 1; s <= 114; s++) for (let a = 1; a <= Q.s[s - 1].c; a++) if (seen.get(s + ":" + a) !== Q.a[s - 1][a - 1].trim().split(/\s+/).length - 1) throw new Error("incomplet " + s + ":" + a);
writeFileSync(join(ROOT, "www/data/pages.json"), JSON.stringify({ source: "Mise en page du Mushaf de Médine (604 pages, 15 lignes) d'après les positions des mots de Quran.com ; texte de quran.json.", pages: outPages, verses: verseMeta }));
console.log(`\nOK : 604 pages, ${verseMeta.length} versets placés mot à mot.`);
