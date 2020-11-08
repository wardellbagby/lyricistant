window.goatcounter = {
  path: (path) => {
    if (location.protocol === 'file:') {
      return 'electron';
    }
    return location.host + path;
  },
  allow_local: true,
};
