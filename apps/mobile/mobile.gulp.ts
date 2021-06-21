import { promises as fs } from 'fs';
import path from 'path';
import { merge } from 'webpack-merge';
import { series } from 'gulp';
import rendererWebpackConfig from '@lyricistant/renderer/webpack.config';
import defaultWebpackConfig from '@tooling/default.webpack.config';
import webpack, { Configuration } from 'webpack';
import { spawn } from '@tooling/common-tasks.gulp';
import del from 'del';

type CapacitorCommand = 'add' | 'run' | 'sync' | 'open';
type CapacitorPlatform = 'android' | 'ios';

const outputDir = path.resolve(__dirname, 'dist');

const cleanMobile = async () => {
  await del(outputDir);
};

const createWebpackConfig = async () =>
  merge<Configuration>(
    {
      mode: 'production',
      entry: ['./apps/mobile/main/index.ts'],
      output: {
        filename: 'renderer.js',
        path: outputDir,
      },
      devtool: 'inline-source-map',
    },
    rendererWebpackConfig(),
    defaultWebpackConfig('development')
  );

const copyMobileHtmlFile = async () => {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.copyFile(
    path.resolve('packages/renderer/main/index.html'),
    path.resolve(outputDir, 'index.html')
  );
};

const bundleMobile = async () => {
  const config = await createWebpackConfig();
  return new Promise<undefined>((resolve, reject) => {
    webpack(config, (error, stats) => {
      if (error) {
        reject(error);
      }
      if (stats.hasErrors()) {
        reject(stats.toString());
      }
      resolve(undefined);
    });
  });
};

const capacitor = (
  command: CapacitorCommand,
  platform: CapacitorPlatform
) => () => spawn('node_modules/.bin/cap', [command, platform]);

const runAndroid = series(
  capacitor('sync', 'android'),
  capacitor('run', 'android')
);

const runIOS = series(capacitor('sync', 'ios'), capacitor('run', 'ios'));

const buildAndroidApp = series(
  () =>
    spawn('./gradlew', [':clean'], {
      cwd: path.resolve('apps/mobile/android'),
    }),
  () =>
    spawn('./gradlew', [':app:assembleRelease'], {
      cwd: path.resolve('apps/mobile/android'),
    }),
  async () => {
    const androidDist = path.resolve('apps/mobile/android/dist');
    await del(androidDist);
    await fs.mkdir(androidDist);
    await fs.copyFile(
      path.resolve(
        'apps/mobile/android/app/build/outputs/apk/release/app-release.apk'
      ),
      path.resolve(androidDist, 'lyricistant.apk')
    );
  }
);

const buildIOSApp = series(
  async () => {
    await del(path.resolve('apps/mobile/ios/build/'));
    await del(path.resolve('apps/mobile/ios/dist/'));
  },
  () =>
    spawn('xcodebuild', [
      '-workspace',
      path.resolve('apps/mobile/ios/App/App.xcworkspace'),
      '-scheme',
      'App',
      '-configuration',
      'Release',
      '-archivePath',
      path.resolve('apps/mobile/ios/build/lyricistant.xcarchive'),
      'archive',
    ]),
  () =>
    spawn('xcodebuild', [
      '-exportArchive',
      '-archivePath',
      path.resolve('apps/mobile/ios/build/lyricistant.xcarchive'),
      '-exportPath',
      path.resolve('apps/mobile/ios/dist'),
      '-exportOptionsPlist',
      path.resolve('apps/mobile/ios/export.plist'),
    ])
);

export const startAndroid = series(
  cleanMobile,
  copyMobileHtmlFile,
  bundleMobile,
  runAndroid
);
export const startIOS = series(
  cleanMobile,
  copyMobileHtmlFile,
  bundleMobile,
  runIOS
);

export const buildAndroid = series(
  cleanMobile,
  copyMobileHtmlFile,
  bundleMobile,
  capacitor('sync', 'android'),
  buildAndroidApp
);

export const buildIOS = series(
  cleanMobile,
  copyMobileHtmlFile,
  bundleMobile,
  capacitor('sync', 'ios'),
  buildIOSApp
);

export const openAndroid = async () => {
  capacitor('sync', 'android');
  capacitor('open', 'android');
};
export const openIOS = async () => {
  capacitor('sync', 'ios');
  capacitor('open', 'ios');
};
