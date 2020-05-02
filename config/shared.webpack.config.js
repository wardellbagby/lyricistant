const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const path = require('path');

const MonacoPlugin = new MonacoWebpackPlugin({
  features: ['clipboard', 'codeAction', 'coreCommands', 'find', 'suggest'],
  languages: []
});

const projectDir = path.resolve(__dirname, '../');

module.exports = { MonacoPlugin, projectDir };
