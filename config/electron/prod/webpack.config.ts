import TerserPlugin from 'terser-webpack-plugin';
import { Configuration } from 'webpack';
import configs from '../dev/webpack.config';

const asProductionConfig = (config: Configuration): Configuration => {
  return {
    ...config,
    devtool: undefined,
    mode: 'production',
    entry:
      config.target === 'electron-renderer'
        ? [config.entry as string, './renderer/main/analytics/analytics.js']
        : config.entry,
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin()],
    },
  };
};
export default configs.map((config) => asProductionConfig(config));
