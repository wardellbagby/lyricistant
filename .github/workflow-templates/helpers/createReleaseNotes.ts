import { Step } from './Workflow';

export const createReleaseNotes: Step = {
  name: 'Create release text',
  run: './node_modules/.bin/standard-changelog -i release.txt -r 1',
};
