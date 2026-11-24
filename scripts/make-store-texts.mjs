// Écrit les textes des fiches Google Play et App Store (format fastlane) et vérifie les limites de longueur.
// Usage : node scripts/make-store-texts.mjs https://VOTRE-NOM.github.io/noor
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const SITE = (process.argv[2] || "https://VOTRE-NOM.github.io/noor").replace(/\/$/, "");

const T = {
fr: {
  play: "fr-FR", ios: "fr-FR",
  title: "NOOR – Coran & Récitation",
  subtitle: "Lire, réciter, comprendre",
  short: "Coran authentique, récitation corrigée, tafsir, tajweed et prières. Sans pub.",
  keywords: "coran,quran,islam,récitation,tajweed,tafsir,prière,qibla,mushaf,hifz,mémorisation,dua,ramadan",
  promo: "Récitez à voix haute : NOOR écoute et vous signale les mots oubliés. Gratuit, sans publicité, fidèle au texte du Mushaf.",
  release: "Première version de NOOR.",
  desc: `NOOR (نور, « lumière ») est un compagnon du Coran simple, beau et gratuit, sans publicité. Il aide les musulmans à lire, réciter et mémoriser, et les personnes curieuses à découvrir le Coran.

UN TEXTE AUTHENTIQUE, VÉRIFIÉ
• Le Mushaf Uthmani complet (riwaya Ḥafṣ ʿan ʿĀṣim) : 114 sourates, 6 236 versets, disponibles hors ligne.
• Chaque sourate est vérifiée par empreinte numérique à chaque ouverture : un texte modifié n'est jamais affiché.
• Traductions française (Muhammad Hamidullah) et anglaise (Saheeh International).

RÉCITEZ, NOOR VOUS CORRIGE
• Récitez un verset à voix haute : les mots justes s'allument, les mots oubliés, changés ou ajoutés sont signalés.
• Masquez le texte pour tester votre mémoire.

ÉCOUTER ET MÉMORISER
• 10 récitateurs célèbres, lecture continue, répétition de chaque verset.
• Mode mémorisation : les mots se dévoilent un à un.
• Favoris, versets mémorisés, objectif quotidien, suivi de votre khatm.

COMPRENDRE
• Tafsir : 10 commentaires reconnus (Ibn Kathīr, aṭ-Ṭabarī, as-Saʿdī, al-Qurṭubī…), cités mot pour mot avec leur source.
• Centre de tajweed : leçons claires et couleurs des règles posées sur le Mushaf.
• Recherche par mot (français, anglais, arabe) ou par référence.

DÉCOUVRIR LE CORAN
• Une porte d'entrée pour les non-musulmans et les débutants : présentation simple, sourates par où commencer, thèmes (Jésus et Marie, la paix, la création…) et petit lexique.

LITTLE NOOR, POUR LES ENFANTS
• Les 28 lettres arabes et leurs formes, un jeu, les petites sourates récitées lentement, des étoiles en récompense.

AU QUOTIDIEN
• Horaires de prière (12 méthodes de calcul), rappels, qibla avec boussole, tasbih, invocations du Coran.
• Trois langues : français, anglais et arabe. Mode clair et mode sombre.

VOTRE VIE PRIVÉE
• Pas de compte, pas de publicité, pas de pistage. Vos progrès restent sur votre téléphone.`
},
en: {
  play: "en-US", ios: "en-US",
  title: "NOOR – Quran & Recitation",
  subtitle: "Read, recite, understand",
  short: "Authentic Quran, recitation feedback, tafsir, tajweed and prayer times. No ads.",
  keywords: "quran,koran,islam,recitation,tajweed,tafsir,prayer,qibla,mushaf,hifz,memorize,dua,ramadan",
  promo: "Recite out loud: NOOR listens and points out missed words. Free, ad-free and faithful to the Mushaf text.",
  release: "First release of NOOR.",
  desc: `NOOR (نور, "light") is a simple, beautiful and free Quran companion with no ads. It helps Muslims read, recite and memorise, and helps curious people discover the Quran.

AUTHENTIC, VERIFIED TEXT
• The complete Uthmani Mushaf (Hafs 'an 'Asim): 114 surahs, 6,236 ayat, available offline.
• Every surah is checked with a digital fingerprint each time the app opens: altered text is never shown.
• English (Saheeh International) and French (Muhammad Hamidullah) translations.

RECITE, NOOR CORRECTS YOU
• Recite an ayah out loud: correct words light up, and missed, changed or added words are flagged.
• Hide the text to test your memory.

LISTEN AND MEMORISE
• 10 renowned reciters, continuous playback, repeat each ayah.
• Memorisation mode: words reveal one by one.
• Saved ayat, memorised ayat, daily goal, khatm progress.

UNDERSTAND
• Tafsir: 10 recognised commentaries (Ibn Kathir, al-Tabari, al-Sa'di, al-Qurtubi…), quoted word for word with their source.
• Tajweed centre: clear lessons and rule colours on the Mushaf.
• Search by word (English, French, Arabic) or by reference.

DISCOVER THE QURAN
• A gentle start for non-Muslims and beginners: a simple introduction, surahs to begin with, topics (Jesus and Mary, peace, creation…) and a short glossary.

LITTLE NOOR, FOR KIDS
• The 28 Arabic letters and their shapes, a game, short surahs recited slowly, and stars as rewards.

EVERY DAY
• Prayer times (12 calculation methods), reminders, qibla compass, tasbih, duas from the Quran.
• Three languages: English, French and Arabic. Light and dark mode.

YOUR PRIVACY
• No account, no ads, no tracking. Your progress stays on your phone.`
},
ar: {
  play: "ar", ios: "ar-SA",
  title: "نور – القرآن والتسميع",
  subtitle: "اقرأ وسمّع وتدبّر",
  short: "القرآن الموثَّق، تسميع مع تصحيح، تفسير وتجويد ومواقيت الصلاة. بلا إعلانات.",
  keywords: "قرآن,مصحف,تلاوة,تسميع,تجويد,تفسير,حفظ,صلاة,قبلة,أذكار,دعاء,رمضان,إسلام",
  promo: "اقرأ بصوتك، ويستمع «نور» وينبّهك إلى الكلمات المتروكة. مجاني، بلا إعلانات، وأمين لنص المصحف.",
  release: "الإصدار الأول من «نور».",
  desc: `«نور» رفيق بسيط وجميل ومجاني مع القرآن الكريم، بلا إعلانات. يعين المسلم على القراءة والتسميع والحفظ، ويعين المهتمّ على التعرّف على القرآن.

نص موثَّق ومُتحقَّق منه
• المصحف العثماني كاملًا برواية حفص عن عاصم: ١١٤ سورة و٦٢٣٦ آية، متاح دون اتصال.
• يُتحقَّق من كل سورة ببصمة رقمية عند كل فتح، ولا يُعرض أي نص مُعدَّل.
• ترجمتان: الفرنسية (محمد حميد الله) والإنجليزية (صحيح إنترناشونال).

اقرأ و«نور» يصحّح لك
• اقرأ الآية بصوتك: تضيء الكلمات الصحيحة، ويُنبَّه إلى الكلمة المتروكة أو المبدَّلة أو الزائدة.
• أخفِ النص لتختبر حفظك.

الاستماع والحفظ
• عشرة من كبار القرّاء، تشغيل متواصل وتكرار كل آية.
• وضع الحفظ: تظهر الكلمات واحدة بعد أخرى.
• المحفوظات والآيات المحفوظة والهدف اليومي ومتابعة الختمة.

الفهم
• التفسير: عشرة كتب معتمدة (ابن كثير، الطبري، السعدي، القرطبي…) بنصها الحرفي مع ذكر المصدر.
• مركز التجويد: دروس واضحة وألوان الأحكام على المصحف.
• البحث بالكلمة أو بالمرجع.

تعرّف على القرآن
• مدخل ميسَّر لغير المسلمين وللمبتدئين: تعريف بسيط، سور مقترحة للبداية، موضوعات (عيسى ومريم، السلام، الخلق…) ومفردات مختصرة.

نور الصغير للأطفال
• الحروف العربية الثمانية والعشرون وأشكالها، ولعبة، وقصار السور بتلاوة متأنية، ونجوم للتشجيع.

كل يوم
• مواقيت الصلاة (١٢ طريقة حساب) والتنبيهات، والقبلة بالبوصلة، والتسبيح، وأدعية القرآن.
• ثلاث لغات: العربية والفرنسية والإنجليزية. وضع فاتح وآخر داكن.

خصوصيتك
• لا حساب ولا إعلانات ولا تتبّع. يبقى تقدّمك على هاتفك.`
}};

