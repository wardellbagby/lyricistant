const path = require('path');
const SharedWebpackConfig = require('./shared.webpack.config.js');
module.exports = {
  target: 'electron-renderer',
  devtool: 'source-map',
  resolve: {
    alias: {
      Delegates$: path.resolve(__dirname, 'src/electron/Delegates.ts')
    }
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: [path.resolve(__dirname, 'src/electron')]
      }
    ]
  },
  plugins: [SharedWebpackConfig.MonacoPlugin]
};
