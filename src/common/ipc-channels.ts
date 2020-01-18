export enum IpcChannels {
    /** Main -> Renderer: Sent when the system dark mode has changed. */
    THEME_CHANGED = 'dark-mode-toggled',
    /** Renderer -> Main: Sent when the app is prepared for new theme info to be sent. */
    READY_FOR_EVENTS = 'ready-for-events',
    /** Renderer -> Main: The current text in the editor. */
    EDITOR_TEXT = 'editor-text',
    /** Main -> Renderer: Sent when the user invoked the "New" menu item. */
    ATTEMPT_NEW_FILE = 'new-file',
    /** Renderer -> Main: Prompt the user to save their current file before creating a new one. */
    PROMPT_SAVE_FOR_NEW = 'prompt-save-file-for-new',
    /** Renderer -> Main: Prompt the user to save their current file before quitting. */
    PROMPT_SAVE_FOR_QUIT = 'prompt-save-file-for-quit',
    /** Renderer -> Main: Safe to create a new file without losing data. */
    OKAY_FOR_NEW_FILE = 'okay-for-new-file',
    /** Renderer -> Main: Safe to quit the app without losing data. */
    OKAY_FOR_QUIT = 'okay-for-quit',
    /** Main -> Renderer: Sent when the user has created a new file. */
    NEW_FILE_CREATED = 'new-file-created',
    /** Main -> Renderer: Sent when the file has finished saving. */
    FILE_SAVE_ENDED = 'file-save-ended',
    /** Main -> Renderer: Sent when the file has started being saved. */
    FILE_SAVE_STARTED = 'file-save-ended',
    /** Main -> Renderer: Sent when the user invoked the "Find" menu item. */
    FIND = 'find',
    /** Main -> Renderer: Sent when the user invoked the "Replace" menu item. */
    REPLACE = 'replace',

    /**
     * Main -> Renderer: Sent when a new file has been opened.
     *
     * Sent with:
     *
     * error: Error|null -> the error when opening the file, or null.
     * newFileName: string -> the name of the new opened file.
     * data: string -> the contents of the opened file.
     */
    FILE_OPENED = 'file-opened',

    /** Main -> Renderer: Sent when the Main process wants to save a file. Expects Renderer to send EDITOR_TEXT. */
    REQUEST_EDITOR_TEXT = 'request-editor-text',

    /**
     * Main -> Renderer: Sent when the user has invoked the "Quit" menu item. Renderer should respond with either:
     *
     * QUIT
     * PROMPT_SAVE_FOR_QUIT
     */
    ATTEMPT_QUIT = 'attempt-quit',

    /** Main -> Renderer: Sent when the user invoked the "Undo" menu item. */
    UNDO = 'undo',
    /** Main -> Renderer: Sent when the user invoked the "Redo" menu item. */
    REDO = 'redo'
}
