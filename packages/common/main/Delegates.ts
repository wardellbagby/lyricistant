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

/** Information that the renderer wants to send to the platform. */
export interface RendererToPlatformListener {
  /**
   * Fired when the renderer has finished initializing and the platform can
   * start sending data.
   *
   * Note: it is generally preferred to use
   * {@link addRendererListenerSetListener} to send data to the renderer as soon
   * as its ready rather than listening to this event.
   */
  'ready-for-events': () => void;
  /**
   * Gives the platform the current text that is stored on the editor when requested.
   *
   * @param text The text currently stored in the editor.
   * @see request-editor-text
   */
  'editor-text': (text: string) => void;
  /**
   * Returns whether the file that was last sent to the renderer via
   * {@link file-opened} was modified by the user.
   *
   * @param modified Whether the file was modified.
   * @see check-file-modified
   */
  'is-file-modified': (modified: boolean) => void;
  /**
   * Fired when the user has requested to save their {@link PreferencesData}
   *
   * @param data The PreferencesData to save.
   */
  'save-prefs': (data?: PreferencesData) => void;
  /** Fired when the user has requested to create a new file. */
  'new-file-attempt': () => void;
  /**
   * Fired when the user has requested to open a new file.
   *
   * @param file Optionally, the file the user has requested to open. If this
   *   isn't provided, a file picker will be shown. If it is, it will be opened.
   */
  'open-file-attempt': (file?: PlatformFile) => void;
  /**
   * Fired when the user has requested to save a file.
   *
   * @param data The current text stored in the editor.
   */
  'save-file-attempt': (data: string) => void;
  /** Fired when the user has requested to save their current logs. */
  'save-logs': () => void;
  /**
   * Fired when the user has interacted with a dialog that was shown via
   * {@link show-dialog}
   *
   * @param dialogTag The dialog tag for the dialog that was interacted with.
   * @param interactionData Information about the interaction that occurred.
   */
  'dialog-interaction': (
    dialogTag: string,
    interactionData: DialogInteractionData
  ) => void;
  /**
   * Fired when a dialog shown by {@link show-dialog} has been closed by an
   * explicit user interaction.
   *
   * A dialog is considered closed when it's been interacted with (so after
   * {@link dialog-interaction} has fired) or if it's been explicitly cancelled,
   * if that's appropriate for the type of dialog that was shown. This is not
   * fired in the case when {@link close-dialog} has been sent by the platform.
   *
   * @param dialogTag The dialog tag for the dialog that has been closed.
   */
  'dialog-closed': (dialogTag: string) => void;
  /**
   * Fired when the user has requested to revert their file back to a point
   * specified by the given file history.
   *
   * @param history The history to revert to.
   */
  'apply-file-history': (history: ParsedHistoryData) => void;
}

/** Information that the platform wants to send to the renderer. */
export interface PlatformToRendererListener {
  /**
   * Fired when the theme has been updated, whether that been explicitly by the
   * user due to a preferences change or via the system switching themes.
   *
   * @param themeData The new theme.
   */
  'theme-updated': (themeData: ThemeData) => void;
  /**
   * Fired when the preferences have been updated.
   *
   * @param preferenceData The new preferences.
   */
  'prefs-updated': (preferenceData: PreferencesData) => void;
  /**
   * Fired when a new file has been created. Upon receiving this, the renderer
   * should immediately revert to a blank slate without prompting the user.
   */
  'new-file-created': () => void;
  /**
   * Fired when a file has finished being saved.
   *
   * @param error If there was an error saving the file, the error in question.
   * @param currentFilePath The file path of the file that was saved.
   */
  'file-save-ended': (error: Error | null, currentFilePath: string) => void;
  /** Fired when the user has requested to open a "find" dialog via the platform. */
  find: () => void;
  /**
   * Fired when the user has requested to open a "find and replace" dialog via
   * the platform.
   */
  replace: () => void;
  /**
   * Fired when the platform is requesting to know if the file that is currently
   * being edited by the user has been modified.
   *
   * @see is-file-modified
   */
  'check-file-modified': () => void;
  /**
   * Fired when a file has been opened. The renderer should replace whatever
   * text is currently being displayed with the data specified here without prompting.
   *
   * @param error If there was an error opening the file, the error in question.
   * @param data The new text to display to the user.
   * @param clearHistory Whether to clear the undo/redo stack.
   */
  'file-opened': (error: Error, data: string, clearHistory: boolean) => void;
  /** Fired when the platform needs to retrieve the editor text from the renderer. */
  'request-editor-text': () => void;
  /** Fired when the user has requested to undo their last entered text via the platform. */
  undo: () => void;
  /** Fired when the user has requested to redo their last entered text via the platform. */
  redo: () => void;
  /** Fired when the user has requested to open the preferences screen via the platform. */
  'open-prefs': () => void;
  /**
   * Fired when the renderer starts listening on this channel with the most
   * recent ui config.
   *
   * @param config The most recent UI config.
   */
  'ui-config': (config: UiConfig) => void;
  /**
   * Fired whenever the application title has changed.
   *
   * @param title The new title of the applicaiton.
   */
  'app-title-changed': (title: string) => void;
  /** Fired when the user has requested to open the about screen via the platform. */
  'open-about': () => void;
  /**
   * Fired when the platform needs to show a dialog on the renderer.
   *
   * @param dialog Data on the dialog that should be displayed by the renderer.
   */
  'show-dialog': (dialog: DialogData) => void;
  /**
   * Fired when the platform wants to close a dialog that it had previously shown.
   *
   * @param tag The tag of the previously shown dialog.
   */
  'close-dialog': (tag?: string) => void;
  /**
   * Fired when the renderer starts listening on this channel with the most
   * recent file history data.
   *
   * @param history The most recent file history data.
   */
  'file-history': (history: ParsedHistoryData[]) => void;
}

/** All possible channels that the platform can use to talk to the renderer. */
export type RendererChannel = Extract<keyof PlatformToRendererListener, string>;
/** All possible channels that the renderer can use to talk to the platform. */
export type PlatformChannel = Extract<keyof RendererToPlatformListener, string>;

/** Used by the platform to communicate with the renderer. */
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
   * @param onRendererListenerSet A function that will be invoked when the
   *   renderer adds a new listener to the given channel.
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
   * Removes an existing listener for data sent from the renderer to the platform.
   *
   * @param channel The channel previously used to register a listener with.
   * @param listener The listener previously used to register a listener with.
   */
  removeListener<Channel extends PlatformChannel>(
    channel: Channel,
    listener: RendererToPlatformListener[Channel]
  ): this;
}

/** Used by the renderer to communicate with the platform. */
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
   * Removes an existing listener for data sent from the platform to the renderer.
   *
   * @param channel The channel previously used to register a listener with.
   * @param listener The listener previously used to register a listener with.
   */
  removeListener<Channel extends RendererChannel>(
    channel: Channel,
    listener: PlatformToRendererListener[Channel]
  ): this;
}
