import {
  DialogData,
  DialogInteractionData,
} from '@lyricistant/common/dialogs/Dialog';
import { PlatformFile } from '@lyricistant/common/files/PlatformFile';
import { ParsedHistoryData } from '@lyricistant/common/history/ParsedHistoryData';
import {
  PreferencesData,
  ThemeData,
} from '@lyricistant/common/preferences/PreferencesData';
import { UiConfig } from '@lyricistant/common/ui/UiConfig';

/**
 * Information that the renderer wants to send to the platform.
 */
export interface RendererToPlatformListener {
  'ready-for-events': () => void;
  'editor-text': (text: string) => void;
  'is-file-modified': (modified: boolean) => void;
  'save-prefs': (data?: PreferencesData) => void;
  'new-file-attempt': () => void;
  'open-file-attempt': (file?: PlatformFile) => void;
  'save-file-attempt': (data: string) => void;
  'request-ui-config': () => void;
  'save-logs': () => void;
  'dialog-interaction': (
    dialogTag: string,
    interactionData: DialogInteractionData
  ) => void;
  'dialog-closed': (dialogTag: string) => void;
  'apply-file-history': (history: ParsedHistoryData) => void;
}

/**
 * Information that the platform wants to send to the renderer.
 */
export interface PlatformToRendererListener {
  'theme-updated': (themeData: ThemeData) => void;
  'prefs-updated': (preferenceData: PreferencesData) => void;
  'new-file-created': () => void;
  'file-save-ended': (error: Error | null, currentFilePath: string) => void;
  find: () => void;
  replace: () => void;
  'check-file-modified': () => void;
  'file-opened': (error: Error, data: string, clearHistory: boolean) => void;
  'file-save-started': (filePath: string) => void;
  'request-editor-text': () => void;
  undo: () => void;
  redo: () => void;
  'open-prefs': () => void;
  'ui-config': (config: UiConfig) => void;
  'app-title-changed': (title: string) => void;
  'open-about': () => void;
  'show-dialog': (dialog: DialogData) => void;
  'close-dialog': (tag?: string) => void;
  'file-history': (history: ParsedHistoryData[]) => void;
}

/**
 * All possible channels that the platform can use to talk to the renderer.
 */
export type RendererChannel = Extract<keyof PlatformToRendererListener, string>;
/**
 * All possible channels that the renderer can use to talk to the platform.
 */
export type PlatformChannel = Extract<keyof RendererToPlatformListener, string>;

/**
 * Used by the platform to communicate with the renderer.
 */
export interface RendererDelegate {
  /**
   * Send data to the renderer.
   *
   * @param channel The channel that the renderer is listening to.
   * @param args The args for the channel you're sending data to.
   */
  send<Channel extends RendererChannel>(
    channel: Channel,
    ...args: Parameters<PlatformToRendererListener[Channel]>
  ): void;

  /**
   * Add a listener to be invoked whenever the renderer adds a new listener for
   * the given channel.
   *
   * @param channel The channel that the renderer just added a listener to.
   * @param onRendererListenerSet A function that will be invoked when the renderer adds a
   * new listener to the given channel.
   */
  addRendererListenerSetListener<Channel extends RendererChannel>(
    channel: Channel,
    onRendererListenerSet: () => void
  ): void;

  /**
   * Adds a new listener for data sent from the renderer to the platform.
   *
   * @param channel The channel the renderer is sending data from.
   * @param listener The listener to be invoked with the data from the renderer.
   */
  on<Channel extends PlatformChannel>(
    channel: Channel,
    listener: RendererToPlatformListener[Channel]
  ): this;

  /**
   * Removes an existing listener for data sent from the renderer to the
   * platform.
   *
   * @param channel The channel previously used to register a listener with.
   * @param listener The listener previously used to register a listener with.
   */
  removeListener<Channel extends PlatformChannel>(
    channel: Channel,
    listener: RendererToPlatformListener[Channel]
  ): this;
}

/**
 * Used by the renderer to communicate with the platform.
 */
export interface PlatformDelegate {
  /**
   * Send data to the platform.
   *
   * @param channel The channel that the platform is listening to.
   * @param args The args for the channel you're sending data to.
   */
  send<Channel extends PlatformChannel>(
    channel: Channel,
    ...args: Parameters<RendererToPlatformListener[Channel]>
  ): void;

  /**
   * Adds a new listener for data sent from the platform to the renderer.
   *
   * @param channel The channel the platform is sending data from.
   * @param listener The listener to be invoked with the data from the platform.
   */
  on<Channel extends RendererChannel>(
    channel: Channel,
    listener: PlatformToRendererListener[Channel]
  ): this;

  /**
   * Removes an existing listener for data sent from the platform to the
   * renderer.
   *
   * @param channel The channel previously used to register a listener with.
   * @param listener The listener previously used to register a listener with.
   */
  removeListener<Channel extends RendererChannel>(
    channel: Channel,
    listener: PlatformToRendererListener[Channel]
  ): this;
}
