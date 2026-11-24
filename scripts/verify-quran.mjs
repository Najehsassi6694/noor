// Vérifie que le texte coranique embarqué correspond exactement au manifeste.
// Usage : node scripts/verify-quran.mjs        (contrôle)
//         node scripts/verify-quran.mjs --write (crée le manifeste, une seule fois, à l'import)
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = s => createHash("sha256").update(s, "utf8").digest("hex");
const Q = JSON.parse(readFileSync(new URL("../www/data/quran.json", import.meta.url), "utf8"));
const surahs = Q.a.map(v => sha(v.join("\n")));
const corpus = sha(Q.a.map(v => v.join("\n")).join("\n"));
const count = Q.a.flat().length;
const mPath = new URL("../www/data/manifest.json", import.meta.url);
if (process.argv.includes("--write")) {
  writeFileSync(mPath, JSON.stringify({
    edition: { script: "Uthmani", riwaya: "Hafs 'an 'Asim", numbering: "Kufi (6236 versets)", provider: "Quran.com API v4 — /quran/verses/uthmani", retrieved: "2026-11-24", license: "Texte reproduit sans modification, avec attribution à la source (cf. tanzil.net/docs/text_license)." },
    translation: { language: "fr", author: "Muhammad Hamidullah", provider: "Quran.com API v4 — translation 31", note: "Notes de bas de page retirées ; texte de la traduction inchangé." },
    reviewer: null,
    counts: { surahs: 114, verses: count },
    sha256: { corpus, surahs }
  }, null, 2));
  console.log("manifeste écrit", corpus);
} else {
  const m = JSON.parse(readFileSync(mPath, "utf8"));
  const bad = surahs.map((h, i) => h === m.sha256.surahs[i] ? null : i + 1).filter(Boolean);
  if (count !== 6236 || corpus !== m.sha256.corpus || bad.length) { console.error("ÉCHEC intégrité", { count, bad }); process.exit(1) }
  console.log(`OK : 114 sourates, ${count} versets, empreintes identiques au manifeste.`);
}
