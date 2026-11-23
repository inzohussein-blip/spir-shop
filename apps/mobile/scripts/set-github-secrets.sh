#!/usr/bin/env bash
# Uploads the release signing key to the repository's GitHub Actions secrets,
# so .github/workflows/android-apk.yml can sign APKs with the SAME key as the
# app your customers already installed.
#
#   gh auth login            # once
#   ./scripts/set-github-secrets.sh [credentials-dir] [owner/repo]
#
# credentials-dir must contain spir-release.jks and keystore.properties.
set -euo pipefail
DIR=${1:-"$(dirname "$0")/../credentials"}
REPO=${2:-inzohussein-blip/spir-shop}

prop() { grep "^$1=" "$DIR/keystore.properties" | cut -d= -f2-; }

base64 < "$DIR/spir-release.jks" | tr -d '\n' | gh secret set ANDROID_KEYSTORE_BASE64 --repo "$REPO"
prop SPIR_RELEASE_STORE_PASSWORD | gh secret set ANDROID_KEYSTORE_PASSWORD --repo "$REPO"
prop SPIR_RELEASE_KEY_ALIAS | gh secret set ANDROID_KEY_ALIAS --repo "$REPO"
prop SPIR_RELEASE_KEY_PASSWORD | gh secret set ANDROID_KEY_PASSWORD --repo "$REPO"

echo "Secrets set on $REPO:"
gh secret list --repo "$REPO"
