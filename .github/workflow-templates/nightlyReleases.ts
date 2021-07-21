import { Job, Workflow } from './helpers/Workflow';
import { basicSetup } from './helpers/basicSetup';
import { gulp } from './helpers/local-tasks';
import { deployWeb as deployWebStep } from './helpers/deployWeb';
import { createGithubRelease as createGithubReleaseStep } from './helpers/createGithubRelease';
import { cancelCurrentRuns } from './helpers/cancelCurrentRuns';
import {
  buildIOSApp as buildIOSAppJob,
  downloadIOSApp,
} from './helpers/buildIOSApp';
import {
  buildAndroidApp as buildAndroidAppJob,
  downloadAndroidApp,
} from './helpers/buildAndroidApp';
import {
  buildElectronApps as buildElectronAppsJob,
  downloadElectronApps,
} from './helpers/buildElectronApps';

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

const createGithubRelease: Job = {
  name: 'Create Github Nightly Release',
  'runs-on': 'ubuntu-20.04',
  needs: [buildIOSApp, buildElectronApps, buildAndroidApp],
  steps: [
    downloadIOSApp({ path: '/tmp/artifacts' }),
    downloadElectronApps({ path: '/tmp/artifacts' }),
    downloadAndroidApp({ path: '/tmp/artifacts' }),
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
