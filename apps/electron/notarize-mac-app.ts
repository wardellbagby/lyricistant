import path from 'path';
import { notarize } from '@electron/notarize';
import { config } from 'dotenv';
import { AfterPackContext } from 'electron-builder';

config({
  path: path.resolve('apps', 'electron', 'notarize-mac-app.env'),
  debug: true,
});

export default async (context: AfterPackContext) => {
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

  await notarize({
    appBundleId: 'com.wardellbagby.lyricistant',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: '46CHV69543',
  });

  console.log('  • notarized successfully using custom notarization');

  /*
   * electron-builder doesn't let you explicitly define the platforms that it
   * should sign for. However, it does honor the ordering that you define the
   * platforms in. So, if we make sure we sign the macOS first, we can then
   * explicitly delete the env variables that electron-builder wants to use to
   * sign any later platforms that we DON'T want to be signed.
   *
   * Yes, this is jank. No, I don't like. Yeah, it'll probably break.
   */
  delete process.env['CSC_LINK'];
  delete process.env['CSC_KEY_PASSWORD'];
};
