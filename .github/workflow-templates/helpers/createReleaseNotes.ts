import { Step } from './Workflow';

export const createReleaseNotes: Step = {
  name: 'Create full release notes',
  run: 'npx standard-changelog -i release.txt -r 1',
};
