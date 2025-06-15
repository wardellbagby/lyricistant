import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';
import { internalIpV4Sync } from 'internal-ip';

const config: CapacitorConfig = {
  appId: 'com.wardellbagby.lyricistant',
  appName: 'Lyricistant',
  webDir: 'apps/mobile/dist',
  android: {
    path: 'apps/mobile/android',
  },
  ios: {
    path: 'apps/mobile/ios',
  },
  server: process.env.NODE_ENV === 'development' && {
    url: `http://${internalIpV4Sync()}:8080`,
    cleartext: true,
    hostname: 'localhost',
  },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Native,
    },
  },
};

export default config;
