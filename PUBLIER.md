# Publier NOOR sur Google Play, l'App Store et le web

Tout ce qui pouvait être préparé l'est déjà. Il reste les étapes qui demandent **votre identité, vos comptes et vos paiements** : personne ne peut les faire à votre place.

| Déjà prêt dans ce dossier | Où |
|---|---|
| Versions conformes aux règles actuelles : Android 16 (API 36) et Xcode 26 / SDK iOS 26 | Capacitor 8, `.github/workflows/` |
| Compilation signée Android (AAB pour Google Play) | `android-release.yml` |
| Compilation iOS envoyée sur TestFlight | `ios-release.yml` |
| Icônes, écran de démarrage, bannière Google Play | `assets/`, `fastlane/metadata/android/*/images/` |
| 8 captures par langue (FR, EN, AR), aux formats Google Play et iPhone 6,9 po | `fastlane/metadata/android/*/images/phoneScreenshots/`, `fastlane/screenshots/` |
| Titres, descriptions, mots-clés en 3 langues (limites vérifiées) | `fastlane/metadata/` |
| Politique de confidentialité, page d'assistance, site | `site/` (publié par `pages.yml`) |
| Réponses aux questionnaires (sécurité des données, âge, confidentialité Apple) | `store/FORMULAIRES.md` |
| Manifeste de confidentialité Apple, autorisations micro/position, chiffrement déclaré | `ios-extra/`, `scripts/prepare-ios.sh` |

---

## Étape 0 — Trois décisions avant tout

