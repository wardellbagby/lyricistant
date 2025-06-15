import { RendererDelegate } from '@lyricistant/common/Delegates';
import { FileHistory } from '@lyricistant/common-platform/history/FileHistory';
import { ScreenshotterPreferences } from '@screenshotter-app/platform/Preferences';

declare global {
  interface Window {
    rendererDelegate: RendererDelegate;
    fileHistory: FileHistory;
    preferences: ScreenshotterPreferences;
  }
}

export {};
