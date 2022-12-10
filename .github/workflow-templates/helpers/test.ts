import { defaultRunner } from '../Runners';
import { basicSetup } from './basicSetup';
import { gulp } from './local-tasks';
import { UPLOAD_ARTIFACT } from './versions';
import { Job } from './Workflow';

export const uiTest: Job = {
  name: 'UI Tests',
  'runs-on': defaultRunner,
  steps: [
    ...basicSetup({ forTests: true }),
    {
      name: 'Run UI tests',
      run: gulp('uiTests'),
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

export const unitTest: Job = {
  name: 'Unit Tests',
  'runs-on': defaultRunner,
  steps: [
    ...basicSetup({ forTests: true }),
    {
      name: 'Run unit tests',
      run: gulp('unitTests'),
    },
  ],
};
