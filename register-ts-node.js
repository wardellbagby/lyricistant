require('ts-node').register({
  project: require('path').resolve('node-tsconfig.json'),
  transpileOnly: true,
});
require('tsconfig-paths/register');
