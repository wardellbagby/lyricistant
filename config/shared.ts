import CircularDependencyPlugin from 'circular-dependency-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import { DefinePlugin } from 'webpack';
import packageInfo from '../package.json';

export const projectDir = path.resolve(__dirname, '../');

export const resolve = (...pathSegments: string[]) => {
  return path.resolve(projectDir, ...pathSegments);
};

export const aliases = (platformName: string): { [key: string]: string } => {
  return {
    common: path.resolve(projectDir, 'src/common/'),
    PlatformDelegate$: path.resolve(
      projectDir,
      `src/${platformName}/Delegates.ts`
    ),
    Components$: path.resolve(projectDir, `src/${platformName}/Components.ts`),
  };
};

export const HtmlPlugin = new HtmlWebpackPlugin({
  title: 'Untitled',
  template: resolve('src/renderer/index.html'),
});

export const StaticAssetsPlugin = new CopyWebpackPlugin({
  patterns: [{ from: 'src/renderer/static' }],
});

export const CircularDepsPlugin = new CircularDependencyPlugin({
  allowAsyncCycles: true,
  exclude: /node_modules/,
  failOnError: true,
});

export const RendererGlobalsPlugin = new DefinePlugin({
  'process.env.APP_VERSION': JSON.stringify(packageInfo.version),
  'process.env.APP_HOMEPAGE': JSON.stringify(packageInfo.homepage),
  'process.env.APP_AUTHOR': JSON.stringify(packageInfo.author.name),
});
