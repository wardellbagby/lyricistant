import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import webpack, { Configuration, DefinePlugin } from 'webpack';
import { merge } from 'webpack-merge';
import WebpackDevServer from 'webpack-dev-server';
import { parallel, series } from 'gulp';
import rendererWebpackConfig from '@lyricistant/renderer/webpack.config';
import defaultWebpackConfig from '@tooling/default.webpack.config';
import {
  getOutputDirectory as getOutDir,
  Mode,
} from '@tooling/common-tasks.gulp';
import { capitalCase } from 'change-case';
import del from 'del';
import { buildElectronApp } from './build_apps';

const getOutputDirectory = (mode: Mode) => getOutDir(mode, __dirname);
const clean = (mode: Mode) => {
  const curried = async () => {
    await del(getOutputDirectory(mode));
  };
  curried.displayName = `clean${capitalCase(mode)}Electron`;
  return curried;
};

const createRendererWebpackConfig = async (mode: Mode) => {
  const webpackMode = mode === 'test' ? 'development' : mode;
  return merge<Configuration>(
    {
      mode: webpackMode,
      entry: './packages/renderer/main/index.tsx',
      target: 'web',
      output: {
        filename: 'renderer.js',
        path: getOutputDirectory(mode),
      },
    },
    rendererWebpackConfig(),
    defaultWebpackConfig(mode)
  );
};

const createMainWebpackConfig = async (mode: Mode, useDevServer: boolean) => {
  const webpackMode = mode === 'test' ? 'development' : mode;
  return merge<Configuration>(
    {
      mode: webpackMode,
      entry: './apps/electron/main/index.ts',
      target: 'electron-main',
      output: {
        filename: 'main.js',
        path: getOutputDirectory(mode),
      },
      plugins: [
        new DefinePlugin({
          'process.env.RENDERER_SERVER_PORT':
            mode === 'development' && useDevServer ? 9080 : undefined,
        }),
      ],
      node: {
        __dirname: false,
        __filename: false,
      },
    },
    defaultWebpackConfig(mode)
  );
};

const createPreloadWebpackConfig = async (mode: Mode) => {
  const webpackMode = mode === 'test' ? 'development' : mode;
  return merge<Configuration>(
    {
      mode: webpackMode,
      entry: './apps/electron/packages/preload/preload.ts',
      target: 'electron-preload',
      output: {
        filename: 'preload.js',
        path: getOutputDirectory(mode),
      },
    },
    defaultWebpackConfig(mode)
  );
};

const copyElectronHtmlFile = (mode: Mode) => {
  const curried = async () => {
    await fs.mkdir(getOutputDirectory(mode), { recursive: true });
    await fs.copyFile(
      'packages/renderer/main/index.html',
      path.resolve(getOutputDirectory(mode), 'index.html')
    );
  };
  curried.displayName = `copy${capitalCase(mode)}ElectronHtmlFile`;
  return curried;
};

const bundleMainAndPreload = async () => {
  const main = await createMainWebpackConfig('development', true);
  const preload = await createPreloadWebpackConfig('development');
  return new Promise<unknown>((resolve, reject) => {
    webpack([main, preload], (error, stats) => {
      if (error) {
        reject(error);
      }
      if (stats.hasErrors()) {
        reject(stats.toString());
      }
      console.log(stats.toString());
      resolve(undefined);
    });
  });
};

const startElectronApp = async () => {
  spawn(require.resolve('electron/cli'), [
    path.resolve(getOutputDirectory('development'), 'main.js'),
    '--remote-debugging-port=9229',
  ]);
};

const runElectronServer = async () => {
  const config = await createRendererWebpackConfig('development');
  return new Promise<unknown>((_, reject) => {
    new WebpackDevServer(webpack(config), {
      publicPath: '/',
      contentBase: getOutputDirectory('development'),
      hot: true,
      injectHot: true,
    }).listen(9080, 'localhost', (error) => {
      if (error) {
        reject();
      }
    });
  });
};

const bundleElectron = (mode: Mode) => {
  const curried = async () => {
    const main = await createMainWebpackConfig(mode, false);
    const preload = await createPreloadWebpackConfig(mode);
    const renderer = await createRendererWebpackConfig(mode);
    return new Promise<unknown>((resolve, reject) => {
      webpack([main, preload, renderer], (error, stats) => {
        if (error) {
          reject(error);
        }
        if (stats?.hasErrors()) {
          reject(stats.toString());
        }
        console.log(stats?.toString());
        resolve(undefined);
      });
    });
  };
  curried.displayName = `bundle${capitalCase(mode)}Electron`;
  return curried;
};

const runElectronBuilder = (...args: Parameters<typeof buildElectronApp>) => {
  const [mode, currentOnly] = args;
  const curried = async () => buildElectronApp(...args);
  curried.displayName = `runElectronBuilderFor${
    currentOnly ? 'Current' : 'All'
  }${capitalCase(mode)}App${currentOnly ? '' : 's'}`;
  return curried;
};

export const startElectron = series(
  clean('development'),
  copyElectronHtmlFile('development'),
  parallel(runElectronServer, series(bundleMainAndPreload, startElectronApp))
);
export const buildElectron = series(
  clean('production'),
  copyElectronHtmlFile('production'),
  bundleElectron('production')
);

export const buildTestElectron = series(
  clean('test'),
  copyElectronHtmlFile('test'),
  bundleElectron('test')
);
export const buildAllElectronApps = series(
  clean('production'),
  copyElectronHtmlFile('production'),
  bundleElectron('production'),
  runElectronBuilder('production', false)
);
export const buildCurrentElectronApp = series(
  clean('development'),
  copyElectronHtmlFile('development'),
  bundleElectron('development'),
  runElectronBuilder('development', true)
);
