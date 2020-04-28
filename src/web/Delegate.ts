// tslint:disable: unified-signatures
import { PlatformDelegate } from 'common/Delegate';
import { PreferencesData } from 'common/PreferencesData';

class WebPlatformDelegate implements PlatformDelegate {
  public on(
    channel: 'dark-mode-toggled',
    listener: (textSize: number, useDarkColors: boolean) => void
  ): this;
  public on(
    channel: 'prefs-updated',
    listener: (preferenceData: PreferencesData) => void
  ): this;
  public on(
    channel: 'file-save-ended',
    listener: (error: Error, currentFilePath: string) => void
  ): this;
  public on(channel: 'close-prefs', listener: () => void): this;
  public on(channel: 'new-file-created', listener: () => void): this;
  public on(channel: 'find', listener: () => void): this;
  public on(channel: 'replace', listener: () => void): this;
  public on(channel: 'new-file', listener: () => void): this;
  public on(
    channel: 'file-opened',
    listener: (error: Error, filePath: string, data: string) => void
  ): this;
  public on(
    channel: 'file-save-started',
    listener: (filePath: string) => void
  ): this;
  public on(channel: 'request-editor-text', listener: () => void): this;
  public on(channel: 'attempt-quit', listener: () => void): this;
  public on(channel: 'undo', listener: () => void): this;
  public on(channel: 'redo', listener: () => void): this;
  public on(channel: 'open-prefs', listener: () => void): this;

  public on(channel: string, listener: (...args: any[]) => void): this {
    if (channel === 'dark-mode-toggled') {
      listener(null, true);
    }
    return this;
  }
  public send(channel: 'ready-for-events'): void;
  public send(channel: 'editor-text', text: string): void;
  public send(channel: 'prompt-save-file-for-new'): void;
  public send(channel: 'prompt-save-file-for-quit'): void;
  public send(channel: 'okay-for-new-file'): void;
  public send(channel: 'okay-for-quit'): void;
  public send(channel: 'save-prefs', data: PreferencesData): void;
  public send(channel: any, ...args: any[]) {}

  public removeListener(
    channel: 'dark-mode-toggled',
    listener: (textSize: number, useDarkColors: boolean) => void
  ): this;
  public removeListener(
    channel: 'file-opened',
    listener: (error: Error, filePath: string, data: string) => void
  ): this;
  public removeListener(
    channel: 'new-file-created',
    listener: () => void
  ): this;
  public removeListener(channel: 'open-prefs', listener: () => void): this;
  public removeListener(
    channel: 'prefs-updated',
    listener: (preferenceData: PreferencesData) => void
  ): this;
  public removeListener(channel: 'close-prefs', listener: () => void): this;
  public removeListener(channel: 'new-file', listener: () => void): this;
  public removeListener(
    channel: 'file-save-ended',
    listener: (error: Error, currentFilePath: string) => void
  ): this;
  public removeListener(channel: 'attempt-quit', listener: () => void): this;
  public removeListener(
    channel: 'request-editor-text',
    listener: () => void
  ): this;
  public removeListener(channel: 'undo', listener: () => void): this;
  public removeListener(channel: 'redo', listener: () => void): this;
  public removeListener(channel: 'find', listener: () => void): this;
  public removeListener(channel: 'replace', listener: () => void): this;
  public removeListener(channel: any, listener: any): this {
    return this;
  }
}

export const platformDelegate: PlatformDelegate = new WebPlatformDelegate();
