import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import DelegatesWebpackPlugin from './plugins/DelegatesWebpackPlugin';

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
    platform: path.resolve(projectDir, `src/${platformName}/platform`),
  };
};

export const HtmlPlugin = new HtmlWebpackPlugin({
  title: 'Untitled',
  templateContent: `
<meta name='viewport' 
      content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0' >
<meta charset="utf-8">
<html lang="en">
    <body>
        <div id='app'></div>
    </body>
</html>
      `,
});
