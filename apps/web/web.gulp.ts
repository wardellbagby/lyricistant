import { promises as fs } from 'fs';
import path from 'path';
import rendererWebpackConfig from '@lyricistant/renderer/webpack.config';
import {
  cleanBuildDirectory,
  getOutputDirectory as getOutDir,
  Mode,
} from '@tooling/common-tasks.gulp';
import defaultWebpackConfig from '@tooling/default.webpack.config';
import { capitalCase } from 'change-case';
import { deleteAsync as del } from 'del';
import { series } from 'gulp';
import { Configuration, webpack } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { merge } from 'webpack-merge';

const getOutputDirectory = (mode: Mode) => getOutDir(mode, __dirname);

const clean = (mode: Mode) => {
  const curried = async () => {
    await del(getOutputDirectory(mode));
  };
  curried.displayName = `clean${capitalCase(mode)}Web`;
  return curried;
};

const createWebpackConfig = async (mode: Mode) => {
  let webpackMode: Configuration['mode'];
  if (mode === 'test') {
    webpackMode = 'production';
  } else {
    webpackMode = mode;
  }
  return merge<Configuration>(
    {
      mode: webpackMode,
      entry: {
        renderer: './apps/web/main/index.ts',
      },
      output: {
        path: getOutputDirectory(mode),
      },
    },
    rendererWebpackConfig(),
    defaultWebpackConfig(mode, 'Web'),
  );
};

const copyResources = (mode: Mode) => {
  const curried = async () => {
    const outputDirectory = getOutputDirectory(mode);
    await fs.mkdir(getOutputDirectory(mode), { recursive: true });
    await fs.copyFile(
      path.resolve('packages/renderer/main/index.html'),
      path.resolve(outputDirectory, 'index.html'),
    );
    const staticResources = path.resolve('apps/web/staticResources');
    for (const file of await fs.readdir(staticResources)) {
      await fs.copyFile(
        path.resolve(staticResources, file),
        path.resolve(outputDirectory, file),
      );
    }
  };
  curried.displayName = `copy${capitalCase(mode)}WebHtmlFile`;
  return curried;
};

const runWebServer = async () => {
  const config = await createWebpackConfig('development');

  const server = new WebpackDevServer(
    {
      port: 8080,
      hot: true,
      static: config.output.path,
    },
    webpack(config),
  );
  return server.start();
};

const bundleWeb = (mode: Mode) => {
  const curried = async () => {
    const config = await createWebpackConfig(mode);
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
  curried.displayName = `bundle${capitalCase(mode)}Web`;
  return curried;
};

export const startWeb = series(
  clean('development'),
  copyResources('development'),
  runWebServer,
);
export const buildWeb = series(
  cleanBuildDirectory,
  clean('production'),
  copyResources('production'),
  bundleWeb('production'),
);
export const buildTestWeb = series(
  cleanBuildDirectory,
  clean('test'),
  copyResources('test'),
  bundleWeb('test'),
);