const LIMITS = { title: 30, subtitle: 30, short: 80, keywords: 100, promo: 170, desc: 4000 };
let ok = true;
for (const [lang, x] of Object.entries(T)) {
  for (const [k, max] of Object.entries(LIMITS)) { const n = [...x[k]].length; if (n > max) { ok = false; console.error(`TROP LONG ${lang}.${k}: ${n}/${max}`) } }
  const pd = join(ROOT, "fastlane/metadata/android", x.play); mkdirSync(join(pd, "changelogs"), { recursive: true });
  writeFileSync(join(pd, "title.txt"), x.title); writeFileSync(join(pd, "short_description.txt"), x.short); writeFileSync(join(pd, "full_description.txt"), x.desc); writeFileSync(join(pd, "changelogs", "1.txt"), x.release);
  const id = join(ROOT, "fastlane/metadata", x.ios); mkdirSync(id, { recursive: true });
  const files = { "name.txt": x.title, "subtitle.txt": x.subtitle, "description.txt": x.desc, "keywords.txt": x.keywords, "promotional_text.txt": x.promo, "release_notes.txt": x.release, "privacy_url.txt": `${SITE}/privacy.html`, "support_url.txt": `${SITE}/support.html`, "marketing_url.txt": `${SITE}/` };
  for (const [f, v] of Object.entries(files)) writeFileSync(join(id, f), v);
  console.log(lang, "titre", [...x.title].length, "court", [...x.short].length, "mots-clés", [...x.keywords].length, "description", [...x.desc].length);
}
const iosRoot = join(ROOT, "fastlane/metadata");
writeFileSync(join(iosRoot, "copyright.txt"), `${new Date().getFullYear()} NOOR`);
writeFileSync(join(iosRoot, "primary_category.txt"), "REFERENCE"); writeFileSync(join(iosRoot, "secondary_category.txt"), "EDUCATION");
if (!ok) process.exit(1);
