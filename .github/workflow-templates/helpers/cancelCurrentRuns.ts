import { defaultRunner } from '../Runners';
import { CANCEL_WORKFLOW } from './versions';
import { Job } from './Workflow';

export const cancelCurrentRuns: Job = {
  name: 'Cancel in-progress Workflow runs',
  'runs-on': defaultRunner,
  steps: [
    {
      name: 'Cancel in-progress Workflow runs',
      uses: CANCEL_WORKFLOW,
      with: {
        access_token: '${{ secrets.GITHUB_TOKEN }}',
      },
    },
  ],
};
