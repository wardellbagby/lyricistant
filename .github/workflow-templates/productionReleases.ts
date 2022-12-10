import { basicSetup } from './helpers/basicSetup';
import {
  buildAndroidApp as buildAndroidAppJob,
  downloadAndroidApp,
} from './helpers/buildAndroidApp';
import {
  buildElectronApps as buildElectronAppsJob,
  downloadElectronApps,
} from './helpers/buildElectronApps';
import {
  buildIOSApp as buildIOSAppJob,
  downloadIOSApp,
} from './helpers/buildIOSApp';
import { createGithubRelease as createGithubReleaseStep } from './helpers/createGithubRelease';
import { deployWeb as deployWebStep } from './helpers/deployWeb';
import { gulp } from './helpers/local-tasks';
import { uiTest, unitTest } from './helpers/test';
import { Job, Workflow } from './helpers/Workflow';
import { defaultRunner } from './Runners';

const tagMatches = (platform: 'ios' | 'android' | 'electron' | 'web') =>
  `\${{ contains(github.ref, '${platform}') ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((num) => `|| endsWith(github.ref, '${num}')`)
    .join(' ')} }}`;

const buildAndDeployNeeds = [uiTest, unitTest];

const deployWeb: Job = {
  name: 'Deploy Web to lyricistant.app',
  'runs-on': defaultRunner,
  needs: buildAndDeployNeeds,
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
  needs: buildAndDeployNeeds,
  if: tagMatches('ios'),
};
const buildAndroidApp: Job = {
  ...buildAndroidAppJob(),
  needs: buildAndDeployNeeds,
  if: tagMatches('android'),
};
const buildElectronApps: Job = {
  ...buildElectronAppsJob(),
  needs: buildAndDeployNeeds,
  if: tagMatches('electron'),
};
const createGithubRelease: Job = {
  name: 'Create Github Release',
  'runs-on': defaultRunner,
  if: 'always()',
  needs: [buildIOSApp, buildElectronApps, buildAndroidApp],
  steps: [
    ...basicSetup({ forMobileBuilds: false, forTests: false }),
    {
      name: 'Create Github release notes',
      run: './scripts/create_release_changelog.ts all release.txt',
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
    uiTest,
    unitTest,
    deployWeb,
    buildIOSApp,
    buildAndroidApp,
    buildElectronApps,
    createGithubRelease,
  },
};
