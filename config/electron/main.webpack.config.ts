import { Configuration } from 'webpack';
import { aliases, DelegatesPlugin, resolve } from '../shared';

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

module.exports = config;
