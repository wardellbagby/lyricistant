import { di } from '@wessberg/di-compiler';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { Program } from 'typescript';
import { Configuration } from 'webpack';
import { ElectronDevServerPortPlugin } from '../../plugins/ElectronDevServerPortPlugin';
import { ElectronRestartPlugin } from '../../plugins/ElectronRestartPlugin';
import { aliases, resolve } from '../../shared';

export const main: Configuration = {
  mode: 'development',
  devtool: 'source-map',
  target: 'electron-main',
  entry: './src/electron/index.ts',
  resolve: {
    alias: aliases('electron'),
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    modules: ['node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: [resolve('src/')],
        exclude: [resolve('src/web')],
        loader: 'ts-loader',
        options: {
          getCustomTransformers: (program: Program) => di({ program }),
        },
      },
    ],
  },
  output: {
    path: resolve('dist/electron/main'),
    filename: 'main.js',
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  plugins: [
    new ElectronDevServerPortPlugin(),
    ElectronRestartPlugin,
    new CleanWebpackPlugin({
      verbose: true,
    }),
  ],
};

export const preload: Configuration = {
  mode: 'development',
  devtool: 'source-map',
  target: 'electron-preload',
  entry: './src/electron/preload.ts',
  resolve: {
    alias: aliases('electron'),
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    modules: ['node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: [resolve('src/')],
        exclude: [resolve('src/web')],
        loader: 'ts-loader',
        options: {
          getCustomTransformers: (program: Program) => di({ program }),
        },
      },
    ],
  },
  output: {
    path: resolve('dist/electron/preload'),
    filename: 'preload.js',
  },
};

export default [main, preload];
