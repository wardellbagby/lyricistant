/* tslint:disable:no-console */
import {
  build as electronBuild,
  createTargets,
  Platform,
} from 'electron-builder';
import fs from 'fs';
import path from 'path';

const appsOutputDir = process.argv[2];
const codeSourcesDirectory = process.argv[3];
const shouldSignApps = process.argv[4] === 'release';
const dependenciesDirectory = path.resolve('apps', 'electron');

const wantedArtifacts = [
  /lyricistant-.+\.(AppImage|dmg|deb|exe|blockmap|zip)/,
  /latest.*\.yml/,
];

electronBuild({
  targets: createTargets([Platform.MAC, Platform.LINUX, Platform.WINDOWS]),
  publish: 'never',
  config: {
    appId: 'com.wardellbagby.lyricistant',
    artifactName: '${name}-${os}_${arch}.${ext}',
    directories: {
      output: appsOutputDir,
      buildResources: path.resolve(dependenciesDirectory, 'distResources'),
    },
    extraMetadata: {
      main: 'main.js',
    },
    afterSign: path.resolve(dependenciesDirectory, 'notarize-mac-app.js'),
    files: [
      'package.json',
      '!**/node_modules${/*}',
      {
        from: `${codeSourcesDirectory}`,
        filter: [
          'main.js',
          'preload.js',
          'renderer.js',
          '*.woff2',
          '*.png',
          'index.html',
        ],
      },
      '!*${/*}',
    ],
    mac: {
      category: 'public.app-category.utilities',
      target: ['dmg', 'zip'],
      hardenedRuntime: true,
      gatekeeperAssess: false,
      entitlements: path.resolve(
        dependenciesDirectory,
        'distResources',
        'entitlements.mac.plist'
      ),
      entitlementsInherit: path.resolve(
        dependenciesDirectory,
        'distResources',
        'entitlements.mac.plist'
      ),
      darkModeSupport: true,
      identity: shouldSignApps ? undefined : null,
    },
    linux: {
      target: [
        {
          target: 'AppImage',
          arch: ['x64', 'ia32', 'armv7l', 'arm64'],
        },
      ],
    },
    win: {
      target: [
        {
          target: 'nsis',
          arch: ['x64', 'ia32'],
        },
      ],
    },
    extends: null,
  },
})
  .then((value) => {
    console.log(...value);
  })
  .then(() => {
    fs.readdirSync(appsOutputDir, { withFileTypes: true }).forEach((file) => {
      const fileName = path.resolve(appsOutputDir, file.name);
      if (file.isDirectory()) {
        fs.rmdirSync(`${appsOutputDir}/${file.name}`, { recursive: true });
        return;
      }

      if (!wantedArtifacts.some((regex) => regex.test(file.name))) {
        fs.unlinkSync(fileName);
      }
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
