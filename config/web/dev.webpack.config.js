const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { MonacoPlugin, aliases, projectDir } = require('../shared.js');

module.exports = {
  target: 'web',
  entry: './src/web/index.ts',
  devtool: 'eval-source-map',
  mode: 'development',
  resolve: {
    alias: aliases('web'),
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    modules: ['node_modules']
  },
  plugins: [
    MonacoPlugin,
    new HtmlWebpackPlugin({
      title: 'Untitled',
      templateContent: `
      <meta charset="utf-8">
      <html lang="en">
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
        include: [path.resolve(projectDir, 'src/')],
        exclude: [path.resolve(projectDir, 'src/electron')],
        use: 'ts-loader'
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      {
        test: /\.(woff|woff2|eot|ttf|svg)$/,
        loader: 'file-loader'
      }
    ]
  },
  output: {
    path: path.resolve(projectDir, 'dist/web'),
    filename: 'web.js'
  },
  devServer: {
    contentBase: path.resolve(projectDir, 'dist/web')
  }
};
