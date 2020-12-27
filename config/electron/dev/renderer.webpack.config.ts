import { Configuration } from 'webpack';
import {
  aliases,
  CircularDepsPlugin,
  HtmlPlugin,
  resolve,
  StaticAssetsPlugin,
} from '../../shared';

export const devServerPort = 9080;

const config: Configuration = {
  mode: 'development',
  target: 'electron-renderer',
  entry: './renderer/main/index.js',
  devtool: 'eval-source-map',
  resolve: {
    alias: aliases('electron'),
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    modules: ['node_modules'],
  },
  plugins: [HtmlPlugin, CircularDepsPlugin, StaticAssetsPlugin],
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      {
        test: /\.(woff|woff2|eot|ttf|svg|png)$/,
        loader: 'file-loader',
      },
    ],
  },
  output: {
    path: resolve('dist/electron/renderer'),
    filename: 'renderer.js',
  },
  devServer: {
    host: 'localhost',
    port: devServerPort,
    hot: true,
    overlay: true,
  },
};

export default config;
