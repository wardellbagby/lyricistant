/* tslint:disable:no-console no-var-requires */
const fs = require('fs');

const devRunnerFile = 'node_modules/electron-webpack/out/dev/dev-runner.js';
const find = 'args.push(path.join(projectDir, "dist/main/main.js"));';
const replacement =
  'args.push(path.join(projectDir, "dist/electron/main/main.js"));';

try {
  const fileText = fs.readFileSync(devRunnerFile, 'utf8');
  if (fileText.includes(find)) {
    console.log('Lyricistant - Dev Runner is hardcoded to wrong value.');
    fs.writeFileSync(devRunnerFile, fileText.replace(find, replacement));
    console.log('Lyricistant - Fixed Dev Runner for electron-webpack!');
  } else {
    console.log(
      'Lyricistant - electron-webpack does not need the fix. Skipping...'
    );
  }
} catch (exception) {
  console.log(exception);
}

console.log();
