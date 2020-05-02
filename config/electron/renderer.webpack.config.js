const path = require('path');
const SharedWebpackConfig = require('../shared.webpack.config.js');
module.exports = {
  devtool: 'source-map',
  resolve: {
    alias: {
      Delegates$: path.resolve(
        SharedWebpackConfig.projectDir,
        'src/electron/Delegates.ts'
      )
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: [path.resolve(SharedWebpackConfig.projectDir, 'src/web')]
      }
    ]
  },
  plugins: [SharedWebpackConfig.MonacoPlugin],
  output: {
    path: path.resolve(SharedWebpackConfig.projectDir, 'dist/electron/renderer')
  }
};
