# NOOR — application Coran (Android & iOS)

Une seule base de code (Capacitor) qui produit l'app Android, l'app iOS et une version web.

## Ce que contient NOOR

| Fonction | Détail |
|---|---|
| Lecture | 114 sourates, 30 juz, mode « verset par verset » ou « Mushaf », taille du texte réglable, thème clair/sombre |
| Texte authentique | Mushaf Uthmani (Quran.com) + traduction Hamidullah, embarqués **hors-ligne**. Empreinte SHA-256 vérifiée à chaque lancement |
| Récitation | 9 récitateurs (Alafasy, Abdul Basit, Sudais, Minshawi, Husary…), lecture continue, verset en surbrillance, contrôles sur l'écran verrouillé |
| Mémorisation | Masquage des mots (tap pour révéler), répétition d'un verset 3 à 10 fois, versets marqués « mémorisé » |
| Recherche | Par sourate, par référence (`2:255`), par mot en français ou en arabe (sans voyelles) |
| Assistant IA | Questions, explication d'un verset, résumé d'une sourate, versets par thème |
| Prières | Horaires selon 12 méthodes de calcul, GPS ou ville, rappel à chaque prière (notifications) |
| Qibla | Direction calculée + boussole du téléphone |
| Tasbih | Compteur avec vibration, objectifs 33/99/100 |
| Progrès | Objectif quotidien, série de jours, graphique 7 jours, avancement du khatm |
| Extras | Verset du jour, 26 invocations « Rabbanā » du Coran, favoris, partage, copie |

## Pour tout le monde

- **Découvrir le Coran** (accueil, onglet Apprendre, et choix proposé au premier lancement) : une présentation factuelle et neutre pour les non-musulmans et les débutants. On y trouve 7 sourates par où commencer, 8 thèmes souvent recherchés qui renvoient vers de vrais versets (Jésus et Marie, « pas de contrainte en religion », etc.) et un petit lexique.
- **IA discrète** : les boutons d'IA n'apparaissent que lorsqu'un serveur IA est configuré. Sans serveur, l'onglet Assistant explique simplement comment l'activer.
- La prononciation des lettres de Little Noor passe par `@capacitor-community/text-to-speech` dans l'app installée, parce que la WebView d'Android n'a pas de synthèse vocale.

## Langues

Interface en **français, anglais et arabe** (mise en page de droite à gauche en arabe), choisie à la première ouverture ou dans Moi › Réglages. Traductions du Coran : Hamidullah (français) et Saheeh International (anglais), ou arabe seul.

## Apprendre : tafsir, tajweed, enfants

