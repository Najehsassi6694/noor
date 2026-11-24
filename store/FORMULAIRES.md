# Réponses aux questionnaires des stores

Ces réponses correspondent au fonctionnement réel de NOOR. Elles supposent l'assistant IA **désactivé** (`www/config.js` vide). Si vous l'activez, appliquez les lignes marquées **[IA]**.

---

## Google Play Console

### Sécurité des données (Data safety)
| Question | Réponse |
|---|---|
| L'application collecte-t-elle ou partage-t-elle des données utilisateur ? | **Non** **[IA : Oui]** |
| Toutes les données sont-elles chiffrées en transit ? | Oui (HTTPS) |
| Les utilisateurs peuvent-ils demander la suppression de leurs données ? | Non applicable : aucune donnée n'est conservée par l'éditeur |
| **[IA]** Type de données | Messages de l'app › « Autres contenus générés par l'utilisateur » (les questions posées) |
| **[IA]** Collecte | Oui ; traitement éphémère : Oui ; partage : Oui avec un sous-traitant (Anthropic) pour produire la réponse ; finalité : fonctionnalité de l'app ; facultatif : Oui |

À savoir : la **position** est utilisée uniquement sur l'appareil, et **l'audio du micro** est traité par le service vocal du téléphone (Google). Google Play ne considère pas comme « collecte » des données traitées uniquement sur l'appareil.

### Classification du contenu (questionnaire IARC)
- Catégorie : **Référence, actualités ou éducation**.
- Violence, sexualité, langage grossier, substances, jeux d'argent : **Non**.
- Interaction entre utilisateurs, partage de position avec d'autres, achats numériques : **Non**.
- Résultat attendu : **Tout public / PEGI 3**.

### Public cible et contenu
- Tranches d'âge : **13 à 15 ans, 16 à 17 ans, 18 ans et plus**. Little Noor s'utilise avec un parent.
- Si Google estime que l'application attire aussi les enfants, NOOR respecte déjà la politique « Familles » : aucune publicité, aucune donnée collectée, aucun achat.
- Publicités : **Non**.

### Autorisations sensibles
- Micro (`RECORD_AUDIO`) : fonction « Réciter et corriger », utilisée seulement quand l'utilisateur touche le micro.
- Alarmes exactes (`SCHEDULE_EXACT_ALARM`) : rappels à l'heure exacte de la prière. L'utilisateur peut les refuser.
- Localisation en premier plan : horaires de prière et qibla, calculés sur l'appareil.

### Fiche de l'application
- Catégorie : **Livres et références** (ou **Éducation**).
- Textes, captures (8 par langue), bannière et icône : déjà prêts dans `fastlane/metadata/android/`.
- Politique de confidentialité : `https://VOTRE-NOM.github.io/noor/privacy.html`.

---

## App Store Connect

### Confidentialité de l'app (App Privacy)
- Collecte de données : **« Aucune donnée collectée »** **[IA : « Autres contenus utilisateur » — non lié à l'identité, sans pistage, finalité « Fonctionnalité de l'app »]**.
- Pistage (App Tracking Transparency) : **Non**.

### Âge
- Questionnaire : **Aucun** contenu sensible → **4+**.

### Conformité à l'exportation (chiffrement)
- Déjà déclarée dans l'app (`ITSAppUsesNonExemptEncryption = false`) : NOOR n'utilise que le HTTPS standard.

### Catégories
- Principale : **Référence** ; secondaire : **Éducation**.

### Notes pour l'équipe de vérification d'Apple (App Review)
> NOOR is a free Quran reading and learning app with no account, no ads and no in-app purchases. The Quran text is bundled and verified offline. Audio recitations and tafsir are streamed from Quran.com. The microphone is only used in "Learn › Recite & correct" after the user taps the microphone button: speech is transcribed by Apple's speech recognition and compared locally with the verse. Location is only used on-device for prayer times and qibla. No login is required to review any feature.

### Contenu religieux
Apple accepte les applications de référence religieuse. Pour éviter un refus pour « fonctionnalités minimales » (règle 4.2), mettez en avant dans la description et les captures ce qui va au-delà d'un simple texte : la récitation corrigée, le tafsir, le tajweed, les horaires de prière et l'espace enfants.
