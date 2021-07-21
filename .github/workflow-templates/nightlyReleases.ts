import { Job, Workflow } from './helpers/Workflow';
import { basicSetup } from './helpers/basicSetup';
import { gulp } from './helpers/local-tasks';
import { deployWeb as deployWebStep } from './helpers/deployWeb';
import { DOWNLOAD_ARTIFACT, RETRY, UPLOAD_ARTIFACT } from './helpers/versions';
import { createGithubRelease as createGithubReleaseStep } from './helpers/createGithubRelease';
import { cancelCurrentRuns } from './helpers/cancelCurrentRuns';

const deployWeb: Job = {
  name: 'Deploy Web to dev.lyricistant.app',
  'runs-on': 'ubuntu-20.04',
  needs: cancelCurrentRuns,
  steps: [
    ...basicSetup(),
    {
      name: 'Build Web',
      run: gulp('buildWeb'),
      env: {
        NIGHTLY: true,
      },
    },
    deployWebStep('dev.lyricistant.app'),
  ],
};

const buildIOSApp: Job = {
  name: 'Build iOS',
  'runs-on': 'macos-10.15',
  needs: cancelCurrentRuns,
  steps: [
    ...basicSetup({ forMobileBuilds: true }),
    {
      name: 'Bundle Mobile',
      run: gulp('bundleIOS'),
      env: {
        NIGHTLY: true,
      },
    },
    {
      name: 'Build iOS',
      run: 'bundle exec fastlane ios release',
      env: {
        FASTLANE_USER: '${{ secrets.APPLE_ID }}',
        FASTLANE_PASSWORD: '${{ secrets.APPLE_ID_PASSWORD }}',
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
        name: 'ios-app',
        path: 'apps/mobile/dist/ios/*.ipa',
      },
    },
  ],
};

const buildAndroidApp: Job = {
  name: 'Build Android',
  'runs-on': 'ubuntu-20.04',
  needs: cancelCurrentRuns,
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
        NIGHTLY: true,
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
        name: 'android-app',
        path: 'apps/mobile/dist/android/*.apk',
      },
    },
  ],
};

const buildElectronApps: Job = {
  name: 'Build Electron Apps',
  'runs-on': 'macos-10.15',
  needs: cancelCurrentRuns,
  steps: [
    ...basicSetup(),
    {
      name: 'Build Electron apps',
      uses: RETRY,
      env: {
        CSC_LINK: '${{ secrets.MACOS_CERT }}',
        CSC_KEY_PASSWORD: '${{ secrets.MACOS_CERT_PASSWORD }}',
        APPLE_ID: '${{ secrets.APPLE_ID }}',
        APPLE_ID_PASSWORD: '${{ secrets.APPLE_ID_PASSWORD }}',
        NIGHTLY: true,
      },
      with: {
        timeout_minutes: 20,
        max_attempts: 3,
        command: gulp('buildAllElectronApps'),
      },
    },
    {
      name: 'Upload Electron apps',
      uses: UPLOAD_ARTIFACT,
      with: {
        name: 'electron-apps',
        path: 'apps/electron/dist/production/app/*.*',
      },
    },
  ],
};

const createGithubRelease: Job = {
  name: 'Create Github Nightly Release',
  'runs-on': 'ubuntu-20.04',
  needs: [buildIOSApp, buildElectronApps, buildAndroidApp],
  steps: [
    {
      name: 'Download iOS app',
      uses: DOWNLOAD_ARTIFACT,
      with: {
        name: 'ios-app',
        path: '/tmp/artifacts',
      },
    },
    {
      name: 'Download Electron apps',
      uses: DOWNLOAD_ARTIFACT,
      with: {
        name: 'electron-apps',
        path: '/tmp/artifacts',
      },
    },
    {
      name: 'Download Android app',
      uses: DOWNLOAD_ARTIFACT,
      with: {
        name: 'android-app',
        path: '/tmp/artifacts',
      },
    },
    createGithubReleaseStep({ nightly: true, files: '/tmp/artifacts/*.*' }),
  ],
};
export const nightlyReleases: Workflow = {
  name: 'Nightly Releases',
  on: {
    push: {
      branches: ['main'],
    },
  },
  jobs: {
    cancelCurrentRuns,
    deployWeb,
    buildIOSApp,
    buildAndroidApp,
    buildElectronApps,
    createGithubRelease,
  },
};
