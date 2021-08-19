#!/usr/bin/env -S node -r ./register-ts-node
import { spawnSync, SpawnSyncReturns } from 'child_process';
import inquirer from 'inquirer';

const requireSuccessful = <T = string | Buffer>(
  result: SpawnSyncReturns<T>,
  onFailure: (result: SpawnSyncReturns<T>) => void
) => {
  if (result.error || result.status !== 0) {
    console.log(result.stdout.toString());
    console.error(result.stderr.toString());
    onFailure(result);
    process.exit(result.status ?? 1);
  }
};
const updateChangelog = () => {
  requireSuccessful(spawnSync('./node_modules/.bin/standard-changelog'), () => {
    console.error('Failed to create changelog');
  });
};

const versionBumpChoices = [
  { name: 'Major (x.0.0)', value: 'major' },
  { name: 'Minor (1.x.0)', value: 'minor' },
  { name: 'Patch (1.0.x)', value: 'patch' },
];
const appUpdateChoices = [
  { name: 'Web', value: 'web' },
  { name: 'Electron', value: 'electron' },
  { name: 'Android', value: 'android' },
  { name: 'iOS', value: 'ios' },
];
const questions: inquirer.QuestionCollection = [
  {
    type: 'rawlist',
    name: 'version',
    message: 'What type of version update?',
    choices: versionBumpChoices,
    default: versionBumpChoices[2].value,
  },
  {
    type: 'checkbox',
    name: 'apps',
    message: 'Which apps are being updated?',
    choices: appUpdateChoices,
    default: appUpdateChoices.map((it) => it.value),
  },
  {
    type: 'confirm',
    name: 'push',
    message: 'Push the new version now?',
  },
];

inquirer.prompt(questions).then(async (answers) => {
  const versionBumpType: string = answers['version'];
  const appUpdateTypes: string[] = answers['apps'];

  let newVersion = spawnSync('npm', [
    'version',
    versionBumpType,
    '--git-tag-version=false',
  ])
    .stdout.toString()
    .trim();

  if (appUpdateTypes.length !== appUpdateChoices.length) {
    newVersion += `+${appUpdateTypes.join('.')}`;
  }
  const commitMessage = newVersion.substr(1);

  updateChangelog();
  requireSuccessful(
    spawnSync('git', ['commit', '--all', '-m', `${commitMessage}`]),
    () => {
      console.error('Failed to create commit');
    }
  );
  requireSuccessful(
    spawnSync('git', ['tag', '-a', newVersion, '-m', '""']),
    () => {
      console.error('Failed to create tag', newVersion);
    }
  );

  console.log('New version:' + newVersion);
  if (answers['push']) {
    requireSuccessful(spawnSync('git', ['push', '--follow-tags']), () => {
      console.error('Failed to push tags');
    });
  }
});
