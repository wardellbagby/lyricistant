export const latestReleaseUrl =
  'https://github.com/wardellbagby/lyricistant/releases/latest/download/';

export interface Release {
  platform: 'Mac' | 'Windows' | 'Linux' | 'Android' | 'iOS';
  asset?: string;
  url?: string;
  arch?: string;
}

export const supportedReleases: Release[] = [
  { platform: 'Mac', asset: 'lyricistant-mac_x64.dmg' },
  {
    platform: 'Windows',
    asset: 'lyricistant-win.exe',
  },
  {
    platform: 'iOS',
    url: 'https://apps.apple.com/om/app/lyricistant/id1561506174',
  },
  {
    platform: 'Android',
    url: 'https://play.google.com/store/apps/details?id=com.wardellbagby.lyricistant',
  },
  {
    platform: 'Linux',
    asset: 'lyricistant-linux_x86_64.AppImage',
    arch: 'x64',
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
      logger.info('Downloading app for Mac.');
      url += supportedReleases.find(
        (release) => release.platform === 'Mac'
      ).asset;
      break;
    }
    case 'Win32': {
      logger.info('Downloading app for Windows.');
      url += supportedReleases.find(
        (release) => release.platform === 'Windows'
      ).asset;
      break;
    }
    default: {
      logger.info(
        `Couldn't automatically download for platform ${window.navigator.platform}`
      );
      return false;
    }
  }
  window.open(url, '_blank');
  return true;
};
