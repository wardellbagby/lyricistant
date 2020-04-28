const path = require('path');
const SharedWebpackConfig = require('./shared.webpack.config.js');
module.exports = {
  target: 'electron-renderer',
  devtool: 'source-map',
  resolve: {
    alias: {
      Delegate$: path.resolve(__dirname, 'src/electron/Delegate.ts')
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
