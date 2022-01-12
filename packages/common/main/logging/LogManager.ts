import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Logger } from '@lyricistant/common/Logger';
import { Manager } from '@lyricistant/common/Manager';
import { Files } from '@lyricistant/common/files/Files';
import { Buffers } from '@lyricistant/common/files/Buffers';

export class LogManager implements Manager {
  public constructor(
    private rendererDelegate: RendererDelegate,
    private files: Files,
    private buffers: Buffers,
    private logger: Logger
  ) {}
  public register() {
    this.rendererDelegate.on('save-logs', async () => {
      const logs = await this.logger.getPrintedLogs();

      await this.files.saveFile(
        this.buffers.stringToBuffer(logs.join('\n')),
        'logs.txt'
      );
    });
  }
}
