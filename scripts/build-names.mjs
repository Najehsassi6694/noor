// Construit www/data/names.json : les 99 noms d'Allah (liste du hadith rapporté par at-Tirmidhī).
// Pour chaque nom cité avec un verset, on VÉRIFIE que le verset (texte de quran.json) contient bien la racine indiquée.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const Q = JSON.parse(readFileSync(join(ROOT, "www/data/quran.json"), "utf8"));
const norm = t => t.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "").replace(/[ٱأإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي");
// [arabe, translittération, français, anglais, arabe (sens), verset, lettres à retrouver dans le verset]
const N = [
["الرَّحْمَٰنُ","Ar-Raḥmān","Le Tout Miséricordieux","The Most Gracious","الذي وسعت رحمته كل شيء","1:3","رحمن"],
["الرَّحِيمُ","Ar-Raḥīm","Le Très Miséricordieux","The Most Merciful","الرحيم بعباده المؤمنين","1:3","رحيم"],
["الْمَلِكُ","Al-Malik","Le Roi","The King","المالك لكل شيء المتصرّف فيه","59:23","الملك"],
["الْقُدُّوسُ","Al-Quddūs","Le Pur, le Saint","The Most Holy","المنزّه عن كل نقص","59:23","القدوس"],
["السَّلَامُ","As-Salām","La Paix","The Source of Peace","السالم من كل عيب، ومنه السلام","59:23","السلم"],
["الْمُؤْمِنُ","Al-Muʾmin","Celui qui accorde la sécurité","The Granter of Security","المصدّق رسله، الذي يؤمِّن عباده","59:23","المومن"],
["الْمُهَيْمِنُ","Al-Muhaymin","Le Gardien vigilant","The Guardian","الرقيب الحافظ لكل شيء","59:23","المهيمن"],
["الْعَزِيزُ","Al-ʿAzīz","Le Tout-Puissant","The Almighty","الغالب الذي لا يُغلب","59:23","العزيز"],
["الْجَبَّارُ","Al-Jabbār","Le Contraignant, Celui qui répare","The Compeller","العالي القاهر، جابر الكسير","59:23","الجبار"],
["الْمُتَكَبِّرُ","Al-Mutakabbir","Le Suprêmement Grand","The Supreme in Greatness","المتعالي عن صفات الخلق","59:23","المتكبر"],
["الْخَالِقُ","Al-Khāliq","Le Créateur","The Creator","موجد الأشياء من العدم","59:24","الخلق"],
["الْبَارِئُ","Al-Bāriʾ","Celui qui produit","The Originator","المميِّز للمخلوقات بعضها من بعض","59:24","البارئ"],
["الْمُصَوِّرُ","Al-Muṣawwir","Celui qui donne forme","The Fashioner","معطي كل مخلوق صورته","59:24","المصور"],
["الْغَفَّارُ","Al-Ghaffār","Celui qui pardonne sans cesse","The Ever-Forgiving","كثير المغفرة","38:66","الغفر"],
["الْقَهَّارُ","Al-Qahhār","Le Dominateur suprême","The Subduer","الغالب لكل شيء","13:16","القهار"],
["الْوَهَّابُ","Al-Wahhāb","Le Donateur généreux","The Bestower","كثير العطاء بلا عوض","3:8","الوهاب"],
["الرَّزَّاقُ","Ar-Razzāq","Celui qui pourvoit","The Provider","المتكفّل بأرزاق الخلق","51:58","الرزاق"],
["الْفَتَّاحُ","Al-Fattāḥ","Celui qui ouvre, le Juge","The Opener, the Judge","الذي يفتح أبواب الرحمة ويحكم بالحق","34:26","الفتاح"],
["الْعَلِيمُ","Al-ʿAlīm","L'Omniscient","The All-Knowing","المحيط علمه بكل شيء","2:32","العليم"],
["الْقَابِضُ","Al-Qābiḍ","Celui qui restreint","The Withholder","الذي يقبض الرزق والأرواح بحكمته","2:245","يقبض"],
["الْبَاسِطُ","Al-Bāsiṭ","Celui qui étend","The Extender","الذي يبسط الرزق لمن يشاء","2:245","يبصط"],
["الْخَافِضُ","Al-Khāfiḍ","Celui qui abaisse","The Abaser","الذي يخفض المتكبرين",null,null],
["الرَّافِعُ","Ar-Rāfiʿ","Celui qui élève","The Exalter","الذي يرفع المؤمنين بالطاعة",null,null],
["الْمُعِزُّ","Al-Muʿizz","Celui qui honore","The Bestower of Honour","الذي يعزّ من يشاء","3:26","تعز"],
["الْمُذِلُّ","Al-Mudhill","Celui qui humilie","The Humiliator","الذي يذلّ من يشاء","3:26","تذل"],
["السَّمِيعُ","As-Samīʿ","L'Audient","The All-Hearing","الذي يسمع كل شيء","2:127","السميع"],
["الْبَصِيرُ","Al-Baṣīr","Le Clairvoyant","The All-Seeing","الذي يرى كل شيء","17:1","البصير"],
["الْحَكَمُ","Al-Ḥakam","Le Juge","The Judge","الحاكم بين عباده بالعدل","6:114","حكما"],
["الْعَدْلُ","Al-ʿAdl","Le Juste","The Just","ذو العدل التام",null,null],
["اللَّطِيفُ","Al-Laṭīf","Le Subtil, le Bienveillant","The Subtle, the Kind","العالم بدقائق الأمور، الرفيق بعباده","67:14","اللطيف"],
["الْخَبِيرُ","Al-Khabīr","Le Parfaitement Informé","The All-Aware","العالم ببواطن الأمور","67:14","الخبير"],
["الْحَلِيمُ","Al-Ḥalīm","Le Longanime","The Forbearing","الذي لا يعاجل بالعقوبة","2:225","حليم"],
["الْعَظِيمُ","Al-ʿAẓīm","L'Immense","The Magnificent","ذو العظمة والجلال","2:255","العظيم"],
["الْغَفُورُ","Al-Ghafūr","Le Grand Pardonneur","The All-Forgiving","الذي يغفر الذنوب","15:49","الغفور"],
["الشَّكُورُ","Ash-Shakūr","Le Reconnaissant","The Appreciative","الذي يثيب على القليل بالكثير","35:30","شكور"],
["الْعَلِيُّ","Al-ʿAliyy","Le Très-Haut","The Most High","العالي فوق خلقه","2:255","العلي"],
["الْكَبِيرُ","Al-Kabīr","Le Très-Grand","The Most Great","الكبير في ذاته وصفاته","22:62","الكبير"],
["الْحَفِيظُ","Al-Ḥafīẓ","Le Gardien","The Preserver","الحافظ لكل شيء","11:57","حفيظ"],
["الْمُقِيتُ","Al-Muqīt","Celui qui nourrit et soutient","The Sustainer","المتكفّل بإيصال الأقوات","4:85","مقيتا"],
["الْحَسِيبُ","Al-Ḥasīb","Celui qui suffit, qui tient compte","The Reckoner","الكافي، والمحاسب لعباده","4:6","حسيبا"],
["الْجَلِيلُ","Al-Jalīl","Le Majestueux","The Majestic","ذو الجلال والعظمة",null,null],
["الْكَرِيمُ","Al-Karīm","Le Généreux","The Most Generous","كثير الخير والعطاء","82:6","الكريم"],
["الرَّقِيبُ","Ar-Raqīb","L'Observateur","The Watchful","المطّلع على كل شيء","4:1","رقيبا"],
["الْمُجِيبُ","Al-Mujīb","Celui qui exauce","The Responsive","الذي يجيب دعاء من دعاه","11:61","مجيب"],
["الْوَاسِعُ","Al-Wāsiʿ","L'Immense, le Large","The All-Encompassing","الواسع في علمه ورحمته","2:115","واسع"],
["الْحَكِيمُ","Al-Ḥakīm","Le Sage","The All-Wise","الذي يضع الأشياء في مواضعها","2:129","الحكيم"],
["الْوَدُودُ","Al-Wadūd","Le Bien-Aimant","The Loving","المحبّ لعباده الصالحين المحبوب","85:14","الودود"],
["الْمَجِيدُ","Al-Majīd","Le Glorieux","The Glorious","الواسع في كرمه ومجده","11:73","مجيد"],
["الْبَاعِثُ","Al-Bāʿith","Celui qui ressuscite","The Resurrector","الذي يبعث الخلق بعد الموت","22:7","يبعث"],
["الشَّهِيدُ","Ash-Shahīd","Le Témoin","The Witness","الحاضر المطّلع على كل شيء","22:17","شهيد"],
["الْحَقُّ","Al-Ḥaqq","La Vérité","The Truth","الثابت الذي لا شك فيه","22:6","الحق"],
["الْوَكِيلُ","Al-Wakīl","Le Garant","The Trustee","الكفيل بأمور عباده","3:173","الوكيل"],
["الْقَوِيُّ","Al-Qawiyy","Le Fort","The Strong","ذو القوة الكاملة","22:40","لقوي"],
["الْمَتِينُ","Al-Matīn","L'Inébranlable","The Firm","الشديد القوة","51:58","المتين"],
["الْوَلِيُّ","Al-Waliyy","Le Protecteur","The Protecting Friend","المتولّي أمور عباده الناصر لهم","42:9","الولي"],
["الْحَمِيدُ","Al-Ḥamīd","Le Digne de louange","The Praiseworthy","المحمود في ذاته وأفعاله","31:26","الحميد"],
["الْمُحْصِي","Al-Muḥṣī","Celui qui dénombre tout","The Accounter","الذي أحصى كل شيء عددًا","72:28","احصي"],
["الْمُبْدِئُ","Al-Mubdiʾ","Celui qui commence la création","The Originator","الذي بدأ الخلق","85:13","يبدي"],
["الْمُعِيدُ","Al-Muʿīd","Celui qui la recommence","The Restorer","الذي يعيد الخلق بعد فنائه","85:13","يعيد"],
["الْمُحْيِي","Al-Muḥyī","Celui qui donne la vie","The Giver of Life","الذي يحيي الموتى","30:50","لمحي"],
["الْمُمِيتُ","Al-Mumīt","Celui qui donne la mort","The Bringer of Death","الذي قدّر الموت على خلقه","2:258","يميت"],
["الْحَيُّ","Al-Ḥayy","Le Vivant","The Ever-Living","الحي الذي لا يموت","2:255","الحي"],
["الْقَيُّومُ","Al-Qayyūm","Celui qui subsiste par Lui-même","The Self-Subsisting","القائم بنفسه المقيم لغيره","2:255","القيوم"],
["الْوَاجِدُ","Al-Wājid","Celui qui trouve tout","The Finder","الغني الذي لا يُعوزه شيء",null,null],
["الْمَاجِدُ","Al-Mājid","Le Noble","The Noble","ذو المجد والشرف",null,null],
["الْوَاحِدُ","Al-Wāḥid","L'Unique","The One","المتفرّد بذاته وصفاته","13:16","الوحد"],
["الْأَحَدُ","Al-Aḥad","L'Un","The Unique","الذي لا نظير له","112:1","احد"],
["الصَّمَدُ","Aṣ-Ṣamad","Le Soutien universel","The Eternal Refuge","الذي يُقصد في الحوائج","112:2","الصمد"],
["الْقَادِرُ","Al-Qādir","Le Capable","The Able","الذي لا يعجزه شيء","6:65","القادر"],
["الْمُقْتَدِرُ","Al-Muqtadir","Le Tout-Puissant","The All-Powerful","التام القدرة","54:55","مقتدر"],
["الْمُقَدِّمُ","Al-Muqaddim","Celui qui fait avancer","The Expediter","الذي يقدّم من يشاء",null,null],
["الْمُؤَخِّرُ","Al-Muʾakhkhir","Celui qui retarde","The Delayer","الذي يؤخّر من يشاء",null,null],
["الْأَوَّلُ","Al-Awwal","Le Premier","The First","الذي ليس قبله شيء","57:3","الاول"],
["الْآخِرُ","Al-Ākhir","Le Dernier","The Last","الذي ليس بعده شيء","57:3","الاخر"],
["الظَّاهِرُ","Aẓ-Ẓāhir","L'Apparent","The Manifest","الذي ليس فوقه شيء","57:3","الظهر"],
["الْبَاطِنُ","Al-Bāṭin","Le Caché","The Hidden","الذي ليس دونه شيء","57:3","البطن"],
["الْوَالِي","Al-Wālī","Le Maître qui gouverne","The Governor","المتولّي تدبير الخلق","13:11","وال"],
["الْمُتَعَالِي","Al-Mutaʿālī","Le Suprêmement Élevé","The Most Exalted","المتعالي عن كل نقص","13:9","المتعال"],
["الْبَرُّ","Al-Barr","Le Bienfaisant","The Source of Goodness","العطوف على عباده المحسن إليهم","52:28","البر"],
["التَّوَّابُ","At-Tawwāb","Celui qui accueille le repentir","The Accepter of Repentance","الذي يتوب على عباده","2:37","التواب"],
["الْمُنْتَقِمُ","Al-Muntaqim","Celui qui châtie les criminels","The Avenger","الذي يعاقب المجرمين بعدله","32:22","منتقمون"],
["الْعَفُوُّ","Al-ʿAfuww","Celui qui efface les fautes","The Pardoner","الذي يمحو السيئات","4:43","عفوا"],
["الرَّءُوفُ","Ar-Raʾūf","Le Très Doux","The Most Kind","الشديد الرحمة","2:143","لرءوف"],
["مَالِكُ الْمُلْكِ","Mālik al-Mulk","Le Possesseur de la royauté","Owner of All Sovereignty","المتصرّف في ملكه كيف يشاء","3:26","ملك الملك"],
["ذُو الْجَلَالِ وَالْإِكْرَامِ","Dhū al-Jalāli wal-Ikrām","Le Détenteur de la majesté et de la générosité","Lord of Majesty and Generosity","المستحق للتعظيم والإكرام","55:27","الجلل"],
["الْمُقْسِطُ","Al-Muqsiṭ","L'Équitable","The Equitable","العادل في حكمه",null,null],
["الْجَامِعُ","Al-Jāmiʿ","Celui qui rassemble","The Gatherer","الذي يجمع الخلق ليوم القيامة","3:9","جامع"],
["الْغَنِيُّ","Al-Ghaniyy","Le Riche, Celui qui se suffit","The Self-Sufficient","الذي لا يحتاج إلى أحد","31:26","الغني"],
["الْمُغْنِي","Al-Mughnī","Celui qui enrichit","The Enricher","الذي يغني من يشاء","9:28","يغنيكم"],
["الْمَانِعُ","Al-Māniʿ","Celui qui empêche","The Preventer","الذي يمنع بحكمته",null,null],
["الضَّارُّ","Aḍ-Ḍārr","Celui qui éprouve par le mal","The Distresser","الذي يقدّر الضر بحكمته",null,null],
["النَّافِعُ","An-Nāfiʿ","Celui qui accorde le bien","The Benefactor","الذي يقدّر النفع",null,null],
["النُّورُ","An-Nūr","La Lumière","The Light","نور السماوات والأرض","24:35","نور"],
["الْهَادِي","Al-Hādī","Le Guide","The Guide","الذي يهدي من يشاء","22:54","لهاد"],
["الْبَدِيعُ","Al-Badīʿ","Le Créateur sans modèle","The Incomparable Originator","المبدع للخلق على غير مثال","2:117","بديع"],
["الْبَاقِي","Al-Bāqī","L'Éternel","The Everlasting","الدائم الذي لا يفنى","55:27","يبقي"],
["الْوَارِثُ","Al-Wārith","L'Héritier","The Inheritor","الباقي بعد فناء الخلق","15:23","الورثون"],
["الرَّشِيدُ","Ar-Rashīd","Le Guide vers le droit chemin","The Guide to the Right Path","الذي يرشد الخلق إلى مصالحهم",null,null],
["الصَّبُورُ","Aṣ-Ṣabūr","Le Patient","The Most Patient","الذي لا يعاجل العصاة بالعقوبة",null,null],
];
if (N.length !== 99) throw new Error("il faut 99 noms : " + N.length);
let bad = 0;
const out = N.map(([ar, tr, fr, en, arm, ref, probe], i) => {
  if (ref) {
    const [s, a] = ref.split(":").map(Number);
    const txt = norm(Q.a[s - 1][a - 1]).replace(/\s+/g, " ");
    const p = norm(probe);
    if (!txt.replace(/ا/g, "").includes(p.replace(/ا/g, ""))) { bad++; console.error(`✗ ${i + 1} ${tr} : « ${probe} » absent de ${ref}`) }
  }
  return { n: i + 1, ar, tr, fr, en, arm, ref };
});
if (bad) process.exit(1);
writeFileSync(join(ROOT, "www/data/names.json"), JSON.stringify({ source: "Liste des 99 noms rapportée par at-Tirmidhī (hadith n° 3507) ; versets vérifiés dans quran.json.", names: out }));
console.log(`OK : 99 noms, ${out.filter(x => x.ref).length} avec un verset vérifié.`);
