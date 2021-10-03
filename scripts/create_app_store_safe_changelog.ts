#!/usr/bin/env -S node -r ./register-ts-node

import fs from 'fs';
import path from 'path';

const changelog = path.resolve(__dirname, '../CHANGELOG.md');
const app = process.argv[2] ?? process.exit(1);
const output = process.argv[3] ?? process.exit(1);

const appScopes = ['android', 'electron', 'web', 'ios'];

const file = fs.readFileSync(changelog, 'utf8');

// Only generate for the latest release. Releases start with ## [version]
const start = 0;
const end = file.indexOf('## [', 1);

const releaseNotes = file
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
    for (const scope of appScopes) {
      if (app !== scope && line.includes(scope)) {
        return null;
      }
    }
    return (
      line
        // Remove references to the current app but keep the line.
        .replace(`**${app}:**`, '')
        // Remove the markdown and convert to a hyphen-delineated list.
        .replace(/\* \*\*(.+):\*\* (.+$)/, '- $1: $2')
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

fs.writeFileSync(output, releaseNotes);

console.log(`Release notes for ${app}:`);
console.log();
console.log(releaseNotes);
