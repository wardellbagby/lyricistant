/**
 * Attempts to get the bottom-most error message in a potential error chain.
 *
 * @param message The error to look through.
 * @returns An error, or an error message.
 */
export const getRootError = (message: any) => {
  if (!message) {
    return message;
  }
  let current = message;
  while (message.stack || message.reason) {
    if (current === (message.stack || message.reason)) {
      break;
    }
    current = message.stack || message.reason;
  }

  return current;
};
/**
 * Returns whether an error is something that should stop Lyricistant from
 * continuing to run or not.
 *
 * @param message The error, or error message, to check.
 * @param url An optional url given by a window.onerror callback.
 */
export const isReportableError = (message: any, url?: string) => {
  if (typeof message === 'string' && message.includes('ResizeObserver')) {
    // https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
    return false;
  }
  return !(
    (!url || url.length === 0) &&
    typeof message === 'string' &&
    message.includes('Script error')
  );
};
/**
 * Sets an error handler on the current window to handle an errors that happen,
 * wrapping any existing error handler.
 */
export const setWindowErrorHandler = () => {
  const oldOnError = window.onerror;
  window.onerror = (message, url, line, col, error) => {
    const rootError = getRootError(message) ?? getRootError(error);
    if (!isReportableError(rootError, url)) {
      return;
    }

    const availableLogger = logger ?? console;
    availableLogger.error(JSON.stringify(rootError), { url, line, col }, error);

    if (oldOnError) {
      oldOnError(rootError, url, line, col, error);
    } else {
      alert(
        [
          'Sorry, Lyricistant has crashed! Please close this page and contact the developers.',
          'Continuing to use Lyricistant may result in undesired behavior.',
          '',
          `App version: ${process.env.APP_VERSION}`,
          `Homepage: ${process.env.APP_HOMEPAGE}`,
        ].join('\n')
      );
    }
  };

  if (!window.onunhandledrejection) {
    window.onunhandledrejection = (event) =>
      window.onerror(event, null, null, null, null);
  }
};
