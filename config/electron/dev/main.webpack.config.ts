import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { Configuration, DefinePlugin } from 'webpack';
import { ElectronRestartPlugin } from '../../plugins/ElectronRestartPlugin';
import { aliases, DelegatesPlugin, resolve } from '../../shared';
import { devServerPort } from './renderer.webpack.config';

const config: Configuration = {
  mode: 'development',
  devtool: 'source-map',
  target: 'electron-main',
  entry: './src/electron/index.ts',
  resolve: {
    alias: aliases('electron'),
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    modules: ['node_modules']
  },
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
    path: resolve('dist/electron/main'),
    filename: 'main.js'
  },
  node: {
    __dirname: false,
    __filename: false
  },
  plugins: [
    DelegatesPlugin,
    new DefinePlugin({
      'process.env': { ELECTRON_WEBPACK_WDS_PORT: devServerPort }
    }),
    ElectronRestartPlugin,
    new CleanWebpackPlugin({
      verbose: true
    })
  ]
};

export default config;
