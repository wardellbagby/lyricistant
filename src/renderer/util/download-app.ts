import { appComponent } from '../globals';

export const latestReleaseUrl =
  'https://github.com/wardellbagby/lyricistant/releases/latest/download/';

export interface Release {
  platform: 'Mac' | 'Windows' | 'Ubuntu' | 'Linux';
  asset: string;
  arch?: string;
}

export const supportedReleases: Release[] = [
  { platform: 'Mac', asset: 'lyricistant-mac.dmg' },
  {
    platform: 'Windows',
    asset: 'lyricistant-win.exe',
  },
  {
    platform: 'Ubuntu',
    asset: 'lyricistant-linux_i386.deb',
    arch: 'i386',
  },
  {
    platform: 'Ubuntu',
    asset: 'lyricistant-linux_armv7l.deb',
    arch: 'armv7l',
  },
  {
    platform: 'Ubuntu',
    asset: 'lyricistant-linux_arm64.deb',
    arch: 'arm64',
  },
  {
    platform: 'Linux',
    asset: 'lyricistant-linux_i386.AppImage',
    arch: 'i386',
  },
  {
    platform: 'Linux',
    asset: 'lyricistant-linux_armv7l.AppImage',
    arch: 'armv7l',
  },
  {
    platform: 'Linux',
    asset: 'lyricistant-linux_arm64.AppImage',
    arch: 'arm64',
  },
];

export const downloadApp = (): boolean => {
  let url = latestReleaseUrl;
  switch (window.navigator.platform) {
    case 'MacIntel': {
      appComponent.get<Logger>().info('Downloading app for Mac.');
      url += supportedReleases.find((release) => release.platform === 'Mac')
        .asset;
      break;
    }
    case 'Win32': {
      appComponent.get<Logger>().info('Downloading app for Windows.');
      url += supportedReleases.find((release) => release.platform === 'Windows')
        .asset;
      break;
    }
    default: {
      appComponent
        .get<Logger>()
        .info(
          `Couldn't automatically download for platform ${window.navigator.platform}`
        );
      return false;
    }
  }
  window.open(url, '_blank');
  return true;
};
