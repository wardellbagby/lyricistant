require('dotenv').config({
  path: 'bin/notarize-mac-app.env'
});
const { notarize } = require('electron-notarize');
const { appId } = require('../electron-builder.json');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  if (context.packager.config.mac.identity === null && !process.env.CSC_LINK) {
    console.log(
      '  • skipped notarization  reason=identity explicitly is set to null'
    );
    return;
  }

  return await notarize({
    appBundleId: appId,
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD
  });
};
