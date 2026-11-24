#!/usr/bin/env bash
# Crée le projet iOS natif de NOOR (dossier ios/) : icônes, autorisations, langues, manifeste de confidentialité.
# À exécuter sur un Mac (ou un runner macOS de GitHub) avec Node 22, Xcode 26 et CocoaPods.
set -euo pipefail
BUILD="${1:-1}"
VERSION_NAME="$(node -p "require('./package.json').version")"

rm -rf ios
# CocoaPods : le module de reconnaissance vocale ne gère pas encore Swift Package Manager
npx cap add ios --packagemanager CocoaPods
npx --yes @capacitor/assets@4.0.0 generate --ios --iconBackgroundColor '#1E4A3F' --splashBackgroundColor '#F3EEE3' --splashBackgroundColorDark '#16241F'

P=ios/App/App/Info.plist
pb() { /usr/libexec/PlistBuddy -c "$1" "$P" 2>/dev/null || true; }
pb "Delete :CFBundleDisplayName"; pb "Add :CFBundleDisplayName string NOOR"
pb "Add :NSMicrophoneUsageDescription string NOOR écoute votre récitation pour signaler les mots oubliés. / NOOR listens to your recitation to point out missed words."
pb "Add :NSSpeechRecognitionUsageDescription string Votre récitation est transcrite pour être comparée au verset. / Your recitation is transcribed to compare it with the verse."
pb "Add :NSLocationWhenInUseUsageDescription string Votre position sert à calculer les horaires de prière et la qibla, sur votre appareil. / Your location is used on your device for prayer times and qibla."
pb "Add :ITSAppUsesNonExemptEncryption bool false"
pb "Delete :CFBundleLocalizations"; pb "Add :CFBundleLocalizations array"
pb "Add :CFBundleLocalizations:0 string fr"; pb "Add :CFBundleLocalizations:1 string en"; pb "Add :CFBundleLocalizations:2 string ar"
pb "Add :UIBackgroundModes array"; pb "Add :UIBackgroundModes:0 string audio"

# Manifeste de confidentialité ajouté à la cible App
cp ios-extra/PrivacyInfo.xcprivacy ios/App/App/PrivacyInfo.xcprivacy
ruby -e '
require "xcodeproj"
p = Xcodeproj::Project.open("ios/App/App.xcodeproj")
t = p.targets.find { |x| x.name == "App" }
g = p.main_group["App"]
ref = g.files.find { |f| f.path == "PrivacyInfo.xcprivacy" } || g.new_file("PrivacyInfo.xcprivacy")
t.resources_build_phase.add_file_reference(ref, true)
t.build_configurations.each { |c| c.build_settings["MARKETING_VERSION"] = ARGV[0]; c.build_settings["CURRENT_PROJECT_VERSION"] = ARGV[1] }
p.save' "$VERSION_NAME" "$BUILD"

npx cap sync ios
echo "iOS prêt : version ${VERSION_NAME} (${BUILD})"
