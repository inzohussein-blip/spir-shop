#!/usr/bin/env bash
# Builds a signed release APK of the app.
#
#   ANDROID_HOME=/path/to/android-sdk ./scripts/build-apk.sh
#
# Needs: JDK 17+, Android SDK (platform 37, build-tools 37.0.0, NDK 27.1),
# and credentials/keystore.properties (see README). Output: dist/spir-shop-<version>.apk
set -euo pipefail
cd "$(dirname "$0")/.."

: "${ANDROID_HOME:?Set ANDROID_HOME to your Android SDK path}"
PROPS=credentials/keystore.properties
if [ ! -f "$PROPS" ]; then
  # No private key: sign with React Native's standard debug key (the same file in
  # every build, so updates between these builds still install). Fine for a
  # trial; use a private key before a public launch (see README).
  echo "WARNING: $PROPS not found, signing with the standard debug key" >&2
fi

VERSION=$(node -p "require('./app.json').expo.version")
ARCHS=${ARCHS:-arm64-v8a,armeabi-v7a}

# Regenerate the native project from app.json + config plugins
EXPO_OFFLINE=1 CI=1 npx expo prebuild --platform android --clean --no-install

# Pass signing properties to Gradle without writing them into the project
GRADLE_ARGS=()
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  GRADLE_ARGS+=("-P$key=$value")
done < <([ -f "$PROPS" ] && cat "$PROPS" || true)

# React Native's Gradle plugins need a JDK 17 toolchain (set JDK17_HOME if it is elsewhere)
JDK17_HOME=${JDK17_HOME:-$(ls -d /usr/lib/jvm/java-17-openjdk* 2>/dev/null | head -1 || true)}
if [ -n "$JDK17_HOME" ]; then
  GRADLE_ARGS+=("-Porg.gradle.java.installations.paths=$JDK17_HOME" "-Porg.gradle.java.installations.auto-download=false")
fi

# Maven Central rate-limits bursts of downloads (HTTP 429): retry with backoff
GRADLE_ARGS+=("-Dorg.gradle.internal.repository.max.retries=8" "-Dorg.gradle.internal.repository.initial.backoff=3000")

(cd android && ./gradlew assembleRelease --no-daemon --max-workers="${GRADLE_WORKERS:-3}" "${GRADLE_ARGS[@]}" -PreactNativeArchitectures="$ARCHS")

mkdir -p dist
# APP_STORE picks the store (stores/<slug>.json); the default store keeps the old file name
NAME="spir-shop"
[ -n "$APP_STORE" ] && [ "$APP_STORE" != "spir" ] && NAME="$APP_STORE"
cp android/app/build/outputs/apk/release/app-release.apk "dist/$NAME-$VERSION.apk"
echo "APK: $(pwd)/dist/$NAME-$VERSION.apk"
