import webpack, { DefinePlugin } from 'webpack';
import { devServerPort } from '../electron/dev/renderer.webpack.config';

export class ElectronDevServerPortPlugin implements webpack.Plugin {
  private devDefinePlugin = new DefinePlugin({
    'process.env.ELECTRON_WEBPACK_WDS_PORT': JSON.stringify(devServerPort),
  });

  public apply(compiler: webpack.Compiler): void {
    if (compiler.options.mode === 'development') {
      this.devDefinePlugin.apply(compiler);
    }
  }
}
