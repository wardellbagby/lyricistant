import { Job, Step, Workflow } from './helpers/Workflow';
import { test } from './helpers/test';
import {
  buildIOSApp as buildIOSAppJob,
  downloadIOSApp,
} from './helpers/buildIOSApp';
import {
  downloadAndroidApp,
  buildAndroidApp as buildAndroidAppJob,
} from './helpers/buildAndroidApp';
import {
  downloadElectronApps,
  buildElectronApps as buildElectronAppsJob,
} from './helpers/buildElectronApps';
import { createGithubReleaseAlt as createGithubReleaseStep } from './helpers/createGithubRelease';
import { basicSetup } from './helpers/basicSetup';
import { gulp } from './helpers/local-tasks';
import { deployWeb as deployWebStep } from './helpers/deployWeb';
import { CHECKOUT } from './helpers/versions';

const tagMatches = (platform: 'ios' | 'android' | 'electron' | 'web') =>
  `\${{ contains(github.ref, '${platform}') ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((num) => `|| endsWith(github.ref, '${num}')`)
    .join(' ')} }}`;

const deployWeb: Job = {
  name: 'Deploy Web to lyricistant.app',
  'runs-on': 'ubuntu-20.04',
  needs: test,
  if: tagMatches('web'),
  steps: [
    ...basicSetup(),
    {
      name: 'Build Web',
      run: gulp('buildWeb'),
    },
    deployWebStep('lyricistant.app'),
  ],
};
const buildIOSApp: Job = {
  ...buildIOSAppJob(),
  needs: test,
  if: tagMatches('ios'),
};
const buildAndroidApp: Job = {
  ...buildAndroidAppJob(),
  needs: test,
  if: tagMatches('android'),
};
const buildElectronApps: Job = {
  ...buildElectronAppsJob(),
  needs: test,
  if: tagMatches('electron'),
};
const createGithubRelease: Job = {
  name: 'Create Github Release',
  'runs-on': 'ubuntu-20.04',
  if: 'always()',
  needs: [buildIOSApp, buildElectronApps, buildAndroidApp],
  steps: [
    {
      name: 'Checkout the current branch',
      uses: CHECKOUT,
      with: {
        'fetch-depth': 0,
      },
    } as Step,
    {
      name: 'Create Github release notes',
      run: 'npx conventional-changelog-cli -p angular -r 2 -o release.txt',
    },
    {
      ...downloadIOSApp({ path: '/tmp/artifacts' }),
      if: "needs.buildIOSApp.result == 'success'",
    },
    {
      ...downloadElectronApps({ path: '/tmp/artifacts' }),
      if: "needs.buildElectronApps.result == 'success'",
    },
    {
      ...downloadAndroidApp({ path: '/tmp/artifacts' }),
      if: "needs.buildAndroidApp.result == 'success'",
    },
    {
      ...createGithubReleaseStep({
        files: '/tmp/artifacts/*.*',
        bodyPath: 'release.txt',
      }),
      if:
        "${{ needs.buildIOSApp.result == 'success' || " +
        "needs.buildElectronApps.result == 'success' || " +
        "needs.buildAndroidApp.result == 'success' }}",
    },
  ],
};

export const productionReleases: Workflow = {
  name: 'Production Releases',
  on: {
    push: {
      tags: ['v*'],
    },
  },
  jobs: {
    test,
    deployWeb,
    buildIOSApp,
    buildAndroidApp,
    buildElectronApps,
    createGithubRelease,
  },
};
