// tslint:disable:no-console
export const logger: Logger = {
  debug(message: string, ...args: any[]): void {
    console.debug(message, ...args);
  },
  error(message: string, ...args: any[]): void {
    console.error(message, ...args);
  },
  verbose(message: string, ...args: any[]): void {
    console.log(message, ...args);
  },
  warn(message: string, ...args: any[]): void {
    console.warn(message, ...args);
  },
  info(message: string, ...args: any[]): void {
    console.info(message, ...args);
  }
};
