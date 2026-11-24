// Génère les visuels des stores avec Chrome sans interface (headless), depuis le serveur local (npm run serve).
// Usage : node scripts/make-store-images.mjs [chemin de chrome] [url de base]
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, copyFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.argv[2] || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[3] || "http://localhost:8080";
const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const PROFILE = join(tmpdir(), "noor-shots-profile");

const LANGS = { fr: { play: "fr-FR", ios: "fr-FR" }, en: { play: "en-US", ios: "en-US" }, ar: { play: "ar", ios: "ar-SA" } };
const SHOTS = [
  { id: 1, view: "home", act: "scrolltop", fr: ["Votre compagnon du Coran", "Lire, écouter, comprendre"], en: ["Your Quran companion", "Read, listen, understand"], ar: ["رفيقك مع القرآن", "اقرأ واستمع وتدبّر"] },
  { id: 2, view: "reader", act: "reader", s1: 36, taj: 1, fr: ["Le Mushaf authentique", "Avec les couleurs du tajweed"], en: ["The authentic Mushaf", "With tajweed colours"], ar: ["المصحف الموثَّق", "بألوان التجويد"] },
  { id: 3, view: "home", act: "recite", fr: ["Récitez, NOOR vous corrige", "Mot oublié, changé ou ajouté"], en: ["Recite, NOOR corrects you", "Missed, changed or added words"], ar: ["اقرأ، ونور يصحّح لك", "الكلمة المتروكة أو المبدَّلة أو الزائدة"] },
  { id: 4, view: "home", act: "discover", fr: ["Découvrez le Coran", "Simplement, avec respect"], en: ["Discover the Quran", "Simply and respectfully"], ar: ["تعرّف على القرآن", "ببساطة واحترام"] },
  { id: 5, view: "home", act: "tajweed", fr: ["Apprenez le tajweed", "Leçons et exemples du Mushaf"], en: ["Learn tajweed", "Lessons and Mushaf examples"], ar: ["تعلّم التجويد", "دروس وأمثلة من المصحف"] },
  { id: 6, view: "home", act: "kids", fr: ["Little Noor", "Les lettres et les petites sourates"], en: ["Little Noor", "Letters and short surahs for kids"], ar: ["نور الصغير", "الحروف وقصار السور للأطفال"] },
  { id: 7, view: "home", act: "prayer", fr: ["Prières et qibla", "Où que vous soyez"], en: ["Prayer times and qibla", "Wherever you are"], ar: ["مواقيت الصلاة والقبلة", "أينما كنت"] },
  { id: 8, view: "home", act: "scrolltop", theme: "dark", bg: "dark", fr: ["Mode nuit élégant", "Clair ou sombre, en un geste"], en: ["Elegant night mode", "Light or dark in one tap"], ar: ["وضع ليلي أنيق", "فاتح أو داكن بلمسة"] },
];
// iPhone 6,9 po (1320×2868) et Google Play (1080×1920)
const SIZES = { ios: { w: 550, h: 1195, dpr: 2.4 }, play: { w: 540, h: 960, dpr: 2 } };

function shot(url, out, w, h, dpr, budget = 16000) {
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--mute-audio", `--user-data-dir=${PROFILE}`, `--window-size=${w},${h}`, `--force-device-scale-factor=${dpr}`, `--virtual-time-budget=${budget}`, `--screenshot=${out}`, url], { stdio: "ignore" });
  const b = readFileSync(out); return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
}
const enc = encodeURIComponent;
// pages de composition copiées dans www/ le temps de la génération, puis retirées
const TMP = ["_shots.html", "icon-square.svg"];
for (const f of TMP) copyFileSync(join(ROOT, "store", f), join(ROOT, "www", f));
process.on("exit", () => { for (const f of TMP) try { unlinkSync(join(ROOT, "www", f)) } catch { } });
for (const [lang, dirs] of Object.entries(LANGS)) {
  const playDir = join(ROOT, "fastlane/metadata/android", dirs.play, "images/phoneScreenshots");
  const iosDir = join(ROOT, "fastlane/screenshots", dirs.ios);
  mkdirSync(playDir, { recursive: true }); mkdirSync(iosDir, { recursive: true });
  for (const s of SHOTS) {
    const [t, sub] = s[lang];
    const q = `mode=shot&lang=${lang}&view=${s.view}&act=${s.act}&theme=${s.theme || "light"}&bg=${s.bg || ""}&taj=${s.taj || 0}&s1=${s.s1 || ""}&t=${enc(t)}&s=${enc(sub)}`;
    for (const [kind, z] of Object.entries(SIZES)) {
      const out = kind === "ios" ? join(iosDir, `${s.id}_iphone69_${s.id}.png`) : join(playDir, `${s.id}.png`);
      const size = shot(`${BASE}/_shots.html?${q}&k=${kind}`, out, z.w, z.h, z.dpr);
      console.log(lang, kind, s.id, size);
    }
  }
  // bannière Google Play 1024×500
  const featSub = { fr: "Le Coran authentique · récitation · tajweed · prières", en: "The authentic Quran · recitation · tajweed · prayer", ar: "القرآن الموثَّق · تلاوة · تجويد · صلاة" }[lang];
  const imgDir = join(ROOT, "fastlane/metadata/android", dirs.play, "images");
  console.log(lang, "feature", shot(`${BASE}/_shots.html?mode=feature&sub=${enc(featSub)}`, join(imgDir, "featureGraphic.png"), 1024, 500, 1, 4000));
  console.log(lang, "icon", shot(`${BASE}/icon-square.svg`, join(imgDir, "icon.png"), 512, 512, 1, 2000));
}
// icône App Store 1024×1024 (carrée, sans transparence)
mkdirSync(join(ROOT, "store"), { recursive: true });
console.log("appstore icon", shot(`${BASE}/icon-square.svg`, join(ROOT, "store/appstore-icon-1024.png"), 512, 512, 2, 2000));
