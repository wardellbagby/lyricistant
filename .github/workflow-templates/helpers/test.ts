import { Job } from './Workflow';
import { basicSetup } from './basicSetup';
import { gulp } from './local-tasks';
import { UPLOAD_ARTIFACT } from './versions';

export const test: Job = {
  name: 'Test',
  'runs-on': 'ubuntu-20.04',
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