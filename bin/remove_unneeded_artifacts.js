const fs = require('fs');
const packageInfo = require('../package.json');

const distDirectory = packageInfo['build']['directories']['output'];

const artifactFiles = fs.readdirSync(distDirectory, { withFileTypes: true });
artifactFiles.forEach((file) => {
  if (file.isDirectory()) {
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
    console.log(`Removing ${fileName}...`);
    fs.unlinkSync(fileName, () => undefined);
  }
});
