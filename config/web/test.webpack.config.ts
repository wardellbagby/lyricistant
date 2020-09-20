import { Configuration } from 'webpack';
import prodConfig from './prod.webpack.config';

const config: Configuration = {
  ...prodConfig,
  devtool: 'eval-source-map',
  mode: 'production',
  optimization: {
    minimize: false
  }
};

export default config;
