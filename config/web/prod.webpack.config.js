const TerserPlugin = require('terser-webpack-plugin');
const devConfig = require('./dev.webpack.config.js');

module.exports = {
  ...devConfig,
  devtool: 'source-map',
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()]
  }
};
