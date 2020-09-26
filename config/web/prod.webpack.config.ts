import TerserPlugin from 'terser-webpack-plugin';
import { Configuration } from 'webpack';
import devConfig from './dev.webpack.config';

const config: Configuration = {
  ...devConfig,
  devtool: undefined,
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};

export default config;
