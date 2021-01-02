const { DefinePlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const packageInfo = require('@lyricistant/package_info.json');

module.exports = ({ htmlTemplate }) => {
  return {
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Untitled',
        template: htmlTemplate,
        inject: false
      }),
      new CopyWebpackPlugin({
        patterns: [{ from: 'renderer/main/static/' }]
      }),
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
          }
        }
      ]
    },
    output: {
      filename: 'renderer.js'
    },
  };
};
