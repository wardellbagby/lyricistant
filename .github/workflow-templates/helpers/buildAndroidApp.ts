import { defaultRunner } from '../Runners';
import { ifTrue } from './addIfTrue';
import { basicSetup } from './basicSetup';
import { gulp } from './local-tasks';
import { DOWNLOAD_ARTIFACT, UPLOAD_ARTIFACT } from './versions';
import { Job, Step } from './Workflow';

const ANDROID_TAG = 'android-app';

interface Options {
  nightly: boolean;
}

export const buildAndroidApp = (options?: Options): Job => {
  const { nightly } = options ?? { nightly: false };
  return {
    name: 'Build Android',
    'runs-on': defaultRunner,
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
      ...ifTrue<Step>(!nightly, {
        name: 'Create Android release notes',
        run: './scripts/create_app_store_safe_changelog.ts android fastlane/metadata/android/en-US/changelogs/default.txt',
      }),
      {
        name: 'Build Android',
        run: `bundle exec fastlane android release${
          nightly ? '' : ' deploy:true'
        }`,
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
