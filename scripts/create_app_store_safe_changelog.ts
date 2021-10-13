#!/usr/bin/env -S node -r ./register-ts-node

import fs from 'fs';
import path from 'path';

const app = process.argv[2] ?? process.exit(1);
const output = process.argv[3] ?? process.exit(1);

const appScopes = ['android', 'electron', 'web', 'ios', 'all'];

const file = fs.readFileSync(
  path.resolve(__dirname, '../CHANGELOG.md'),
  'utf8'
);

const getReleaseNotesFromChangelog = (start = 0): [string, number] => {
  // Only generate for the latest release. Releases start with ## [version]
  let end = file.indexOf('## [', start + 1);
  if (end === -1) {
    end = file.length;
  }

  const changelog = file
    .slice(start, end)
    .split('\n')
    .map((line) => {
      // Remove line that adds the version and a link to it.
      if (line.startsWith('## ') || line.trim().length === 0) {
        return null;
      }
      // Section headers start with this; remove the markdown but keep the title
      if (line.startsWith('###')) {
        return '\n' + line.substring(3).trim() + '\n';
      }
      // Remove any lines that reference other apps.
      if (app !== 'all') {
        for (const scope of appScopes) {
          if (scope !== 'all' && app !== scope && line.includes(scope)) {
            return null;
          }
        }
      }
      return (
        line
          // Remove references to the current app but keep the line.
          .replace(`**${app}:** `, '')
          // Remove the markdown for scopes and convert to a hyphen-delineated list.
          .replace(/\* \*\*(.+):\*\* (.+$)/, '- $1: $2')
          // Replace any non-scoped markdowns and convert to hyphen-delineated list.
          .replace(/\* /, '- ')
          // Remove the commit URLs.
          .replace(
            /\(\[.+\]\(https:\/\/github.com\/wardellbagby\/lyricistant\/commit\/.+\)\)/gm,
            ''
          )
      );
    })
    // Filter out any null or empty lines.
    .filter((line) => line && line.length > 0)
    // Check if the last line is a section header with no commits under it now.
    // If so, remove it.
    .map((line, index, lines) => {
      if (index === lines.length - 1 && !line.startsWith('-')) {
        return null;
      } else {
        return line;
      }
    })
    // Filter again since we could've just added a new empty line.
    .filter((line) => line)
    .join('\n')
    .trim();

  return [changelog, end];
};

const findValidReleaseNotes = () => {
  let end = 0;
  let mobileChangelog = '';
  do {
    [mobileChangelog, end] = getReleaseNotesFromChangelog(end);
  } while (mobileChangelog.length === 0 && end < file.length);

  if (mobileChangelog.length === 0) {
    return null;
  }
  return mobileChangelog;
};

const releaseNotes = findValidReleaseNotes() ?? 'Bug fixes and improvements!';
fs.writeFileSync(output, releaseNotes);

console.log(`Release notes for ${app}:`);
console.log();
console.log(releaseNotes);
