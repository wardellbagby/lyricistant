import { ChildProcess, spawn } from 'child_process';
import webpack from 'webpack';
import { resolve } from '../shared';

export default class ElectronRestartPlugin implements webpack.Plugin {
  private electronProcess: ChildProcess = null;

  public apply(compiler: webpack.Compiler): void {
    const logger = compiler.getInfrastructureLogger('StartElectronPlugin');

    compiler.hooks.afterEmit.tap('StartElectronPlugin', () => {
      if (compiler.options.mode !== 'development') {
        return;
      }

      if (this.electronProcess) {
        this.electronProcess.kill('SIGINT');
      }
      this.electronProcess = spawn('electron', ['main/main.js'], {
        cwd: resolve('dist/electron/')
      });

      logger.info('Starting Electron app...');
    });
  }
}
