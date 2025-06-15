#!/usr/bin/env -S node -r ./register-ts-node
import { spawnSync, SpawnSyncReturns } from 'child_process';
import fs from 'fs';
import inquirer from 'inquirer';
import { DateTime } from 'luxon';
import { SemVer } from 'semver';

const requireSuccessful = <
  ResultT extends boolean | SpawnSyncReturns<T>,
  T = string | Buffer,
>(
  result: ResultT,
  onFailure: (result?: SpawnSyncReturns<T>) => void,
): ResultT => {
  if (typeof result === 'boolean') {
    if (result) {
      return result;
    }
    onFailure();
    process.exit(1);
  }

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

  return result;
};
const updateChangelog = () => {
  console.log('Updating changelog...');
  requireSuccessful(spawnSync('./node_modules/.bin/standard-changelog'), () => {
    console.error('Failed to create changelog');
  });
};

const refreshScreenshots = () => {
  console.log('Updating screenshots...(this can take a long while!)');
  requireSuccessful(spawnSync('gulp', ['refreshScreenshots']), () => {
    console.error('Failed to create screenshots');
  });
};

const updateMobileAppVersions = (version: string) => {
  console.log('Updating Android and iOS versions...');
  requireSuccessful(
    spawnSync('xcrun agvtool next-version -all', {
      cwd: 'apps/mobile/ios/App',
      shell: true,
    }),
    () => {
      console.error('Failed to update iOS build number');
    },
  );
  requireSuccessful(
    spawnSync(`xcrun agvtool new-marketing-version ${version}`, {
      cwd: 'apps/mobile/ios/App',
      shell: true,
    }),
    () => {
      console.error('Failed to update iOS version string');
    },
  );

  fs.writeFileSync(
    'fastlane/metadata/ios/copyright.txt',
    `${DateTime.local().year} Wardell Bagby`,
  );

  const androidVersions = fs
    .readFileSync('apps/mobile/android/app/versions.properties', 'utf8')
    .split('\n');
  const versionCode =
    Number(
      androidVersions
        .find((line) => line.startsWith('versionCode='))
        .split('=')[1],
    ) + 1;

  fs.writeFileSync(
    'apps/mobile/android/app/versions.properties',
    `versionCode=${versionCode}\nversionName=${version}`,
  );
};

type VersionBump = 'major' | 'minor' | 'patch';
interface BumpChoice {
  name: string;
  value: VersionBump;
}
const versionBumpChoices: BumpChoice[] = [
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
    name: 'screenshots',
    message: 'Refresh screenshots?',
    default: true,
  },
  {
    type: 'confirm',
    name: 'push',
    message: 'Push the new version now?',
  },
];

const commit = (message: string) => {
  console.log('Making new release commit...');
  requireSuccessful(
    spawnSync('git', ['commit', '--all', '-m', message]),
    () => {
      console.error('Failed to create commit');
    },
  );
};

const runPrePushChecks = () => {
  console.log('Running pre-push checks...');
  requireSuccessful(spawnSync('git', ['diff', '--exit-code']), () => {
    console.error('Quitting: there are uncommitted changes!');
  });
  requireSuccessful(spawnSync('git', ['push', '--dry-run']), () => {
    console.error('Lint failures');
  });
};

const checkForExistingGitTagsForVersion = (version: string) => {
  console.log(`Checking for existing Git tags for version ${version}...`);
  const localTags = requireSuccessful(
    spawnSync('git', ['tag', '--list', `v${version}*`]),
    () => console.error('Failed to list local git tags'),
  )
    .stdout.toString()
    .trim();
  const remoteTags = requireSuccessful(
    spawnSync('git', ['ls-remote', '--tags', '--exit-code', '--refs']),
    () => console.error('Failed to list local git tags'),
  )
    .stdout.toString()
    .trim()
    .split('\n')
    .map((line) => line.split(/\s/)[1].replace('refs/tags/', ''))
    .filter((remoteTag) => remoteTag.includes(`v${version}`));

  requireSuccessful(localTags.length === 0, () =>
    console.error(
      `Error: Found existing local tag for new version ${version}: \n${localTags}`,
    ),
  );
  requireSuccessful(remoteTags.length === 0, () =>
    console.error(
      `Error: Found existing remote tag for new version ${version}: \n${remoteTags}`,
    ),
  );
};

const getNewVersion = (currentVersion: string, bumpType: VersionBump): string =>
  new SemVer(currentVersion, { loose: true }).inc(bumpType).version;

inquirer.prompt(questions).then(async (answers) => {
  const versionBumpType: VersionBump = answers['version'];
  const appUpdateTypes: string[] = answers['apps'];

  const currentVersion = JSON.parse(
    requireSuccessful(spawnSync('npm', ['pkg', 'get', 'version']), () =>
      console.error(
        'Failed to fetch current app version from NPM. Is the NPM cli available?',
      ),
    )
      .stdout.toString()
      .trim(),
  );

  const newVersion = getNewVersion(currentVersion, versionBumpType);
  let gitTag = `v${newVersion}`;
  if (appUpdateTypes.length !== appUpdateChoices.length) {
    gitTag += `+${appUpdateTypes.join('.')}`;
  }

  console.log(`New version will be: ${newVersion}`);
  console.log(`New Git tag will be: ${gitTag}`);

  checkForExistingGitTagsForVersion(newVersion);
  console.log(`No existing Git tags found.`);

  runPrePushChecks();
  console.log(`Pre-push checks passed successfully.`);

  if (answers['screenshots']) {
    refreshScreenshots();
    console.log(`Screenshots updated!`);
  }

  console.log('Updating package.json with new version');
  const setNpmVersion = spawnSync('npm', [
    'version',
    newVersion,
    '--git-tag-version=false',
  ])
    .stdout.toString()
    .trim()
    .substring(1);

  requireSuccessful(setNpmVersion === newVersion, () => {
    console.error(
      `Expected ${setNpmVersion} to equal ${newVersion}; Did NPM set a bad version?`,
    );
  });
  console.log('Set new version in package.json');

  const commitMessage = gitTag.substring(1);

  updateChangelog();
  updateMobileAppVersions(newVersion);

  commit(commitMessage);

  console.log('Making new Git tag...');
  requireSuccessful(spawnSync('git', ['tag', '-a', gitTag, '-m', '""']), () => {
    console.error('Failed to create tag', gitTag);
  });

  if (answers['push']) {
    console.log('Pushing changes now...');
    requireSuccessful(
      spawnSync('git', ['push', '--follow-tags'], {
        stdio: 'inherit',
      }),
      () => {
        console.error('Failed to push tags');
      },
    );
  } else {
    console.log('Run "git push --follow-tags" to push changes manually.');
  }
  console.log('Completed successfully!');
});
