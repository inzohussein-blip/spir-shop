/**
 * Expo config plugin: sign release builds with our own keystore.
 *
 * Android only installs an update over an existing app when both APKs are
 * signed with the same key, so every release must use this keystore.
 * The keystore path and passwords come from Gradle properties (never from git):
 *   SPIR_RELEASE_STORE_FILE, SPIR_RELEASE_STORE_PASSWORD,
 *   SPIR_RELEASE_KEY_ALIAS, SPIR_RELEASE_KEY_PASSWORD
 * e.g. in ~/.gradle/gradle.properties or as ORG_GRADLE_PROJECT_<name> env vars.
 * Without them the release build falls back to the debug key.
 */
const { withAppBuildGradle } = require("expo/config-plugins")

const RELEASE_SIGNING = `
        release {
            if (project.hasProperty('SPIR_RELEASE_STORE_FILE')) {
                storeFile file(SPIR_RELEASE_STORE_FILE)
                storePassword SPIR_RELEASE_STORE_PASSWORD
                keyAlias SPIR_RELEASE_KEY_ALIAS
                keyPassword SPIR_RELEASE_KEY_PASSWORD
            }
        }`

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents
    if (gradle.includes("SPIR_RELEASE_STORE_FILE")) return cfg

    // 1) add a "release" signing config next to "debug"
    gradle = gradle.replace(/signingConfigs \{\n/, `signingConfigs {${RELEASE_SIGNING}\n`)

    // 2) use it for the release build type when the keystore is configured
    gradle = gradle.replace(
      /(\n\s*release \{\n(?:\s*\/\/.*\n)*\s*)signingConfig signingConfigs\.debug/,
      "$1signingConfig project.hasProperty('SPIR_RELEASE_STORE_FILE') ? signingConfigs.release : signingConfigs.debug"
    )

    cfg.modResults.contents = gradle
    return cfg
  })
}
