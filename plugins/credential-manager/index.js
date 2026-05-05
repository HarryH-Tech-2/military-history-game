const { withAppBuildGradle, withMainApplication, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SRC_FILES = ['CredentialManagerModule.kt', 'CredentialManagerPackage.kt'];
const PKG_PATH_SEGMENTS = 'com/harryharrison/militaryhistoryapp/credentialmanager';
const PKG_DOT = 'com.harryharrison.militaryhistoryapp';

function copyKotlinSources(config) {
  return withDangerousMod(config, ['android', async (cfg) => {
    const pkgPath = path.join(
      cfg.modRequest.platformProjectRoot,
      'app/src/main/java',
      PKG_PATH_SEGMENTS,
    );
    fs.mkdirSync(pkgPath, { recursive: true });
    for (const file of SRC_FILES) {
      const dest = path.join(pkgPath, file);
      const src = path.join(__dirname, file);
      fs.copyFileSync(src, dest);
    }
    return cfg;
  }]);
}

function addDependencies(config) {
  return withAppBuildGradle(config, (cfg) => {
    const dep = `    implementation "androidx.credentials:credentials:1.3.0"
    implementation "androidx.credentials:credentials-play-services-auth:1.3.0"
    implementation "com.google.android.libraries.identity.googleid:googleid:1.1.1"`;
    if (!cfg.modResults.contents.includes('androidx.credentials:credentials')) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /dependencies \{/,
        `dependencies {\n${dep}`,
      );
    }
    return cfg;
  });
}

function registerPackage(config) {
  return withMainApplication(config, (cfg) => {
    const importLine = `import ${PKG_DOT}.credentialmanager.CredentialManagerPackage`;
    const addLine = 'packages.add(CredentialManagerPackage())';
    const packageDecl = new RegExp(`package ${PKG_DOT.replace(/\./g, '\\.')}`);
    if (!cfg.modResults.contents.includes(importLine)) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        packageDecl,
        `package ${PKG_DOT}\n${importLine}`,
      );
    }
    if (!cfg.modResults.contents.includes(addLine)) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /val packages = PackageList\(this\)\.packages/,
        `val packages = PackageList(this).packages\n        ${addLine}`,
      );
    }
    return cfg;
  });
}

module.exports = function withCredentialManager(config) {
  config = copyKotlinSources(config);
  config = addDependencies(config);
  config = registerPackage(config);
  return config;
};
