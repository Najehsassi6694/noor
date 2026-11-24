#!/usr/bin/env bash
# Crée le projet Android natif de NOOR (dossier android/) avec icônes, permissions et numéro de version.
# Utilisé par les compilations automatiques ; peut aussi servir sur un PC avec Node 22 et Java 21.
set -euo pipefail
VERSION_CODE="${1:-1}"
VERSION_NAME="$(node -p "require('./package.json').version")"

rm -rf android
npx cap add android
npx --yes @capacitor/assets@4.0.0 generate --android --iconBackgroundColor '#1E4A3F' --iconBackgroundColorDark '#1E4A3F' --splashBackgroundColor '#F3EEE3' --splashBackgroundColorDark '#16241F'

M=android/app/src/main/AndroidManifest.xml
PERMS='    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />\n    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />\n    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n    <queries>\n        <intent><action android:name="android.speech.RecognitionService" /></intent>\n        <intent><action android:name="android.intent.action.TTS_SERVICE" /></intent>\n    </queries>\n</manifest>'
sed -i "s#</manifest>#${PERMS}#" "$M"

G=android/app/build.gradle
sed -i -E "s/versionCode [0-9]+/versionCode ${VERSION_CODE}/; s/versionName \"[^\"]*\"/versionName \"${VERSION_NAME}\"/" "$G"

# Signature de publication, seulement si la clé est fournie (variables d'environnement)
if [ -n "${ANDROID_KEYSTORE_BASE64:-}" ]; then
  echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > android/app/upload.keystore
  cat > android/app/signing.gradle <<'EOF'
android {
    signingConfigs {
        release {
            storeFile file("upload.keystore")
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: "noor"
            keyPassword System.getenv("ANDROID_KEY_PASSWORD") ?: System.getenv("ANDROID_KEYSTORE_PASSWORD")
        }
    }
    buildTypes { release { signingConfig signingConfigs.release } }
}
EOF
  echo "apply from: 'signing.gradle'" >> "$G"
fi

npx cap sync android
echo "Android prêt : version ${VERSION_NAME} (${VERSION_CODE})"
