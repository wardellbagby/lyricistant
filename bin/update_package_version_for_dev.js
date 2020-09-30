const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const packageInfo = require('../package.json');
const path = require('path');

const latestCommitHash = () => {
  return execSync('git rev-parse --short HEAD').toString().trim();
};

const newVersion = `${packageInfo.version}-nightly+${latestCommitHash()}`;

console.log(`Setting version to: ${newVersion}`);

writeFileSync(
  path.resolve('package.json'),
  JSON.stringify(
    {
      ...packageInfo,
      version: newVersion,
    },
    null,
    2
  )
);

console.log('Version updated successfully.');
