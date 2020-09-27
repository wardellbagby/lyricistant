// tslint:disable:no-console
export class WebLogger implements Logger {
  public debug(message: string, ...args: any[]): void {
    console.debug(message, ...args);
  }

  public error(message: string, ...args: any[]): void {
    console.error(message, ...args);
  }

  public verbose(message: string, ...args: any[]): void {
    console.log(message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    console.warn(message, ...args);
  }

  public info(message: string, ...args: any[]): void {
    console.info(message, ...args);
  }
}
