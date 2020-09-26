import { Configuration } from 'webpack';
import configs from '../prod/webpack.config';

const asTestConfig = (config: Configuration): Configuration => {
  return {
    ...config,
    devtool: 'source-map',
    mode: 'production',
    optimization: {
      minimize: false,
      concatenateModules: false,
    },
  };
};
export default configs.map((config) => asTestConfig(config));
