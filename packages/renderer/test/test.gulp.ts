import { config as KarmaConfig, ConfigOptions, Server } from 'karma';
import defaultWebpackConfig from '@tooling/default.webpack.config';
import parser from 'yargs-parser';

const argv = parser(process.argv.slice(2), { boolean: ['headless'] });

export const testRenderer = async () => {
  const { headless, watch } = { headless: true, watch: false, ...argv };
  const browser = headless ? 'ChromeHeadless' : 'Chrome';

  const rawConfig: ConfigOptions = {
    basePath: __dirname,
    frameworks: ['mocha', 'webpack', 'viewport'],
    files: [{ pattern: '**/*.spec.tsx', watched: false }],
    plugins: [
      'karma-webpack',
      'karma-mocha',
      'karma-chrome-launcher',
      'karma-spec-reporter',
      'karma-viewport',
    ],
    preprocessors: {
      '**/*.spec.tsx': ['webpack'],
    },
    browsers: [browser],
    reporters: ['spec'],
    singleRun: !watch,
    webpackMiddleware: {},
    client: {
      mocha: {
        reporter: 'html',
        timeout: process.env.CI ? '60000' : '3000',
      },
    },
    browserDisconnectTolerance: process.env.CI ? 30 : 0,
    browserNoActivityTimeout: process.env.CI ? 300_000 : 30_000,
    browserDisconnectTimeout: process.env.CI ? 300_000 : 30_000,
    webpack: defaultWebpackConfig('development', {
      projectReferences: false,
      transpileOnly: true,
      compilerOptions: {
        module: 'commonjs',
      },
    }),
  };

  const config = await KarmaConfig.parseConfig(null, rawConfig);
  const server = new Server(config);
  await server.start();
};
