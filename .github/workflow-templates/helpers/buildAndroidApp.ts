import { Job, Step } from './Workflow';
import { basicSetup } from './basicSetup';
import { gulp } from './local-tasks';
import { DOWNLOAD_ARTIFACT, UPLOAD_ARTIFACT } from './versions';

const ANDROID_TAG = 'android-app';

interface Options {
  nightly: boolean;
}

export const buildAndroidApp = (options?: Options): Job => {
  const { nightly } = options ?? { nightly: false };
  return {
    name: 'Build Android',
    'runs-on': 'ubuntu-20.04',
    steps: [
      ...basicSetup({ forMobileBuilds: true }),
      {
        name: 'Populate keystore',
        run: 'echo "${{ secrets.KEYSTORE }}" | base64 --decode > apps/mobile/android/android.keystore',
      },
      {
        name: 'Populate keystore properties',
        run: 'echo "${{ secrets.KEYSTORE_PROPERTIES }}" | base64 --decode > apps/mobile/android/keystore.properties',
      },
      {
        name: 'Populate Play Store credentials',
        run: 'echo "${{ secrets.PLAY_STORE_CREDS }}" | base64 --decode > play-store-credentials.json',
      },
      {
        name: 'Bundle Mobile',
        run: gulp('bundleAndroid'),
        env: {
          NIGHTLY: nightly,
        },
      },
      {
        name: 'Build Android',
        run: 'bundle exec fastlane android release',
      },
      {
        name: 'Upload Android app',
        uses: UPLOAD_ARTIFACT,
        with: {
          name: ANDROID_TAG,
          path: 'apps/mobile/dist/android/*.apk',
        },
      },
    ],
  };
};

export const downloadAndroidApp = ({ path }: { path: string }): Step => ({
  name: 'Download Android app',
  uses: DOWNLOAD_ARTIFACT,
  with: {
    name: 'android-app',
    path,
  },
});
