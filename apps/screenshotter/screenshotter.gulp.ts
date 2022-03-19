import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import rendererWebpackConfig from '@lyricistant/renderer/webpack.config';
import {
  getOutputDirectory as getOutDir,
  mocha,
} from '@tooling/common-tasks.gulp';
import defaultWebpackConfig from '@tooling/default.webpack.config';
import del from 'del';
import { glob } from 'glob';
import { series } from 'gulp';
import { Configuration, webpack } from 'webpack';
import { merge } from 'webpack-merge';

const outputDir = getOutDir('development', __dirname);

const cleanScreenshotter = async () => {
  await del(outputDir);
  await del(path.resolve(__dirname, 'runner', 'dist'));
};

const createWebpackConfig = async () =>
  merge<Configuration>(
    {
      mode: 'development',
      entry: {
        renderer: './apps/screenshotter/main/index.ts',
      },
      output: {
        path: outputDir,
      },
    },
    rendererWebpackConfig(),
    defaultWebpackConfig('production', 'Screenshotter')
  );

const bundleScreenshotter = async () => {
  const config = await createWebpackConfig();
  return new Promise<undefined>((resolve, reject) => {
    webpack(config, (error, stats) => {
      if (error) {
        reject(error);
      }
      if (stats?.hasErrors()) {
        reject(stats.toString());
      }
      resolve(undefined);
    });
  });
};

const copyResources = async () => {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.copyFile(
    path.resolve('packages/renderer/main/index.html'),
    path.resolve(outputDir, 'index.html')
  );
};

export const buildScreenshotter = series(
  cleanScreenshotter,
  copyResources,
  bundleScreenshotter
);

const exportScreenshots = async () => {
  const images = await promisify(glob)('apps/screenshotter/runner/dist/*.png');

  const androidImageDir = path.resolve(
    'fastlane',
    'metadata',
    'android',
    'en-US',
    'images'
  );
  const androidPhoneDir = path.resolve(androidImageDir, 'phoneScreenshots');
  const androidTabletDir = path.resolve(androidImageDir, 'tenInchScreenshots');

  const iosImageDir = path.resolve('fastlane', 'screenshots', 'en-US');

  await fs.rmdir(androidPhoneDir, { recursive: true });
  await fs.rmdir(androidTabletDir, { recursive: true });
  await fs.rmdir(iosImageDir, { recursive: true });

  for (const image of images) {
    const [index, device] = path.basename(image, '.png').split('-');

    let location: string;

    if (device.toLowerCase().includes('android')) {
      if (device.toLowerCase().includes('phone')) {
        location = path.resolve(androidPhoneDir, `${index}_en-US.png`);
      } else {
        location = path.resolve(androidTabletDir, `${index}_en-US.png`);
      }
    } else if (device.toLowerCase().includes('electron')) {
      if (index === '2') {
        location = path.resolve('lyricistant.png');
      } else {
        continue;
      }
    } else {
      location = path.resolve(iosImageDir, `${index} - ${device}.png`);
    }

    console.log(`Moving "${image} to "${location}"`);
    await fs.mkdir(path.dirname(location), { recursive: true });
    await fs.copyFile(image, location);
  }
};

export const refreshScreenshots = series(
  buildScreenshotter,
  () => mocha('apps/screenshotter/runner/runner.ts', { bail: true }),
  exportScreenshots
);
