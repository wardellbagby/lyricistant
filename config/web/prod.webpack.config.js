const devConfig = require('./dev.webpack.config.js');

module.exports = {
  ...devConfig,
  devtool: 'source-map',
  mode: 'production'
};