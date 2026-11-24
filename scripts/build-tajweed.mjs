// Construit www/data/tajweed.json : des plages de couleurs posées sur le texte VÉRIFIÉ (quran.json).
// Les annotations viennent de Quran.com (uthmani_tajweed). Le texte affiché n'est jamais celui de l'annotation :
// on aligne lettre par lettre et on ne garde que les versets dont toutes les lettres de base correspondent.
import { readFileSync, writeFileSync } from "node:fs";
const [, , tjPath] = process.argv;
const tj = JSON.parse(readFileSync(tjPath, "utf8")).verses;
const Q = JSON.parse(readFileSync(new URL("../www/data/quran.json", import.meta.url), "utf8"));
const RULES = ["ham_wasl", "slnt", "laam_shamsiyah", "madda_normal", "madda_permissible", "madda_obligatory", "madda_necessary", "qalaqah", "ikhafa", "ikhafa_shafawi", "idgham_ghunnah", "idgham_wo_ghunnah", "idgham_shafawi", "idgham_mutajanisayn", "idgham_mutaqaribayn", "iqlab", "ghunnah"];
const isBase = c => { const p = c.codePointAt(0); return (p >= 0x621 && p <= 0x64a && p !== 0x640) || [0x671, 0x66e, 0x6cc, 0x6d2, 0x6c1, 0x6e5, 0x6e6].includes(p) };
const N = { "\u0649": "Y", "\u066e": "Y", "\u06e6": "Y", "\u06cc": "Y", "\u0626": "Y", "\u06e5": "W", "\u0624": "W", "\u0648": "W", "\u0623": "A", "\u0625": "A", "\u0622": "A", "\u0627": "A", "\u0671": "A" };
const MADD_MARKS = new Set(["\u0670", "\u0672", "\u0653", "\u0640", "\u06e4"]);
// découpe en grappes : une lettre de base + ses signes ; renvoie [{b, start, end, rule}]
function clusters(chars) {
  const out = []; let pos = 0;
  for (const { c, r } of chars) {
    const len = c.length;
    if (isBase(c) || !out.length) out.push({ b: isBase(c) ? (N[c] || c) : "", start: pos, end: pos + len, rule: isBase(c) ? r : null, markRule: !isBase(c) && r && MADD_MARKS.has(c) ? r : null, madd: !isBase(c) && MADD_MARKS.has(c) ? pos : null, space: c === " " });
    else if (c === " ") out.push({ b: " ", start: pos, end: pos + len, rule: null, space: true });
    else { const k = out[out.length - 1]; k.end = pos + len; if (MADD_MARKS.has(c) && k.madd == null) k.madd = pos; if (r && MADD_MARKS.has(c) && !k.markRule) k.markRule = r }
    pos += len;
  }
  return out.filter(k => !k.space).map(k => ({ b: k.b, start: k.start, end: k.end, rule: k.rule || k.markRule, baseRule: !!k.rule, madd: k.madd }));
}
function parseTajweed(html) {
  html = html.replace(/<span class=end>[^<]*<\/span>/g, "");
  const out = []; let rule = null; const re = /<tajweed class=(\w+)>|<\/tajweed>|([\s\S])/g; let m;
  while ((m = re.exec(html))) { if (m[1]) rule = m[1]; else if (m[0] === "</tajweed>") rule = null; else out.push({ c: m[2], r: rule }) }
  return out;
}
const outMap = {}; let ok = 0;
for (const v of tj) {
  const [s, a] = v.verse_key.split(":").map(Number), ours = Q.a[s - 1][a - 1];
  const theirs = clusters(parseTajweed(v.text_uthmani_tajweed)).filter(k => k.b);
  const mine = clusters([...ours].map(c => ({ c, r: null }))).filter(k => k.b);
  // alignement strict : chaque lettre de base doit correspondre, sinon le verset reste sans couleur
  let i = 0, j = 0, fail = false; const spans = [];
  while (i < mine.length && j < theirs.length) {
    if (mine[i].b === theirs[j].b) { if (theirs[j].rule) spans.push([!theirs[j].baseRule && mine[i].madd != null ? mine[i].madd : mine[i].start, mine[i].end, RULES.indexOf(theirs[j].rule)]); i++; j++ }
    else { fail = true; break }
  }
  if (fail || i !== mine.length || j !== theirs.length || spans.some(x => x[2] < 0)) continue;
  // fusion des plages contiguës de même règle
  const merged = [];
  for (const sp of spans) { const l = merged[merged.length - 1]; if (l && l[1] === sp[0] && l[2] === sp[2]) l[1] = sp[1]; else merged.push([...sp]) }
  // contrôle : les plages découpent bien le texte vérifié, sans rien ajouter
  if (merged.some(([x, y]) => x < 0 || y > ours.length || x >= y)) continue;
  outMap[v.verse_key] = merged.flat(); ok++;
}
writeFileSync(new URL("../www/data/tajweed.json", import.meta.url), JSON.stringify({ source: "Annotations tajweed : Quran.com API v4 (uthmani_tajweed), alignées sur le texte vérifié", rules: RULES, verses: outMap }));
console.log(`tajweed : ${ok}/${tj.length} versets colorés, ${6236 - ok} sans couleur (alignement non certain)`);
