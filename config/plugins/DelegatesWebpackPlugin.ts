import fs from 'fs';
import webpack from 'webpack';
import { resolve } from '../shared';
import { createDelegates } from './create_delegate_interfaces';

export default class DelegatesWebpackPlugin implements webpack.Plugin {
  public apply(compiler: webpack.Compiler): void {
    const logger = compiler.getInfrastructureLogger('DelegatesPlugin');

    compiler.hooks.afterEnvironment.tap('DelegatesPlugin', () => {
      const generatedCode = createDelegates();
      const outputFile = resolve('src/common/Delegates.ts');
      fs.writeFileSync(outputFile, generatedCode);

      logger.info('New Delegates file generated.');
    });

    compiler.hooks.afterCompile.tap('DelegatesPlugin', (compilation) => {
      const filePath = resolve('outlines/');
      compilation.contextDependencies.add(filePath);
    });

    compiler.hooks.watchRun.tapPromise(
      'DelegatesPlugin',
      async (updatedCompiler) => {
        let hasOutlineUpdated = false;
        // @ts-ignore non-public API
        const watchFileSystem: any = updatedCompiler.watchFileSystem;

        if (watchFileSystem.watcher?.mtimes) {
          hasOutlineUpdated = Object.keys(
            watchFileSystem.watcher.mtimes
          ).some((filename) => filename.endsWith('Delegates.json'));
        }

        if (hasOutlineUpdated) {
          const outputFile = resolve('src/common/Delegates.ts');
          fs.writeFileSync(outputFile, createDelegates());
        }
      }
    );
  }
}
