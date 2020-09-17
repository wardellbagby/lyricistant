/* tslint:disable:no-console */
import { WebpackConfigurator } from 'electron-webpack';
import { Configuration, Entry } from 'webpack';

export const withProperMode = (
  config: Configuration,
  configurator?: WebpackConfigurator
) => {
  if (process.env.NODE_ENV === 'production' || !process.env.NODE_ENV) {
    config = {
      ...config,
      mode: 'production'
    };
  } else {
    config = {
      ...config,
      mode: 'development',
      optimization: { minimize: false }
    };
  }
  console.log(`Setting Webpack mode to ${config.mode}`);

  if (process.env.NODE_ENV === 'test') {
    console.log(
      `Making __dirname and __filename work properly since this is a test build.`
    );
    config = {
      ...config,
      node: {
        __dirname: false,
        __filename: false
      }
    };
  }

  if (
    process.env.NODE_ENV === 'test' &&
    configurator &&
    !configurator.isRenderer
  ) {
    const entry: Entry = config.entry as Entry;
    const updatedMainEntry = (entry.main as string[]).filter(
      (path) => !path.includes('electron-main-hmr/main-hmr')
    );

    console.log(
      "Removing HMR from main config's entry list since this is a test build."
    );

    config = { ...config, entry: { main: updatedMainEntry } };
  }

  return config;
};
