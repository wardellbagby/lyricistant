import { RendererDelegate } from "@lyricistant/common/Delegates";
import { Logger } from "@lyricistant/common/Logger";
import { Manager } from "@lyricistant/common/Manager";

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
