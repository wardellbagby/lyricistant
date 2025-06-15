import { execSync } from 'child_process';
import path from 'path';
import { Mode } from '@tooling/common-tasks.gulp';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import webpack, { Configuration } from 'webpack';
import packageInfo from '../package.json';
import { di } from '@wessberg/di-compiler';
import * as TS from 'typescript';

const commitHash = () =>
  execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).substr(0, 8);

const getAppVersion = () => {
  if (process.env.NIGHTLY?.toLowerCase() === 'true') {
    const appVersion = `${packageInfo.version}-nightly+${commitHash()}`;
    console.log(`Detected nightly build. Using app version: ${appVersion}`);
    return appVersion;
  } else {
    return packageInfo.version;
  }
};
export const webpackMode = (mode: Mode): Configuration['mode'] => {
  if (mode === 'test') {
    return 'production';
  }
  return mode;
};
const devtool = (mode: Mode): Configuration['devtool'] => {
  if (mode === 'development') {
    return 'eval-cheap-module-source-map';
  }
  return 'source-map';
};

const platforms = [
  'Android',
  'Electron',
  'iOS',
  'Web',
  'Screenshotter',
  'Test',
] as const;
export type Platform = (typeof platforms)[number];

export default (
  mode: Mode,
  platformName: Platform,
  tsLoaderOptions: Record<string, unknown> = {
    projectReferences: true,
    transpileOnly: false,
  },
): Configuration => {
  if (!platforms.includes(platformName)) {
    throw new Error(`Invalid platform: ${platformName}`);
  }

  return {
    mode: webpackMode(mode),
    cache: mode === 'development',
    devtool: devtool(mode),
    resolve: {
      plugins: [new TsconfigPathsPlugin()],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.wasm'],
    },
    module: {
      rules: [
        {
          test: /\.(tsx?)$/,
          exclude: [/node_modules/],
          loader: 'ts-loader',
          options: {
            ...tsLoaderOptions,
            compiler: 'typescript',
            getCustomTransformers: (program: TS.Program) => di({ program }),
          },
        },
        {
          test: /\.css$/,
          include: [/@mui\/.+/, /@fontsource\/.+/],
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(jpe?g|png|gif|ico|eot|ttf|woff2?)(\?v=\d+\.\d+\.\d+)?$/i,
          type: 'asset/resource',
        },
        {
          test: /\.svg$/,
          include: [/packages\/renderer\/main/],
          use: ['@svgr/webpack', 'raw-loader'],
        },
        {
          test: /\.grammar$/,
          loader: require.resolve(path.resolve(__dirname, 'grammar-loader.js')),
        },
        {
          test: /.aff$|.dic$/,
          include: [/dictionary-en/],
          use: 'raw-loader',
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.IS_UNDER_TEST': JSON.stringify(
          mode === 'test' || platformName === 'Test',
        ),
        'process.env.APP_VERSION': JSON.stringify(getAppVersion()),
        'process.env.APP_HOMEPAGE': JSON.stringify(packageInfo.homepage),
        'process.env.APP_AUTHOR': JSON.stringify(packageInfo.author.name),
        'process.env.APP_PLATFORM': JSON.stringify(platformName),
        'process.env.IMPORT_META_URL': 'import.meta.url',
      }),
    ],
  };
};
