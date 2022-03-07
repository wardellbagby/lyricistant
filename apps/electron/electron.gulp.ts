import { ChildProcess, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import rendererWebpackConfig from '@lyricistant/renderer/webpack.config';
import {
  cleanBuildDirectory,
  getOutputDirectory as getOutDir,
  Mode,
} from '@tooling/common-tasks.gulp';
import defaultWebpackConfig, {
  webpackMode,
} from '@tooling/default.webpack.config';
import { capitalCase } from 'change-case';
import del from 'del';
import { parallel, series } from 'gulp';
import kill from 'tree-kill';
import { Configuration, DefinePlugin, webpack } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { merge } from 'webpack-merge';
import { buildElectronApp } from './build_apps';

const getOutputDirectory = (mode: Mode) => getOutDir(mode, __dirname);
const cleanDistFiles = (mode: Mode) => {
  const curried = async () => {
    await del(getOutputDirectory(mode));
  };
  curried.displayName = `clean${capitalCase(mode)}Electron`;
  return curried;
};

const createRendererWebpackConfig = async (mode: Mode) =>
  merge<Configuration>(
    {
      mode: webpackMode(mode),
      entry: {
        renderer: './packages/renderer/main/index.tsx',
      },
      target: 'web',
      output: {
        path: getOutputDirectory(mode),
      },
      optimization: {
        minimize: false,
      },
    },
    rendererWebpackConfig(),
    defaultWebpackConfig(mode, 'Electron')
  );

const createMainWebpackConfig = async (mode: Mode, useDevServer: boolean) =>
  merge<Configuration>(
    {
      mode: webpackMode(mode),
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
      optimization: {
        minimize: false,
      },
    },
    defaultWebpackConfig(mode, 'Electron')
  );

const createPreloadWebpackConfig = async (mode: Mode) =>
  merge<Configuration>(
    {
      mode: webpackMode(mode),
      entry: './apps/electron/packages/preload/preload.ts',
      target: 'electron-preload',
      output: {
        filename: 'preload.js',
        path: getOutputDirectory(mode),
      },
      optimization: {
        minimize: false,
      },
    },
    defaultWebpackConfig(mode, 'Electron')
  );

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

  let currentApp: ChildProcess = null;
  const compiler = webpack([main, preload]);
  return new Promise<unknown>(() => {
    compiler.watch({}, (error, stats) => {
      if (error) {
        console.error(error);
      }
      console.log(stats.toString());

      if (currentApp) {
        kill(currentApp.pid, 'SIGKILL', (killError) => {
          if (killError) {
            throw error;
          }
        });
      }
      currentApp = startElectronApp(false)();
    });
  });
};

const startElectronApp = (forceWait: boolean) => () =>
  spawn(require.resolve('electron/cli'), [
    path.resolve(getOutputDirectory('development'), 'main.js'),
    '--remote-debugging-port=9229',
    `--inspect${forceWait ? '-brk' : ''}=9228`,
  ]);

const runElectronServer = async () => {
  const config = await createRendererWebpackConfig('development');
  const serverConfig: WebpackDevServer.Configuration = {
    static: getOutputDirectory('development'),
    hot: true,
    devMiddleware: {
      publicPath: '/',
    },
  };
  return new Promise<unknown>((_, reject) => {
    new WebpackDevServer(serverConfig, webpack(config)).listen(
      9080,
      'localhost',
      (error) => {
        if (error) {
          reject();
        }
      }
    );
  });
};

const webpackAsync = async (config: Configuration) =>
  new Promise<void>((resolve, reject) => {
    webpack(config, (error, stats) => {
      if (error) {
        reject(error);
      }
      if (stats?.hasErrors()) {
        reject(stats.toString());
        return;
      }
      console.log(stats?.toString());
      resolve(undefined);
    });
  });
const bundleElectron = (mode: Mode) => {
  const curried = async () => {
    const main = await createMainWebpackConfig(mode, false);
    const preload = await createPreloadWebpackConfig(mode);
    const renderer = await createRendererWebpackConfig(mode);
    const configs = [main, preload, renderer];

    await Promise.all(configs.map(webpackAsync));
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

const coreTasks = (mode: Mode) =>
  series(cleanBuildDirectory, cleanDistFiles(mode), copyElectronHtmlFile(mode));

export const startElectron = series(
  coreTasks('development'),
  parallel(
    runElectronServer,
    series(bundleMainAndPreload, startElectronApp(false))
  )
);
export const startDebugElectron = series(
  coreTasks('development'),
  parallel(
    runElectronServer,
    series(bundleMainAndPreload, startElectronApp(true))
  )
);
export const buildElectron = series(
  coreTasks('production'),
  bundleElectron('production')
);

export const buildTestElectron = series(
  coreTasks('test'),
  bundleElectron('test')
);
export const buildAllElectronApps = series(
  coreTasks('production'),
  bundleElectron('production'),
  runElectronBuilder('production', false)
);
export const buildCurrentElectronApp = series(
  coreTasks('development'),
  bundleElectron('development'),
  runElectronBuilder('development', true)
);
