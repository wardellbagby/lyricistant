import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wardellbagby.lyricistant',
  appName: 'Lyricistant',
  webDir: 'apps/mobile/dist',
  bundledWebRuntime: false,
  android: {
    path: 'apps/mobile/android',
  },
  ios: {
    path: 'apps/mobile/ios',
  },
  plugins: {
    Keyboard: {
      resize: 'native',
    },
    SplashScreen: {
      launchShowDuration: 10000,
      launchAutoHide: true,
      androidScaleType: 'FIT_XY',
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'large',
      spinnerColor: '#999999',
      showSpinner: true,
    },
  },
};

export default config;
