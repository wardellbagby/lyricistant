/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { getOutputDirectory, Mode } from '@tooling/common-tasks.gulp';
import {
  build as electronBuild,
  createTargets,
  Platform,
} from 'electron-builder';

const wantedArtifacts = [
  /lyricistant-.+\.(AppImage|dmg|exe|blockmap|zip)/,
  /latest.*\.yml/,
];

export const buildElectronApp = async (mode: Mode, currentOnly: boolean) => {
  const appsOutputDir = path.resolve(
    getOutputDirectory(mode, __dirname),
    'app'
  );
  const codeSourcesDirectory = getOutputDirectory(mode, __dirname);
  const shouldSignApps = mode === 'production';
  return electronBuild({
    targets: currentOnly
      ? undefined
      : createTargets([Platform.MAC, Platform.LINUX, Platform.WINDOWS]),
    publish: 'never',
    config: {
      appId: 'com.wardellbagby.lyricistant',
      artifactName: '${name}-${os}_${arch}.${ext}',
      directories: {
        output: appsOutputDir,
        buildResources: path.resolve(__dirname, 'distResources'),
      },
      extraMetadata: {
        main: 'main.js',
      },
      afterSign: require.resolve('./notarize-mac-app.js'),
      fileAssociations: {
        ext: 'lyrics',
        name: 'Lyricistant File',
        role: 'Editor',
        rank: 'Owner',
      },
      files: [
        'package.json',
        '!**/node_modules${/*}',
        {
          from: `${codeSourcesDirectory}`,
          filter: [
            'main.js',
            'preload.js',
            '*.renderer.js',
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
          __dirname,
          'distResources/entitlements.mac.plist'
        ),
        entitlementsInherit: path.resolve(
          __dirname,
          'distResources/entitlements.mac.plist'
        ),
        darkModeSupport: true,
        identity: shouldSignApps ? undefined : null,
      },
      linux: {
        target: [
          {
            target: 'AppImage',
            arch: ['x64', 'arm64'],
          },
        ],
      },
      win: {
        target: [
          {
            target: 'nsis',
            arch: ['x64'],
          },
        ],
      },
      nsis: {
        perMachine: true,
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
};
