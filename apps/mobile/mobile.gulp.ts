import { promises as fs } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { merge } from 'webpack-merge';
import { series } from 'gulp';
import rendererWebpackConfig from '@lyricistant/renderer/webpack.config';
import defaultWebpackConfig from '@tooling/default.webpack.config';
import webpack, { Configuration } from 'webpack';

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

const runAndroid = async () => {
  await fs.rmdir(path.resolve(__dirname, 'android'), { recursive: true });
  spawnSync('node_modules/.bin/cap', ['add', 'android'], {
    stdio: 'inherit',
  });
  return spawnSync('node_modules/.bin/cap', ['run', 'android'], {
    stdio: 'inherit',
  });
};

const runIOS = async () => {
  await fs.rmdir(path.resolve(__dirname, 'ios'), { recursive: true });
  spawnSync('node_modules/.bin/cap', ['add', 'ios'], {
    stdio: 'inherit',
  });
  return spawnSync('node_modules/.bin/cap', ['run', 'ios'], {
    stdio: 'inherit',
  });
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
