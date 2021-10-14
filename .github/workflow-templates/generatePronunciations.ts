import { Workflow } from './helpers/Workflow';
import { cancelCurrentRuns } from './helpers/cancelCurrentRuns';
import { basicSetup } from './helpers/basicSetup';

export const generatePronunciations: Workflow = {
  name: 'Regenerate Pronunciations',
  on: {
    push: {
      branches: ['main'],
      paths: ['tooling/additional_pronounciations.dict'],
    },
    schedule: [
      {
        cron: '0 0 * * *',
      },
    ],
    workflow_dispatch: {},
  },
  jobs: {
    cancelCurrentRuns,
    generation: {
      name: 'Generation',
      needs: cancelCurrentRuns,
      'runs-on': 'ubuntu-20.04',
      steps: [
        ...basicSetup(),
        {
          name: 'Generate pronunciations',
          run: 'tooling/create_pronunciations.ts',
        },
        {
          name: 'Create & push changes if there are any',
          run: 'git diff --quiet && git diff --staged --quiet || (git commit --all -m "chore: update pronunciations" && git push)',
        },
      ],
    },
  },
};
