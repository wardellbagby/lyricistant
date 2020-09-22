import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { Configuration } from 'webpack';
import { aliases, DelegatesPlugin, HtmlPlugin, resolve } from '../../shared';

export const devServerPort = 9080;

const config: Configuration = {
  mode: 'development',
  target: 'electron-renderer',
  entry: './src/renderer/index.tsx',
  devtool: 'eval-source-map',
  resolve: {
    alias: aliases('electron'),
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    modules: ['node_modules']
  },
  plugins: [
    DelegatesPlugin,
    HtmlPlugin,
    new CleanWebpackPlugin({
      verbose: true
    })
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: [resolve('src/')],
        exclude: [resolve('src/web')],
        use: 'ts-loader'
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      {
        test: /\.(woff|woff2|eot|ttf|svg)$/,
        loader: 'file-loader'
      }
    ]
  },
  output: {
    path: resolve('dist/electron/renderer'),
    filename: 'renderer.js'
  },
  devServer: {
    host: 'localhost',
    port: devServerPort,
    hot: true,
    overlay: true
  }
};

export default config;
