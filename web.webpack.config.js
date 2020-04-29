const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SharedWebpackConfig = require('./shared.webpack.config.js');

module.exports = {
  target: 'web',
  entry: './src/renderer/index.tsx',
  devtool: 'eval-source-map',
  resolve: {
    alias: {
      Delegate$: path.resolve(__dirname, 'src/web/Delegate.ts'),
      common: path.resolve(__dirname, 'src/common/'),
      './src': path.resolve(__dirname, 'src/')
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    modules: ['node_modules']
  },
  plugins: [
    SharedWebpackConfig.MonacoPlugin,
    new HtmlWebpackPlugin({
      title: 'Untitled',
      templateContent: `
      <html>
        <body>
          <div id='app'></div>
        </body>
      </html>
      `
    })
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [path.resolve(__dirname, 'src/')],
        exclude: [path.resolve(__dirname, 'src/electron')]
      },
      { test: /\.tsx?$/, use: 'ts-loader' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.ttf$/, use: 'file-loader' }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'web.js'
  },
  devServer: {
    contentBase: './dist'
  }
};
