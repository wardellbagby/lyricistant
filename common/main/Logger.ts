export interface Logger {
  debug: (message: string, ...args: any[]) => void;
  verbose: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  save: () => Promise<void>;
}
