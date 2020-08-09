import { Configuration } from 'webpack';
import { aliases, DelegatesPlugin, MonacoPlugin, resolve } from '../shared';

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
module.exports = config;
