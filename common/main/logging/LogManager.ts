import { RendererDelegate } from '../Delegates';
import { Logger } from '../Logger';
import { Manager } from '../Manager';

export class LogManager implements Manager {
  public constructor(
    private rendererDelegate: RendererDelegate,
    private logger: Logger
  ) {}
  public register() {
    this.rendererDelegate.on('save-logs', async () => {
      await this.logger.save();
    });
  }
}
