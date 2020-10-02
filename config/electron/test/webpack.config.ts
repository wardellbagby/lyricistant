import { Configuration, DefinePlugin } from 'webpack';
import configs from '../prod/webpack.config';

const asTestConfig = (config: Configuration): Configuration => {
  return {
    ...config,
    devtool: 'source-map',
    mode: 'production',
    entry:
      config.target === 'electron-renderer'
        ? (config.entry as string[])[0]
        : config.entry,
    optimization: {
      minimize: false,
      concatenateModules: false,
    },
    plugins: [
      ...(config.plugins ?? []),
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('test'),
      }),
    ],
  };
};
export default configs.map((config) => asTestConfig(config));
