const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SharedWebpackConfig = require('../shared.webpack.config.js');

module.exports = {
  target: 'web',
  entry: './src/renderer/index.tsx',
  devtool: 'eval-source-map',
  mode: 'development',
  resolve: {
    alias: SharedWebpackConfig.aliases('web'),
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    modules: ['node_modules']
  },
  plugins: [
    SharedWebpackConfig.MonacoPlugin,
    new HtmlWebpackPlugin({
      title: 'Untitled',
      templateContent: `
      <meta charset="utf-8">
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
        test: /\.tsx?$/,
        include: [path.resolve(SharedWebpackConfig.projectDir, 'src/')],
        exclude: [path.resolve(SharedWebpackConfig.projectDir, 'src/electron')]
      },
      { test: /\.tsx?$/, use: 'ts-loader' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.ttf$/, use: 'file-loader' }
    ]
  },
  output: {
    path: path.resolve(__dirname, '../../dist/web'),
    filename: 'web.js'
  },
  devServer: {
    contentBase: '../../dist/web'
  }
};
