require('dotenv').config({
  path: 'bin/notarize-mac-app.env'
});
const { notarize } = require('electron-notarize');
const { appId, mac } = require('../electron-builder.json');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  if (mac.identity === null) {
    console.log('  • skipped notarization  reason=identity explicitly is set to null');
    return;
  }

  return await notarize({
    appBundleId: appId,
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS
  });
};
