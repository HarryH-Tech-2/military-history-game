// app.config.js
// Reads dynamic values from the environment so EAS file env vars
// (GOOGLE_SERVICES_JSON, GOOGLE_SERVICES_INFO_PLIST) resolve at build time.
// Falls back to local files for `expo prebuild` / `expo run` on dev machines.
const fs = require('fs');
const path = require('path');

const localAndroidGoogleServices = path.resolve(__dirname, 'google-services.json');
const localIosGoogleServices = path.resolve(__dirname, 'GoogleService-Info.plist');

const androidGoogleServices =
  process.env.GOOGLE_SERVICES_JSON ||
  (fs.existsSync(localAndroidGoogleServices) ? './google-services.json' : undefined);

const iosGoogleServices =
  process.env.GOOGLE_SERVICES_INFO_PLIST ||
  (fs.existsSync(localIosGoogleServices) ? './GoogleService-Info.plist' : undefined);

module.exports = {
  expo: {
    name: 'Military History',
    slug: 'military-history-app',
    scheme: 'mhg',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.harryharrison.militaryhistoryapp',
      googleServicesFile: iosGoogleServices,
      usesAppleSignIn: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.harryharrison.militaryhistoryapp',
      googleServicesFile: androidGoogleServices,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
          },
        },
      ],
      'expo-apple-authentication',
      './plugins/credential-manager',
    ],
    extra: {
      eas: {
        projectId: '558d5bf5-da19-4f54-9a6d-ec4aa1f9a244',
      },
    },
    owner: 'harryhh',
  },
};
