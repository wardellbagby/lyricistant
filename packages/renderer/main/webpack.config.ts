import { execSync } from 'child_process';
import webpack, { Configuration } from 'webpack';
import packageInfo from '../../../package.json';

export default (): Configuration => {
  const commitHash = () =>
    execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).substr(0, 8);

  return {
    plugins: [
      new webpack.DefinePlugin({
        'process.env.APP_VERSION': JSON.stringify(
          process.env.NIGHTLY
            ? `${packageInfo.version}-nightly+${commitHash()}`
            : packageInfo.version
        ),
        'process.env.APP_HOMEPAGE': JSON.stringify(packageInfo.homepage),
        'process.env.APP_AUTHOR': JSON.stringify(packageInfo.author.name),
      }),
    ],
  };
};
