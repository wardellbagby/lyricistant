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
import { cancelCurrentRuns } from './helpers/cancelCurrentRuns';
import { createGithubRelease as createGithubReleaseStep } from './helpers/createGithubRelease';
import { deployWeb as deployWebStep } from './helpers/deployWeb';
import { gulp } from './helpers/local-tasks';
import { DELETE_TAG_AND_RELEASE } from './helpers/versions';
import { Job, Step, Workflow } from './helpers/Workflow';
import { defaultRunner } from './Runners';

const deployWeb: Job = {
  name: 'Deploy Web to dev.lyricistant.app',
  'runs-on': defaultRunner,
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
  ...buildIOSAppJob({ nightly: true }),
  needs: cancelCurrentRuns,
};

const buildAndroidApp: Job = {
  ...buildAndroidAppJob({ nightly: true }),
  needs: cancelCurrentRuns,
};

const buildElectronApps: Job = {
  ...buildElectronAppsJob({ nightly: true }),
  needs: cancelCurrentRuns,
};

const deleteTagStep: Step = {
  name: 'Delete current nightly tag and release',
  uses: DELETE_TAG_AND_RELEASE,
  with: {
    delete_release: true,
    tag_name: 'latest',
    github_token: '${{ secrets.GITHUB_TOKEN }}',
  },
};

const createGithubRelease: Job = {
  name: 'Create Github Nightly Release',
  'runs-on': defaultRunner,
  needs: [buildIOSApp, buildElectronApps, buildAndroidApp],
  steps: [
    ...basicSetup({ forMobileBuilds: false, forTests: false }),
    {
      name: 'Create Github release notes',
      run: './scripts/create_release_changelog.ts all release.txt unreleased',
    },
    downloadIOSApp({ path: '/tmp/artifacts' }),
    downloadElectronApps({ path: '/tmp/artifacts' }),
    downloadAndroidApp({ path: '/tmp/artifacts' }),
    deleteTagStep,
    {
      name: 'Wait for tag deletion to be propagated',
      run: 'sleep 30s',
    },
    createGithubReleaseStep({
      nightly: true,
      files: '/tmp/artifacts/*.*',
      bodyPath: 'release.txt',
    }),
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
