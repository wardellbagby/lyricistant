import { basicSetup } from './helpers/basicSetup';
import { cancelCurrentRuns } from './helpers/cancelCurrentRuns';
import { npm } from './helpers/local-tasks';
import { uiTest, unitTest } from './helpers/test';
import { Job, Workflow } from './helpers/Workflow';
import { defaultRunner } from './Runners';

const lint: Job = {
  name: 'Lint',
  'runs-on': defaultRunner,
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
    uiTest: {
      ...uiTest,
      needs: cancelCurrentRuns,
    },
    unitTest: {
      ...unitTest,
      needs: cancelCurrentRuns,
    },
    lint,
  },
};
