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
  },
};

export default config;
