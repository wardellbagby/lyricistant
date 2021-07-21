#!/usr/bin/env -S node -r ./register-ts-node
import { spawnSync } from 'child_process';
import inquirer from 'inquirer';

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

  if (appUpdateTypes.length === appUpdateChoices.length) {
    newVersion += `-all`;
  } else {
    appUpdateTypes.forEach((type) => {
      newVersion += `-${type}`;
    });
  }
  const commitMessage = newVersion.substr(1);

  spawnSync('git', ['commit', '--all', '-m', `${commitMessage}`]);
  spawnSync('git', ['tag', '-a', newVersion, '-m', '""']);

  console.log('New version:' + newVersion);
});
