import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';
import path from 'path';
import DelegatesWebpackPlugin from './plugins/DelegatesWebpackPlugin';

export const MonacoPlugin = new MonacoWebpackPlugin({
  features: ['clipboard', 'codeAction', 'coreCommands', 'find', 'suggest'],
  languages: []
});

export const DelegatesPlugin = new DelegatesWebpackPlugin();

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
    platform: path.resolve(projectDir, `src/${platformName}/platform`)
  };
};
