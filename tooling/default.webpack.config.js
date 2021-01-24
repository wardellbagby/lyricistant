const webpack = require('webpack');
module.exports = ({ mode, outputFile, isUiTest }) => ({
  devtool: mode !== 'production' ? 'source-map' : 'eval',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'source-map-loader',
      },
    ],
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 5,
    }),
    new webpack.DefinePlugin({
      'process.env.UI_TESTING': JSON.stringify(isUiTest ? 'ui-testing' : ''),
    }),
  ],
  output: {
    filename: outputFile || undefined,
  },
});
