type IpcChannels =
  /** Main -> Renderer: Sent when the system dark mode has changed. */
  | 'dark-mode-toggled'
  /** Renderer -> Main: Sent when the app is prepared for new theme info to be sent. */
  | 'ready-for-events'
  /** Renderer -> Main: The current text in the editor. */
  | 'editor-text'
  /** Main -> Renderer: Sent when the user invoked the "New" menu item. */
  | 'new-file'
  /** Renderer -> Main: Prompt the user to save their current file before creating a new one. */
  | 'prompt-save-file-for-new'
  /** Renderer -> Main: Prompt the user to save their current file before quitting. */
  | 'prompt-save-file-for-quit'
  /** Renderer -> Main: Safe to create a new file without losing data. */
  | 'okay-for-new-file'
  /** Renderer -> Main: Safe to quit the app without losing data. */
  | 'okay-for-quit'
  /** Main -> Renderer: Sent when the user has created a new file. */
  | 'new-file-created'
  /** Main -> Renderer: Sent when the file has finished saving. */
  | 'file-save-ended'
  /** Main -> Renderer: Sent when the file has started being saved. */
  | 'file-save-started'
  /** Main -> Renderer: Sent when the user invoked the "Find" menu item. */
  | 'find'
  /** Main -> Renderer: Sent when the user invoked the "Replace" menu item. */
  | 'replace'

  /**
   * Main -> Renderer: Sent when a new file has been opened.
   *
   * Sent with:
   *
   * error: Error|null -> the error when opening the file| or null.
   * newFileName: string -> the name of the new opened file.
   * data: string -> the contents of the opened file.
   */
  | 'file-opened'

  /** Main -> Renderer: Sent when the Main process wants to save a file. Expects Renderer to send EDITOR_TEXT. */
  | 'request-editor-text'

  /**
   * Main -> Renderer: Sent when the user has invoked the "Quit" menu item. Renderer should respond with either:
   *
   * QUIT
   * PROMPT_SAVE_FOR_QUIT
   */
  | 'attempt-quit'

  /** Main -> Renderer: Sent when the user invoked the "Undo" menu item. */
  | 'undo'
  /** Main -> Renderer: Sent when the user invoked the "Redo" menu item. */
  | 'redo'
  | 'open-prefs'
  | 'save-prefs'
  | 'close-prefs'
  | 'prefs-updated';

export { IpcChannels };
