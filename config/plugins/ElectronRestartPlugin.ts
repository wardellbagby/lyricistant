import { ChildProcess, spawn } from 'child_process';
import webpack from 'webpack';
import { resolve } from '../shared';

class ElectronRestartPluginImpl implements webpack.Plugin {
  private electronProcess: ChildProcess = null;

  public apply(compiler: webpack.Compiler): void {
    const logger = compiler.getInfrastructureLogger('StartElectronPlugin');

    if (compiler.options.mode !== 'development') {
      return;
    }

    compiler.hooks.done.tap('StartElectronPlugin', () => {
      if (this.electronProcess) {
        logger.info(
          `Stopping current Electron app. pid=${this.electronProcess.pid}`
        );
        if (!process.kill(-this.electronProcess.pid, 'SIGKILL')) {
          logger.error(
            `Couldn't kill Electron pid=${this.electronProcess.pid}`
          );
        }
      }

      this.electronProcess = spawn('electron', ['main/main.js'], {
        cwd: resolve('dist/electron/')
      });

      logger.info(`Started Electron app. pid=${this.electronProcess.pid}`);
    });
  }
}

export const ElectronRestartPlugin = new ElectronRestartPluginImpl();
