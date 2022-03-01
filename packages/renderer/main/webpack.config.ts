import { Configuration } from 'webpack';

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
});
