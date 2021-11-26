import webpack, { Configuration } from 'webpack';
import packageInfo from '../../../package.json';

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
      'process.env.APP_HOMEPAGE': JSON.stringify(packageInfo.homepage),
      'process.env.APP_AUTHOR': JSON.stringify(packageInfo.author.name),
      'process.env.IMPORT_META_URL': 'import.meta.url',
    }),
  ],
});
