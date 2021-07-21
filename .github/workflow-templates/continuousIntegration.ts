import { Job, Workflow } from './helpers/Workflow';
import { cancelCurrentRuns } from './helpers/cancelCurrentRuns';
import { basicSetup } from './helpers/basicSetup';
import { gulp, npm } from './helpers/local-tasks';
import { UPLOAD_ARTIFACT } from './helpers/versions';

const lint: Job = {
  name: 'Lint',
  'runs-on': 'ubuntu-20.04',
  needs: cancelCurrentRuns,
  steps: [
    ...basicSetup(),
    {
      name: 'Run Lint',
      run: npm('lint'),
    },
  ],
};
const test: Job = {
  name: 'Test',
  'runs-on': 'ubuntu-20.04',
  needs: cancelCurrentRuns,
  steps: [
    ...basicSetup({ forTests: true }),
    {
      name: 'Run all tests',
      run: gulp('testAll'),
      env: {
        DISPLAY: ':99',
      },
    },
    {
      name: 'Upload build artifacts if failed',
      if: 'failure()',
      uses: UPLOAD_ARTIFACT,
      with: {
        path: ['apps/**/dist/', 'dist/'].join('\n'),
      },
    },
  ],
};
export const continuousIntegration: Workflow = {
  name: 'Continuous Integration',
  on: {
    push: {
      branches: ['main'],
    },
    pull_request: {
      branches: ['main'],
    },
  },
  jobs: {
    cancelCurrentRuns,
    test,
    lint,
  },
};
