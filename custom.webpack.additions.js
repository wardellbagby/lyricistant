const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
    target: "electron-renderer",
    devtool: "source-map",
    plugins: [
        new MonacoWebpackPlugin({
            features: ['clipboard', 'codeAction', 'coreCommands', 'find', 'suggest'],
            languages: []
        })
    ]
};