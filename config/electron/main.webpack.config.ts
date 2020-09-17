import { WebpackConfigurator } from 'electron-webpack';
import { Configuration } from 'webpack';
import merge from 'webpack-merge';
import { aliases, DelegatesPlugin, resolve } from '../shared';
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
  output: {
    path: resolve('dist/electron/main')
  },
  plugins: [DelegatesPlugin]
};

module.exports = (
  oldConfig: Configuration,
  configurator: WebpackConfigurator
) => withProperMode(merge(oldConfig, config), configurator);
