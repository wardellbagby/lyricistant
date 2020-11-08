const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { DefinePlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const path = require('path');

module.exports = ({ htmlTemplate }) => {
  return {
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Untitled',
        template: htmlTemplate,
        inject: false,
      }),
      new CleanWebpackPlugin({
        verbose: true,
      }),
      new CircularDependencyPlugin({
        allowAsyncCycles: true,
        exclude: /node_modules/,
        failOnError: true,
      }),
      new CopyWebpackPlugin({
        patterns: [{ from: 'renderer/main/static/' }],
      }),
      new ReactRefreshWebpackPlugin(),
      new DefinePlugin({
        // 'process.env.APP_VERSION': JSON.stringify(packageInfo.version),
        // 'process.env.APP_HOMEPAGE': JSON.stringify(packageInfo.homepage),
        // 'process.env.APP_AUTHOR': JSON.stringify(packageInfo.author.name),
      }),
    ],
    module: {
      rules: [
        { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        {
          test: /\.(woff|woff2|eot|ttf|svg|png)$/,
          loader: 'file-loader',
        },
      ],
    },
    devServer: {
      host: 'localhost',
      port: 9080,
      hot: true,
      overlay: true,
    },
  };
};