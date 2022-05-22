import { defaultRunner } from '../Runners';
import { basicSetup } from './basicSetup';
import { gulp } from './local-tasks';
import { UPLOAD_ARTIFACT } from './versions';
import { Job } from './Workflow';

export const test: Job = {
  name: 'Test',
  'runs-on': defaultRunner,
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
