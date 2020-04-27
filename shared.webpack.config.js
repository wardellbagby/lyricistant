const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const MonacoPlugin = new MonacoWebpackPlugin({
  features: ['clipboard', 'codeAction', 'coreCommands', 'find', 'suggest'],
  languages: []
});

module.exports = { MonacoPlugin };
