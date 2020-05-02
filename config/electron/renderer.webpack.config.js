const path = require('path');
const SharedWebpackConfig = require('../shared.webpack.config.js');
module.exports = {
  devtool: 'source-map',
  resolve: {
    alias: SharedWebpackConfig.aliases('electron')
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
