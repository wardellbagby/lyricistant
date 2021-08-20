#!/usr/bin/env -S node -r ./register-ts-node

import fs from 'fs';

const changelog = process.argv[2] ?? process.exit(1);
const app = process.argv[3] ?? process.exit(1);
const output = process.argv[4] ?? process.exit(1);

const appScopes = ['android', 'electron', 'web', 'ios'];

const file = fs.readFileSync(changelog, 'utf8');
fs.writeFileSync(
  output,
  file
    .split('\n')
    .map((line) => {
      if (line.startsWith('## ') || line.trim().length === 0) {
        return null;
      }
      if (line.startsWith('###')) {
        return '\n' + line.substring(3).trim() + '\n';
      }
      for (const scope of appScopes) {
        if (app !== scope && line.includes(scope)) {
          return null;
        }
      }
      return line
        .replace(`**${app}:**`, '')
        .replace(
          /\(\[.+\]\(https:\/\/github.com\/wardellbagby\/lyricistant\/commit\/.+\)\)/gm,
          ''
        );
    })
    .filter((line) => line && line.length > 0)
    .join('\n')
    .trim()
);
