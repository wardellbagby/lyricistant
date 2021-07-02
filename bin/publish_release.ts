#!/usr/bin/env -S node -r ./register-ts-node
import { spawnSync } from 'child_process';
import inquirer from 'inquirer';

const versionBumpChoices = [
  { label: 'Major (x.0.0)', value: 'major' },
  { label: 'Minor (1.x.0)', value: 'minor' },
  { label: 'Patch (1.0.x)', value: 'patch' },
];
const appUpdateChoices = [
  { label: 'All', value: 'all' },
  { label: 'Web only', value: 'web' },
  { label: 'Electron only', value: 'electron' },
];
const questions = [
  {
    type: 'rawlist',
    name: 'version',
    message: 'What type of version update?',
    choices: versionBumpChoices.map((choice) => choice.label),
    default: versionBumpChoices[2].label,
  },
  {
    type: 'rawlist',
    name: 'apps',
    message: 'Which apps are being updated?',
    choices: appUpdateChoices.map((choice) => choice.label),
    default: appUpdateChoices[0].label,
  },
];

inquirer.prompt(questions).then(async (answers) => {
  const versionBumpType = versionBumpChoices.find(
    (choice) => choice.label === answers['version']
  ).value;
  const appUpdateType = appUpdateChoices.find(
    (choice) => choice.label === answers['apps']
  ).value;

  let newVersion = spawnSync('npm', [
    'version',
    versionBumpType,
    '--git-tag-version=false',
  ])
    .stdout.toString()
    .trim();

  if (appUpdateType !== 'all') {
    newVersion = `${newVersion}-${appUpdateType}`;
  }
  const commitMessage = newVersion.substr(1);

  spawnSync('git', ['commit', '--all', '-m', `${commitMessage}`]);
  spawnSync('git', ['tag', '-a', newVersion, '-m', '""']);

  console.log('New version:' + newVersion);
});
