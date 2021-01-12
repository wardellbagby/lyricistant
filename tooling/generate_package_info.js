const { writeFileSync, readFileSync } = require('fs');
const packageInfo = require('../package.json');
const path = require('path');

const outputFile = process.argv[2];
const stableStatusFile = process.argv[3];
const isNightly = process.argv[4] === 'nightly';

const latestCommitHash = () => {
  return readFileSync(stableStatusFile)
    .toString()
    .split('\n')
    .find((line) => line.startsWith('STABLE_GIT_COMMIT'))
    .split(' ')[1]
    .substr(0, 8);
};

const newVersion = isNightly
  ? `${packageInfo.version}-nightly+${latestCommitHash()}`
  : packageInfo.version;

console.log(`Setting version to: ${newVersion}`);

writeFileSync(
  path.resolve(outputFile),
  JSON.stringify(
    {
      name: packageInfo.name,
      version: newVersion,
      author: packageInfo.author,
      homepage: packageInfo.homepage
    },
    null,
    2
  )
);

console.log('Version updated successfully.');
