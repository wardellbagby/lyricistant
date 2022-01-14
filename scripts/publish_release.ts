#!/usr/bin/env -S node -r ./register-ts-node
import { spawnSync, SpawnSyncReturns } from 'child_process';
import fs from 'fs';
import inquirer from 'inquirer';

const requireSuccessful = <T = string | Buffer>(
  result: SpawnSyncReturns<T>,
  onFailure: (result: SpawnSyncReturns<T>) => void
) => {
  if (result.error || result.status !== 0) {
    if (result.stdout) {
      console.log(result.stdout.toString());
    }
    if (result.stderr) {
      console.log(result.stderr.toString());
    }
    if (result.error) {
      console.error(result.error.message);
    }
    onFailure(result);
    process.exit(result.status ?? 1);
  }
};
const updateChangelog = () => {
  requireSuccessful(spawnSync('./node_modules/.bin/standard-changelog'), () => {
    console.error('Failed to create changelog');
  });
};

const updateMobileAppVersions = (version: string) => {
  requireSuccessful(
    spawnSync('xcrun agvtool next-version -all', {
      cwd: 'apps/mobile/ios/App',
      shell: true,
    }),
    () => {
      console.error('Failed to update iOS build number');
    }
  );
  requireSuccessful(
    spawnSync(`xcrun agvtool new-marketing-version ${version}`, {
      cwd: 'apps/mobile/ios/App',
      shell: true,
    }),
    () => {
      console.error('Failed to update iOS version string');
    }
  );

  const androidVersions = fs
    .readFileSync('apps/mobile/android/app/versions.properties', 'utf8')
    .split('\n');
  const versionCode =
    Number(
      androidVersions
        .find((line) => line.startsWith('versionCode='))
        .split('=')[1]
    ) + 1;

  fs.writeFileSync(
    'apps/mobile/android/app/versions.properties',
    `versionCode=${versionCode}\nversionName=${version}`
  );
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

console.log('Running pre-push checks...');
requireSuccessful(spawnSync('git', ['push', '--dry-run']), () => {
  console.error('Lint failures');
});
console.log('Pre-push checks are successful!');

inquirer.prompt(questions).then(async (answers) => {
  const versionBumpType: string = answers['version'];
  const appUpdateTypes: string[] = answers['apps'];

  const newVersion = spawnSync('npm', [
    'version',
    versionBumpType,
    '--git-tag-version=false',
  ])
    .stdout.toString()
    .trim()
    .substr(1);

  let gitTag = `v${newVersion}`;
  if (appUpdateTypes.length !== appUpdateChoices.length) {
    gitTag += `+${appUpdateTypes.join('.')}`;
  }
  const commitMessage = gitTag.substr(1);

  console.log('New version: ' + newVersion);
  console.log('New tag: ' + gitTag);

  updateChangelog();
  updateMobileAppVersions(newVersion);
  requireSuccessful(
    spawnSync('git', ['commit', '--all', '-m', `${commitMessage}`]),
    () => {
      console.error('Failed to create commit');
    }
  );
  requireSuccessful(spawnSync('git', ['tag', '-a', gitTag, '-m', '""']), () => {
    console.error('Failed to create tag', gitTag);
  });

  if (answers['push']) {
    requireSuccessful(
      spawnSync('git', ['push', '--follow-tags'], {
        stdio: 'inherit',
      }),
      () => {
        console.error('Failed to push tags');
      }
    );
  }
});
