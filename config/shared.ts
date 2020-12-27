import CircularDependencyPlugin from 'circular-dependency-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import { Plugin } from 'webpack';
// import packageInfo from '../package.json';

export const projectDir = path.resolve(__dirname, '../');

export const resolve = (...pathSegments: string[]) => {
  return path.resolve(projectDir, ...pathSegments);
};

export const aliases = (platformName: string): { [key: string]: string } => {
  return {
    common: path.resolve(projectDir, 'common/main/'),
    PlatformDelegate$: path.resolve(
      projectDir,
      `${platformName}/main/Delegates.ts`
    ),
    Components$: path.resolve(projectDir, `${platformName}/main/Components.ts`),
  };
};

export const HtmlPlugin = new HtmlWebpackPlugin({
  title: 'Untitled',
  template: resolve('renderer/main/index.ejs'),
  inject: false,
});

export const StaticAssetsPlugin: Plugin = new CopyWebpackPlugin({
  patterns: [{ from: 'renderer/main/static' }],
});

export const CircularDepsPlugin = new CircularDependencyPlugin({
  allowAsyncCycles: true,
  exclude: /node_modules/,
  failOnError: true,
});