1. **L'identifiant de l'application** est actuellement `app.noor.quran`. Il est **définitif** dès le premier envoi sur un store et doit être unique au monde. Si vous voulez le vôtre (par exemple `com.votrenom.noor`), changez-le **maintenant** dans `capacitor.config.json`, `.github/workflows/android-release.yml` (`packageName`) et `.github/workflows/ios-release.yml` (`PRODUCT_BUNDLE_IDENTIFIER`).
2. **Une adresse e-mail de contact** : remplacez `[adresse e-mail de contact à compléter]` dans `site/privacy.html` et `site/support.html`. Les deux stores l'exigent.
3. **Relecture** : faites relire les leçons de tajweed, les textes de « Découvrir le Coran » et le champ `reviewer` de `www/data/manifest.json` (le nom du savant qui valide l'édition).

## Étape 1 — Mettre le projet sur GitHub (gratuit)

1. Créez un compte sur github.com, puis un dépôt **public** nommé `noor` (GitHub Pages gratuit exige un dépôt public).
2. Envoyez-y ce dossier. Je peux préparer l'envoi : il vous suffira de vous connecter.
3. Dans le dépôt : **Settings › Pages › Source : GitHub Actions**. Le site sera en ligne à `https://VOTRE-NOM.github.io/noor/`, avec la confidentialité, l'assistance et la version web (`/app/`).
4. Mettez à jour les liens des fiches : `node scripts/make-store-texts.mjs https://VOTRE-NOM.github.io/noor`.

## Étape 2 — Google Play

1. **Compte développeur** sur play.google.com/console : 25 $ une seule fois, puis vérification de votre identité (pièce d'identité et téléphone).
2. **Clé de signature** (une seule fois) :
   - Dans GitHub › Settings › Secrets and variables › Actions, créez `ANDROID_KEYSTORE_PASSWORD` (un mot de passe long, que vous gardez précieusement).
   - Onglet **Actions › « Android — créer la clé de signature » › Run workflow**.
   - Téléchargez l'artefact. **Gardez le fichier `.keystore` en lieu sûr**, copiez le contenu de `keystore.base64.txt` dans un nouveau secret `ANDROID_KEYSTORE_BASE64`, puis **supprimez l'artefact** sur GitHub.
3. **Compilation** : Actions › « Android — version Google Play » › Run workflow. Vous obtenez `app-release.aab`.
4. **Play Console › Créer une application** : nom « NOOR – Coran & Récitation », gratuite, application (pas jeu).
5. Activez **la signature d'application par Google Play** (proposée par défaut), puis envoyez l'AAB dans **Tests › Test interne**.
6. Remplissez la **fiche** (textes et images de `fastlane/metadata/android/`) et les **questionnaires** (`store/FORMULAIRES.md`).
7. **Test fermé obligatoire pour les comptes personnels récents** : Google exige un test fermé avec un nombre minimum de testeurs (12 au moment de la rédaction) pendant 14 jours avant la mise en production. Vérifiez le chiffre affiché dans votre Console, puis invitez famille et amis.
8. Ensuite : **Production › Créer une version › Envoyer pour examen**. Comptez quelques jours de vérification.
9. *Facultatif* : pour que GitHub envoie lui-même les nouvelles versions, créez un compte de service Google Cloud avec accès à la Console et enregistrez son JSON dans le secret `PLAY_SERVICE_ACCOUNT_JSON`. Le premier envoi doit rester manuel.

## Étape 3 — App Store (iPhone)

1. **Apple Developer Program** sur developer.apple.com : 99 $ par an, avec vérification d'identité. Aucun Mac n'est nécessaire, GitHub compile sur un Mac dans le cloud.
2. **App Store Connect › Apps › Nouvelle app** : plateforme iOS, nom « NOOR – Coran & Récitation », langue principale français, identifiant de lot `app.noor.quran` (ou le vôtre), un SKU au choix (`noor001`).
3. **Clé API** : App Store Connect › Utilisateurs et accès › Intégrations › Clés API › Générer, avec le rôle **Admin**. Téléchargez le fichier `.p8` (une seule fois possible).
4. Créez les secrets GitHub `APPLE_TEAM_ID` (Membership › Team ID), `ASC_KEY_ID`, `ASC_ISSUER_ID` et `ASC_KEY_P8_BASE64`. Pour ce dernier, encodez le `.p8` en base64 dans PowerShell :
   `[Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_XXXX.p8"))`
5. **Compilation** : Actions › « iOS — version App Store » › Run workflow. La version arrive dans **TestFlight** environ 15 minutes plus tard. Installez TestFlight sur un iPhone pour l'essayer.
6. Remplissez la fiche : textes de `fastlane/metadata/<langue>/`, captures de `fastlane/screenshots/<langue>/`, confidentialité, âge et notes de vérification (`store/FORMULAIRES.md`).
7. **Ajouter pour vérification › Envoyer**. La vérification d'Apple prend en général 1 à 3 jours.

## Étape 4 — Web et autres boutiques

- **Version web** : publiée automatiquement par GitHub Pages dans `/app/`, installable depuis Chrome ou Safari (« Ajouter à l'écran d'accueil »).
- **Samsung Galaxy Store, Huawei AppGallery, Amazon Appstore** : ils acceptent le même fichier Android (APK ou AAB signé) et les mêmes textes et captures.
- **Microsoft Store** : avec pwabuilder.com, à partir de l'adresse de la version web.

## Étape 5 — L'assistant IA (facultatif)

1. Déployez `server/` sur un hébergeur Node (Render, Railway, Fly.io…) avec la variable `ANTHROPIC_API_KEY`.
2. Mettez son adresse dans `www/config.js` (`aiUrl`).
3. Mettez à jour les questionnaires de confidentialité (lignes **[IA]** de `store/FORMULAIRES.md`).

## Publier une mise à jour

1. Augmentez la version dans `package.json` et `www/config.js` (par exemple `1.0.1`).
2. Ajoutez une note dans `fastlane/metadata/android/*/changelogs/` et `fastlane/metadata/*/release_notes.txt`.
3. Créez l'étiquette `v1.0.1` sur GitHub : les compilations Android et iOS démarrent toutes seules.

## Régénérer les visuels

Lancez `npm run serve`, puis `node scripts/make-store-images.mjs`. Les captures sont refaites avec Chrome dans les 3 langues.
