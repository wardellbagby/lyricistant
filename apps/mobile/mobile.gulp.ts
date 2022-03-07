import { promises as fs } from 'fs';
import path from 'path';
import rendererWebpackConfig from '@lyricistant/renderer/webpack.config';
import { cleanBuildDirectory, Mode, spawn } from '@tooling/common-tasks.gulp';
import defaultWebpackConfig, {
  Platform,
} from '@tooling/default.webpack.config';
import del from 'del';
import { parallel, series } from 'gulp';
import webpack, { Configuration } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { merge } from 'webpack-merge';

type CapacitorCommand = 'add' | 'run' | 'sync' | 'open';
type CapacitorPlatform = 'android' | 'ios';

const outputDir = path.resolve(__dirname, 'dist');

const cleanMobile = async () => {
  await del(outputDir);
};

const createWebpackConfig = async (mode: Mode, platform: Platform) =>
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
    defaultWebpackConfig(mode, platform)
  );

const copyMobileHtmlFile = async () => {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.copyFile(
    path.resolve('packages/renderer/main/index.html'),
    path.resolve(outputDir, 'index.html')
  );
};

const bundleMobile = (platform: Platform) => async () => {
  const config = await createWebpackConfig('production', platform);

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

const runWebServer = (platform: Platform) => async () => {
  const config = await createWebpackConfig('development', platform);

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
      // Says its unsigned, but it isn't; Gradle names it that because signing configs are created after evaluation.
      path.resolve(
        'apps/mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk'
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
  bundleMobile('Android'),
  cap('sync', 'android')
);
export const bundleIOS = series(
  cleanBuildDirectory,
  cleanMobile,
  copyMobileHtmlFile,
  bundleMobile('iOS'),
  cap('sync', 'ios')
);

export const startAndroid = series(
  cleanMobile,
  copyMobileHtmlFile,
  parallel(runWebServer('Android'), runAndroid)
);
export const startIOS = series(
  cleanMobile,
  copyMobileHtmlFile,
  parallel(runWebServer('Android'), runIOS)
);

export const buildAndroid = series(bundleAndroid, buildAndroidApp);
export const buildIOS = series(bundleIOS, buildIOSApp);