- **Tafsir** : 10 commentaires (Al-Muyassar, As-Saʿdī, Ibn Kathīr, Aṭ-Ṭabarī, Al-Qurṭubī, Al-Baghawī, Al-Wasīṭ en arabe ; Ibn Kathir abrégé, Ma'arif al-Qur'an, Tazkirul Quran en anglais), chargés depuis Quran.com et affichés **mot pour mot avec leur source**. Il n'existe pas de tafsir français sous licence ouverte : l'IA peut en faire un résumé, clairement marqué « IA ». Nécessite internet.
- **Tajweed** : 6 leçons (nūn sākina et tanwīn, mīm sākina, ghunna, qalqala, madd, lettres non prononcées), légende des 17 règles et exemples tirés du Juz ʿAmma. Les couleurs viennent des annotations de Quran.com, **alignées lettre par lettre sur le texte vérifié** (`scripts/build-tajweed.mjs`) : 6 069 versets coloriés, et 167 versets restent sans couleur parce que l'alignement n'est pas certain. Le texte affiché reste toujours celui du Mushaf vérifié. Les couleurs peuvent aussi être activées dans le lecteur.
- **Réciter et corriger** : l'utilisateur récite à voix haute. NOOR transcrit la voix (reconnaissance vocale du téléphone en arabe) et compare **mot à mot** avec le verset vérifié : les mots justes passent en vert, et les mots oubliés, changés ou ajoutés sont signalés. Le texte peut être masqué pour tester sa mémoire. Le moteur de comparaison est testé sur les 6 236 versets (une récitation sans faute est toujours reconnue comme juste). Limite : il vérifie les mots, pas encore la prononciation fine (voyelles, tajweed). Sur Android et iOS, il passe par le module `@capacitor-community/speech-recognition` ; dans le navigateur, par Chrome. Sur iOS, ajouter `NSMicrophoneUsageDescription` et `NSSpeechRecognitionUsageDescription` dans `Info.plist`.
- **Little Noor** : les 28 lettres avec leurs 4 formes et leur prononciation, un jeu « trouve la lettre », 21 petites sourates récitées lentement par Al-Ḥuṣarī (méthode d'enseignement), avec des étoiles en récompense.

## Reprise du travail de Lovable

Le projet Lovable « Noor Quran Companion » (une vitrine de design, mise en pause faute de crédits) a été repris ici :
- **Design approuvé** : logo en arche avec étoile à huit branches, palette ivoire / émeraude / or (nuit en mode sombre), polices Cormorant Garamond, Manrope, IBM Plex Sans Arabic et Amiri, motif girih, numéros de sourate en losange, cadre doré du Mushaf, écran d'accueil « Une lumière pour le cœur ».
- **Règles d'intégrité** de son document d'architecture : source, édition, riwaya et version enregistrées dans `www/data/manifest.json`, avec une empreinte SHA-256 par sourate. Une sourate dont l'empreinte ne correspond pas n'est **jamais affichée** (échec fermé). Le contrôle `npm run verify` est lancé à chaque compilation.
- **Reste à faire, comme Lovable l'exigeait** : désigner le savant qui relit et approuve l'édition, puis remplir le champ `reviewer` du manifeste. L'app affiche « à désigner » tant que ce n'est pas fait.

Le code Lovable d'origine n'est pas modifié. Il est conservé dans le dossier `lovable/`, à côté de celui-ci.

## Garantie : aucun verset n'est modifié

- Les versets affichés viennent **uniquement** de `www/data/quran.json`, copié octet pour octet depuis l'API Quran.com (0 différence sur 6 236 versets). Chaque sourate est vérifiée au démarrage contre le manifeste (Réglages › « Source du texte »).
- L'IA n'a jamais le droit d'écrire un verset : ses règles le lui interdisent (côté serveur), et l'app **efface** tout texte arabe qu'elle renverrait.
- Chaque référence citée par l'IA est vérifiée. Une référence inexistante est signalée et le verset réel est affiché depuis le Mushaf.
- Les réponses de l'IA sont toujours dans un cadre bleu marqué « explication, pas le Coran ». Pas de fatwa.

## 1. Essayer tout de suite (navigateur)

```powershell
npm install
npm run serve
```
Ouvrir http://localhost:8080 (sur téléphone : même Wi-Fi, adresse IP du PC).

## 2. Obtenir l'APK Android (sans installer Android Studio)

1. Créer un dépôt GitHub et y envoyer ce dossier `noor`.
2. Onglet **Actions** › « Build Android APK » › *Run workflow*.
3. Après ~6 min, télécharger l'artefact **NOOR-apk** et installer `app-debug.apk` sur le téléphone.

Avec Android Studio installé : `npm run android`.

## 3. iOS

Nécessite un Mac avec Xcode : `npx cap add ios`, puis `npm run ios`.
Dans `ios/App/App/Info.plist`, ajouter `NSLocationWhenInUseUsageDescription` (« Pour calculer les horaires de prière et la qibla »).
Sans Mac : un service comme Codemagic peut compiler l'app iOS depuis le dépôt GitHub.

## 4. Activer l'assistant IA

La clé API ne doit jamais être dans l'app. Le petit serveur `server/` la garde :

```powershell
cd server
npm install
$env:ANTHROPIC_API_KEY = "votre-clé"
npm start
```
Le déployer sur un hébergeur Node (Render, Railway, Fly.io…), puis coller son adresse dans **NOOR › Plus › Réglages › Serveur de l'assistant IA**.
Modèle par défaut : Claude Opus 5.5 (changeable avec la variable `NOOR_MODEL`), avec repli automatique si une demande est refusée. Limite : 20 requêtes / 10 min par appareil.

## 5. Publier sur les stores

- **Google Play** : compte développeur (25 $ une fois). Dans Android Studio : *Build › Generate Signed Bundle* (.aab).
- **App Store** : Apple Developer Program (99 $/an), archive depuis Xcode.
- Identifiant de l'app : `app.noor.quran` (modifiable dans `capacitor.config.json`).

## Structure

```
www/            l'application (HTML/CSS/JS, polices et Coran embarqués)
www/data/       quran.json (6 236 versets + traduction), juz.json
server/         serveur IA (Node)
assets/         icône et écran de démarrage
.github/        compilation automatique de l'APK
```

Sources : texte arabe et traduction via api.quran.com ; audio via verses.quran.com ; horaires calculés localement avec la bibliothèque adhan.
