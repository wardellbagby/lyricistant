import { promises as fs } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { merge } from 'webpack-merge';
import { series } from 'gulp';
import rendererWebpackConfig from '@lyricistant/renderer/webpack.config';
import defaultWebpackConfig from '@tooling/default.webpack.config';
import webpack, { Configuration } from 'webpack';

type CapacitorCommand = 'add' | 'run' | 'sync' | 'open';
type CapacitorPlatform = 'android' | 'ios';

const outputDir = path.resolve(__dirname, 'dist');

const cleanMobile = async () => {
  await fs.rmdir(outputDir, { recursive: true });
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
    },
    rendererWebpackConfig(),
    defaultWebpackConfig('production')
  );

const copyMobileHtmlFile = async () => {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.copyFile(
    'packages/renderer/main/index.html',
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

const capacitor = (command: CapacitorCommand, platform: CapacitorPlatform) =>
  spawnSync('node_modules/.bin/cap', [command, platform], {
    stdio: 'inherit',
  });

const runAndroid = async () => {
  capacitor('sync', 'android');
  capacitor('run', 'android');
};

const runIOS = async () => {
  capacitor('sync', 'ios');
  capacitor('run', 'ios');
};

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
export const buildMobile = series(
  cleanMobile,
  copyMobileHtmlFile,
  bundleMobile
);
export const openAndroid = async () => {
  capacitor('sync', 'android');
  capacitor('open', 'android');
};
export const openIOS = async () => {
  capacitor('sync', 'ios');
  capacitor('open', 'ios');
};
