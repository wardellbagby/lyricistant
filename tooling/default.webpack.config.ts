import { execSync } from 'child_process';
import { Mode } from '@tooling/common-tasks.gulp';
import webpack, { Configuration } from 'webpack';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import packageInfo from '../package.json';

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

export default (mode: Mode): Configuration => ({
  mode: webpackMode(mode),
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
          projectReferences: true,
          compiler: 'ttypescript',
        },
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      {
        test: /\.(woff|woff2|eot|ttf|png)$/,
        loader: 'file-loader',
      },
      { test: /\.svg$/, use: ['@svgr/webpack', 'raw-loader'] },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.UI_TESTING': JSON.stringify(
        mode === 'test' ? 'ui-testing' : ''
      ),
      'process.env.APP_VERSION': JSON.stringify(getAppVersion()),
    }),
  ],
});
