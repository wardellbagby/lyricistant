import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Buffers } from '@lyricistant/common-platform/files/Buffers';
import { Files } from '@lyricistant/common-platform/files/Files';
import { PlatformLogger } from '@lyricistant/common-platform/logging/PlatformLogger';
import { Manager } from '@lyricistant/common-platform/Manager';

export class LogManager implements Manager {
  public constructor(
    private rendererDelegate: RendererDelegate,
    private files: Files,
    private buffers: Buffers,
    private logger: PlatformLogger,
  ) {}

  public register() {
    this.rendererDelegate.on('save-logs', async () => {
      const logs = await this.logger.getPrintedLogs();

      await this.files.saveFile(
        this.buffers.stringToBuffer(logs.join('\n')),
        'logs.txt',
      );
    });
  }
}
