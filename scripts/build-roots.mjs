// Construit www/data/roots.json à partir du Quranic Arabic Corpus (morphologie, Kais Dukes, licence GPL).
// Pour chaque racine : nombre d'occurrences, lemmes, et positions (sourate, verset, numéro du jeton dans quran.json).
// Usage : node scripts/build-roots.mjs chemin/vers/quran-morphology.txt
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const Q = JSON.parse(readFileSync(join(ROOT, "www/data/quran.json"), "utf8"));
const lines = readFileSync(process.argv[2], "utf8").split(/\r?\n/).filter(Boolean);
const isWordToken = t => /[ء-يٱ-ۓۥۦ]/.test(t);

// numéro de mot du corpus → index du jeton dans notre verset (les signes isolés ne sont pas des mots)
const tokenIndex = new Map(); let mismatch = 0;
const corpusWords = new Map();
for (const l of lines) { const [loc] = l.split("\t"); const [s, a, w] = loc.split(":").map(Number); const k = s + ":" + a; corpusWords.set(k, Math.max(corpusWords.get(k) || 0, w)) }
for (let s = 1; s <= 114; s++) for (let a = 1; a <= Q.s[s - 1].c; a++) {
  const toks = Q.a[s - 1][a - 1].trim().split(/\s+/), idx = []; toks.forEach((t, i) => { if (isWordToken(t)) idx.push(i) });
  if (idx.length === corpusWords.get(s + ":" + a)) tokenIndex.set(s + ":" + a, idx); else mismatch++;
}
const roots = new Map();
const seenWord = new Set();
for (const l of lines) {
  const [loc, form, , feat] = l.split("\t");
  const m = feat.match(/ROOT:([^|]+)/); if (!m) continue;
  const [s, a, w] = loc.split(":").map(Number), key = `${s}:${a}:${w}`;
  if (seenWord.has(key)) continue; seenWord.add(key);
  const lem = (feat.match(/LEM:([^|]+)/) || [])[1] || "";
  const r = roots.get(m[1]) || { root: m[1], count: 0, lemmas: {}, occ: [] };
  r.count++; r.lemmas[lem] = (r.lemmas[lem] || 0) + 1;
  const idx = tokenIndex.get(s + ":" + a);
  if (r.occ.length < 40 && idx) r.occ.push([s, a, idx[w - 1]]);
  roots.set(m[1], r);
}
const list = [...roots.values()].sort((x, y) => y.count - x.count);
const top = list.slice(0, 300).map(r => ({ r: r.root, c: r.count, l: Object.entries(r.lemmas).sort((a, b) => b[1] - a[1]).slice(0, 6), o: r.occ }));
writeFileSync(join(ROOT, "www/data/roots.json"), JSON.stringify({ source: "Racines et lemmes : Quranic Arabic Corpus (corpus.quran.com, Kais Dukes), licence GNU GPL. Positions reliées au texte de quran.json.", total: list.length, roots: top }));
console.log(`racines : ${list.length}, gardées : ${top.length}, versets non reliés : ${mismatch}`);
console.log(top.slice(0, 100).map(r => `${r.r}:${r.c}`).join(" "));
