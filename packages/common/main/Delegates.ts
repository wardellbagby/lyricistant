import { DialogData } from "./dialogs/Dialog";
import { DroppableFile } from "./files/Files";
import { PreferencesData } from "./preferences/PreferencesData";
import { UiConfig } from "./ui/UiConfig";

/**
 * Information that the renderer wants to send to the platform.
 */
export interface RendererToPlatformListener {
  "ready-for-events": () => void;
  "editor-text": (text: string) => void;
  "prompt-save-file-for-new": () => void;
  "prompt-save-file-for-quit": () => void;
  "prompt-save-file-for-open": (file: DroppableFile) => void;
  "okay-for-new-file": () => void;
  "okay-for-quit": () => void;
  "save-prefs": (data?: PreferencesData) => void;
  "new-file-attempt": () => void;
  "open-file-attempt": (file?: DroppableFile) => void;
  "save-file-attempt": (data: string) => void;
  "request-ui-config": () => void;
  "save-logs": () => void;
  "dialog-button-clicked": (dialogTag: string, buttonLabel: string) => void;
}

/**
 * Information that the platform wants to send to the renderer.
 */
export interface PlatformToRendererListener {
  "dark-mode-toggled": (textSize: number | null, useDarkMode: boolean) => void;
  "prefs-updated": (preferenceData: PreferencesData) => void;
  "new-file-created": () => void;
  "file-save-ended": (error: Error | null, currentFilePath: string) => void;
  "close-prefs": () => void;
  find: () => void;
  replace: () => void;
  "is-okay-for-new-file": () => void;
  "file-opened": (
    error: Error,
    fileName: string,
    data: string,
    clearHistory: boolean
  ) => void;
  "file-save-started": (filePath: string) => void;
  "request-editor-text": () => void;
  "is-okay-for-quit-file": () => void;
  undo: () => void;
  redo: () => void;
  "open-prefs": () => void;
  "ui-config": (config: UiConfig) => void;
  "app-title-changed": (title: string) => void;
  "open-about": () => void;
  "show-dialog": (dialog: DialogData) => void;
}

export type RendererChannel = Extract<keyof PlatformToRendererListener, string>;
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
