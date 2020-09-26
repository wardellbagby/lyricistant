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
        try {
          if (!process.kill(-this.electronProcess.pid)) {
            logger.error(
              `Couldn't kill Electron pid=${this.electronProcess.pid}`
            );
            return;
          }
        } catch (e) {
          logger.error(
            `Couldn't kill Electron pid=${this.electronProcess.pid}`,
            e
          );
          return;
        }
      }

      try {
        this.electronProcess = spawn(
          resolve('node_modules/.bin/electron'),
          ['main/main.js', '--inspect=5858', '--remote-debugging-port=9223'],
          {
            cwd: resolve('dist/electron/'),
            detached: true,
          }
        );
      } catch (e) {
        logger.error("Couldn't restart the Electron app!", e);
        return;
      }

      logger.info(`Started Electron app. pid=${this.electronProcess.pid}`);
    });

    compiler.hooks.watchClose.tap('StartElectronPlugin', () => {
      if (this.electronProcess) {
        process.kill(-this.electronProcess.pid);
      }
    });
  }
}

export const ElectronRestartPlugin = new ElectronRestartPluginImpl();
