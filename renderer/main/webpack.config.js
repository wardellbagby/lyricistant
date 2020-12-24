const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { DefinePlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const packageInfo = require('@lyricistant/package.json');

module.exports = ({ htmlTemplate }) => {
  return {
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Untitled',
        template: htmlTemplate,
        inject: false
      }),
      new CircularDependencyPlugin({
        allowAsyncCycles: true,
        exclude: /node_modules/,
        failOnError: true
      }),
      new CopyWebpackPlugin({
        patterns: [{ from: 'renderer/main/static/' }]
      }),
      new ReactRefreshWebpackPlugin(),
      new DefinePlugin({
        'process.env.APP_VERSION': JSON.stringify(packageInfo.version),
        'process.env.APP_HOMEPAGE': JSON.stringify(packageInfo.homepage),
        'process.env.APP_AUTHOR': JSON.stringify(packageInfo.author.name)
      })
    ],
    module: {
      rules: [
        { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        {
          test: /\.(woff|woff2|eot|ttf|svg|png)$/,
          loader: 'file-loader',
          options: {
            name: '[name].[ext]'
          },
        }
      ]
    },
    output: {
      filename: 'renderer.js'
    },
    devServer: {
      host: 'localhost',
      port: 9080,
      hot: true,
      overlay: true
    }
  };
};
