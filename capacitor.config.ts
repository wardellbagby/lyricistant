import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';
import ip from 'internal-ip';

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
  server: process.env.NODE_ENV === 'development' && {
    url: `http://${ip.v4.sync()}:8080`,
    cleartext: true,
  },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Native,
    },
  },
};

export default config;
