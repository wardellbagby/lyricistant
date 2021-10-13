import { promises as fs } from 'fs';
import path from 'path';
import { merge } from 'webpack-merge';
import { parallel, series } from 'gulp';
import rendererWebpackConfig from '@lyricistant/renderer/webpack.config';
import defaultWebpackConfig from '@tooling/default.webpack.config';
import webpack, { Configuration } from 'webpack';
import { cleanBuildDirectory, Mode, spawn } from '@tooling/common-tasks.gulp';
import del from 'del';
import WebpackDevServer from 'webpack-dev-server';

type CapacitorCommand = 'add' | 'run' | 'sync' | 'open';
type CapacitorPlatform = 'android' | 'ios';

const outputDir = path.resolve(__dirname, 'dist');

const cleanMobile = async () => {
  await del(outputDir);
};

const createWebpackConfig = async (mode: Mode) =>
  merge<Configuration>(
    {
      entry: {
        renderer: './apps/mobile/main/index.ts',
      },
      output: {
        path: outputDir,
      },
      devtool: 'inline-source-map',
    },
    rendererWebpackConfig(),
    defaultWebpackConfig(mode)
  );

const copyMobileHtmlFile = async () => {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.copyFile(
    path.resolve('packages/renderer/main/index.html'),
    path.resolve(outputDir, 'index.html')
  );
};

const bundleMobile = async () => {
  const config = await createWebpackConfig('production');
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

const runWebServer = async () => {
  const config = await createWebpackConfig('development');

  const server = new WebpackDevServer(
    {
      port: 8080,
      hot: true,
      static: config.output.path,
    },
    webpack(config)
  );
  return server.start();
};

const cap =
  (
    command: CapacitorCommand,
    platform: CapacitorPlatform,
    options?: { development?: boolean }
  ) =>
  () =>
    spawn('node_modules/.bin/cap', [command, platform], {
      env: {
        ...process.env,
        NODE_ENV: options?.development ? 'development' : 'production',
      },
    });

const runIOS = cap('run', 'ios', { development: true });
const runAndroid = cap('run', 'android', { development: true });

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

export const bundleAndroid = series(
  cleanBuildDirectory,
  cleanMobile,
  copyMobileHtmlFile,
  bundleMobile,
  cap('sync', 'android')
);
export const bundleIOS = series(
  cleanBuildDirectory,
  cleanMobile,
  copyMobileHtmlFile,
  bundleMobile,
  cap('sync', 'ios')
);

export const startAndroid = series(
  cleanMobile,
  copyMobileHtmlFile,
  parallel(runWebServer, runAndroid)
);
export const startIOS = series(
  cleanMobile,
  copyMobileHtmlFile,
  parallel(runWebServer, runIOS)
);

export const buildAndroid = series(bundleAndroid, buildAndroidApp);
export const buildIOS = series(bundleIOS, buildIOSApp);
