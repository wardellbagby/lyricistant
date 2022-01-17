import { APP_PLATFORM, APP_VERSION } from '@lyricistant/renderer/globals';

export const setupAnalytics = () => {
  if (process.env.NODE_ENV === 'production') {
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

    const timeout = setInterval(() => {
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

      clearInterval(timeout);

      window.goatcounter.count({
        path,
        event: false,
      });
    }, 5000);
  }
};
