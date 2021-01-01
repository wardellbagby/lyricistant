export const setupAnalytics = () => {
  if (process.env.NODE_ENV === 'production') {
    window.goatcounter = {
      path: (path) => {
        if (location.protocol === 'file:') {
          return 'electron';
        }
        return location.host + path;
      },
      allow_local: true,
    };
    const analyticsScript = document.createElement('script');
    analyticsScript.setAttribute('src', 'https://gc.zgo.at/count.js');
    analyticsScript.setAttribute('async', 'true');
    analyticsScript.setAttribute(
      'data-goatcounter',
      'https://lyricistant.goatcounter.com/count'
    );
  }
};
