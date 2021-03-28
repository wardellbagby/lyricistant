import { Mode } from '@tooling/common-tasks.gulp';
import webpack, { Configuration } from 'webpack';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

export default (mode: Mode): Configuration => ({
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.wasm'],
  },
  module: {
    rules: [
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        enforce: 'pre',
        use: ['source-map-loader'],
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          projectReferences: true,
          compiler: 'ttypescript',
        },
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      {
        test: /\.(woff|woff2|eot|ttf|svg|png)$/,
        loader: 'url-loader',
      },
    ],
  },
  optimization: {
    minimize: mode === 'production',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.UI_TESTING': JSON.stringify(
        mode === 'test' ? 'ui-testing' : ''
      ),
    }),
  ],
});
