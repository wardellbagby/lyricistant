import { Configuration } from 'webpack';
import prodConfig from './prod.webpack.config';

const config: Configuration = {
  ...prodConfig,
  devtool: 'eval-source-map',
  entry: (prodConfig.entry as string[])[0],
  mode: 'production',
  optimization: {
    minimize: false,
  },
};

export default config;
