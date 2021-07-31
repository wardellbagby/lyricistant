import { execSync } from 'child_process';
import webpack, { Configuration } from 'webpack';
import packageInfo from '../../../package.json';

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
export default (): Configuration => ({
  entry: {
    preload: './packages/renderer/main/preload.tsx',
  },
  output: {
    filename: ({ chunk }) => {
      if (chunk.name === 'renderer') {
        return 'renderer.js';
      }
      return '[name].renderer.js';
    },
    chunkFilename: '[id].renderer.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.APP_VERSION': JSON.stringify(getAppVersion()),
      'process.env.APP_HOMEPAGE': JSON.stringify(packageInfo.homepage),
      'process.env.APP_AUTHOR': JSON.stringify(packageInfo.author.name),
      'process.env.IMPORT_META_URL': 'import.meta.url',
    }),
  ],
});
