import { Configuration } from 'webpack';
import merge from 'webpack-merge';
import { aliases, DelegatesPlugin, MonacoPlugin, resolve } from '../shared';
import { withProperMode } from './electron-shared';

const config: Configuration = {
  devtool: 'source-map',
  resolve: {
    alias: aliases('electron')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: [resolve('src/web')]
      }
    ]
  },
  plugins: [DelegatesPlugin, MonacoPlugin],
  output: {
    path: resolve('dist/electron/renderer')
  }
};

module.exports = (oldConfig: Configuration) =>
  withProperMode(merge(oldConfig, config));
