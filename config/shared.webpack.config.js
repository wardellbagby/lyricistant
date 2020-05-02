const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const path = require('path');

const MonacoPlugin = new MonacoWebpackPlugin({
  features: ['clipboard', 'codeAction', 'coreCommands', 'find', 'suggest'],
  languages: []
});

const projectDir = path.resolve(__dirname, '../');

const aliases = (platformName) => {
  return {
    common: path.resolve(projectDir, 'src/common/'),
    Delegates$: path.resolve(projectDir, `src/${platformName}/Delegates.ts`),
    platform: path.resolve(projectDir, `src/${platformName}/platform`)
  };
};

module.exports = { MonacoPlugin, projectDir, aliases };
