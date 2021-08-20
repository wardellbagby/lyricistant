import { Job, Step } from './Workflow';
import { basicSetup } from './basicSetup';
import { gulp } from './local-tasks';
import { DOWNLOAD_ARTIFACT, UPLOAD_ARTIFACT } from './versions';
import { ifTrue } from './addIfTrue';
import { createReleaseNotes } from './createReleaseNotes';

const IOS_TAG = 'ios-app';

interface Options {
  nightly: boolean;
}

export const buildIOSApp = (options?: Options): Job => {
  const { nightly } = options ?? { nightly: false };
  return {
    name: 'Build iOS',
    'runs-on': 'macos-10.15',
    steps: [
      ...basicSetup({ forMobileBuilds: true }),
      {
        name: 'Create App Store Connect credentials',
        run: 'echo "${{ secrets.APP_STORE_CONNECT_KEY }}" | base64 --decode > apps/mobile/ios/authkey.p8',
      },
      {
        name: 'Bundle Mobile',
        run: gulp('bundleIOS'),
        env: {
          NIGHTLY: nightly,
        },
      },
      ...ifTrue<Step>(!nightly, createReleaseNotes, {
        name: 'Create iOS release notes',
        run: './scripts/create_mobile_release_notes.ts release.txt ios fastlane/metadata/ios/en-US/release_notes.txt',
      }),
      {
        name: 'Build iOS',
        run: `bundle exec fastlane ios release${nightly ? '' : ' deploy:true'}`,
        env: {
          APP_STORE_KEY_ID: '${{ secrets.APP_STORE_KEY_ID }}',
          APP_STORE_ISSUER_ID: '${{ secrets.APP_STORE_ISSUER_ID }}',
          FIRST_NAME: 'Wardell',
          LAST_NAME: 'Bagby',
          PHONE: '${{ secrets.PHONE }}',
          EMAIL: '${{ secrets.APPLE_ID }}',
          MATCH_GIT_BASIC_AUTHORIZATION:
            '${{ secrets.MATCH_GIT_BASIC_AUTHORIZATION }}',
          MATCH_PASSWORD: '${{ secrets.MATCH_PASSWORD }}',
        },
      },
      {
        name: 'Upload iOS app',
        uses: UPLOAD_ARTIFACT,
        with: {
          name: IOS_TAG,
          path: 'apps/mobile/dist/ios/*.ipa',
        },
      },
    ],
  };
};

export const downloadIOSApp = ({ path }: { path: string }): Step => ({
  name: 'Download iOS app',
  uses: DOWNLOAD_ARTIFACT,
  with: {
    name: IOS_TAG,
    path,
  },
});
