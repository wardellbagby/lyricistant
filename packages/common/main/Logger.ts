export interface Logger {
  debug: (message: string, ...args: any[]) => void;
  verbose: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  flush?: () => void;
  getPrintedLogs: () => Promise<string[]>;
}

/**
 * A subset of the logger used by the platform for use in the renderer.
 */
export type RendererLogger = Omit<Logger, 'getPrintedLogs'>;
