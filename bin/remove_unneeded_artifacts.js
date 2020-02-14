const fs = require('fs');
const packageInfo = require('../package.json');

const distDirectory = packageInfo['build']['directories']['output'];

const artifactFiles = fs.readdirSync(distDirectory, { withFileTypes: true });
artifactFiles.forEach((file) => {
  if (file.isDirectory()) {
    console.log(`Removing directory ${distDirectory}/${file.name}...`);
    fs.rmdirSync(
      `${distDirectory}/${file.name}`,
      { recursive: true },
      () => undefined
    );
    return;
  }

  if (
    !file.name.endsWith('AppImage') &&
    !file.name.endsWith('dmg') &&
    !file.name.endsWith('deb') &&
    !file.name.endsWith('exe')
  ) {
    const fileName = `${distDirectory}/${file.name}`;
    console.log(`Removing file ${fileName}...`);
    fs.unlinkSync(fileName, () => undefined);
  }
});

const remainingFiles = fs
  .readdirSync(distDirectory)
  .join('\n');
console.log();
console.log(`Artifacts left in ${distDirectory}:\n${remainingFiles}`);
