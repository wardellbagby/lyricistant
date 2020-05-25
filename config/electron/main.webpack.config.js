const path = require('path');
const { aliases, projectDir } = require('../shared.js');
module.exports = {
  devtool: 'source-map',
  resolve: {
    alias: aliases('electron')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: [path.resolve(projectDir, 'src/web')]
      }
    ]
  },
  output: {
    path: path.resolve(projectDir, 'dist/electron/main')
  }
};
