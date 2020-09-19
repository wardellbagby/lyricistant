const fs = require('fs');
const packageInfo = require('../electron-builder.json');

const distDirectory = packageInfo['directories']['output'];
const wantedArtifacts = [
  /lyricistant-.+\.(AppImage|dmg|deb|exe|blockmap|zip)/,
  /latest.*\.yml/
];

const artifactFiles = fs.readdirSync(distDirectory, { withFileTypes: true });
artifactFiles.forEach((file) => {
  if (file.isDirectory()) {
    console.log(`Removing directory ${distDirectory}/${file.name}...`);
    fs.rmdirSync(`${distDirectory}/${file.name}`, { recursive: true });
    return;
  }

  if (!wantedArtifacts.some((regex) => regex.test(file.name))) {
    const fileName = `${distDirectory}/${file.name}`;
    console.log(`Removing file ${fileName}...`);
    fs.unlinkSync(fileName);
  }
});

const remainingFiles = fs.readdirSync(distDirectory).join('\n');
console.log();
console.log(`Artifacts left in ${distDirectory}:\n${remainingFiles}`);
