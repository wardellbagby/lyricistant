import { PreferencesData } from 'common/preferences/PreferencesData';
import { UiConfig } from 'common/ui/UiConfig';

/**
 * Information that the renderer wants to send to the platform.
 */
export interface RendererToPlatformListener {
  'ready-for-events': () => void;
  'editor-text': (text: string) => void;
  'prompt-save-file-for-new': () => void;
  'prompt-save-file-for-quit': () => void;
  'okay-for-new-file': () => void;
  'okay-for-quit': () => void;
  'save-prefs': (data?: PreferencesData) => void;
  'new-file-attempt': () => void;
  'open-file-attempt': () => void;
  'save-file-attempt': (data: string) => void;
  'request-ui-config': () => void;
}

/**
 * Information that the platform wants to send to the renderer.
 */
export interface PlatformToRendererListener {
  'dark-mode-toggled': (textSize: number | null, useDarkMode: boolean) => void;
  'prefs-updated': (preferenceData: PreferencesData) => void;
  'new-file-created': () => void;
  'file-save-ended': (error: Error | null, currentFilePath: string) => void;
  'close-prefs': () => void;
  find: () => void;
  replace: () => void;
  'is-okay-for-new-file': () => void;
  'file-opened': (error: Error, filePath: string, data: string) => void;
  'file-save-started': (filePath: string) => void;
  'request-editor-text': () => void;
  'is-okay-for-quit-file': () => void;
  undo: () => void;
  redo: () => void;
  'open-prefs': () => void;
  'ui-config': (config: UiConfig) => void;
  'app-title-changed': (title: string) => void;
  'open-about': () => void;
}

export type RendererChannel = Extract<keyof PlatformToRendererListener, string>;
export type PlatformChannel = Extract<keyof RendererToPlatformListener, string>;

export interface RendererDelegate {
  send<Channel extends RendererChannel>(
    channel: Channel,
    ...args: Parameters<PlatformToRendererListener[Channel]>
  ): void;

  on<Channel extends PlatformChannel>(
    channel: Channel,
    listener: RendererToPlatformListener[Channel]
  ): this;

  removeListener<Channel extends PlatformChannel>(
    channel: Channel,
    listener: RendererToPlatformListener[Channel]
  ): this;
}

export interface PlatformDelegate {
  send<Channel extends PlatformChannel>(
    channel: Channel,
    ...args: Parameters<RendererToPlatformListener[Channel]>
  ): void;

  on<Channel extends RendererChannel>(
    channel: Channel,
    listener: PlatformToRendererListener[Channel]
  ): this;

  removeListener<Channel extends RendererChannel>(
    channel: Channel,
    listener: PlatformToRendererListener[Channel]
  ): this;
}
