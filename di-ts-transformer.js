/*
  We use this with TTypescript (not a typo, but a fork of the Typescript
  compiler) in order to compile all of our Typescript code with information
  needed for our dependency injection system. This is used by the
  root tsconfig.json file.
 */
const di = require('@wessberg/di-compiler').di;

module.exports = (program) => di({ program });
