import { isUnderTest } from '@lyricistant/common/BuildModes';
import { APP_PLATFORM, APP_VERSION } from '@lyricistant/renderer/globals';

/**
 * When running in production, connects to an analytics server and reports the
 * current version of Lyricistant that is running as well as the platform it is
 * being run on.
 */
export const setupAnalytics = () => {
  if (process.env.NODE_ENV !== 'production' || isUnderTest) {
    return;
  }

  const settings = {
    allow_local: true,
    no_onload: true,
    no_events: true,
  };
  const analyticsScript = document.createElement('script');
  analyticsScript.setAttribute('src', 'https://gc.zgo.at/count.js');
  analyticsScript.setAttribute('async', 'true');
  analyticsScript.setAttribute(
    'data-goatcounter',
    'https://lyricistant.goatcounter.com/count'
  );
  analyticsScript.setAttribute(
    'data-goatcounter-settings',
    JSON.stringify(settings)
  );
  document.head.append(analyticsScript);

  const timeoutId = setTimeout(() => {
    if (!window.goatcounter || !window.goatcounter.count) {
      return;
    }

    let site: string;
    if (location.host.includes('lyricistant.app')) {
      site = location.host;
    } else {
      site = APP_PLATFORM;
    }

    const path = `${site}/${APP_VERSION}/`;

    clearTimeout(timeoutId);

    window.goatcounter.count({
      path,
      title: '',
      event: false,
    });
  }, 10000);
};
