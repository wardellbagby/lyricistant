import { Workflow } from './helpers/Workflow';
import { cancelCurrentRuns } from './helpers/cancelCurrentRuns';
import { CACHE, CHECKOUT, SETUP_NODE } from './helpers/versions';

export const generatePronunciations: Workflow = {
  name: 'Regenerate Pronunciations',
  on: {
    push: {
      branches: ['main'],
      paths: ['tooling/additional_pronounciations.dict'],
    },
    schedule: [
      {
        cron: '0 0 */14 * *',
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
        {
          name: 'Checkout the current branch',
          uses: CHECKOUT,
          with: {
            'fetch-depth': 0,
            token: '${{ secrets.LYRICISTANT_TOKEN }}',
          },
        },
        {
          name: 'Setup Node.js - 15.x.x',
          uses: SETUP_NODE,
          with: {
            'node-version': '>=15.10',
            cache: 'npm',
          },
        },
        {
          uses: CACHE,
          name: 'Cache Node Modules',
          with: {
            path: '~/.npm',
            key: "${{ runner.os}}-node-${{ hashFiles('**/package-lock.json') }}",
            'restore-keys': '${{ runner.os }}-node-',
          },
        },
        {
          name: 'Install Node modules',
          run: 'npm ci',
        },
        {
          name: 'Setup Git author',
          run: "git config --local user.name 'github-actions' && git config --local user.email '41898282+github-actions[bot]@users.noreply.github.com'",
        },
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
