import { basicSetup } from './helpers/basicSetup';
import { cancelCurrentRuns } from './helpers/cancelCurrentRuns';
import { npm } from './helpers/local-tasks';
import { test } from './helpers/test';
import { Job, Workflow } from './helpers/Workflow';

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
    test: {
      ...test,
      needs: cancelCurrentRuns,
    },
    lint,
  },
};
